# PKI Setup with YubiKey Root CA

Complete guide to setting up a two-tier PKI with Root CA protected by YubiKey 5
and a software Intermediate CA. Uses standard tools only — no custom scripts.

---

## What is PKI?

**Public Key Infrastructure (PKI)** is a system for issuing, managing, and verifying
digital certificates. A certificate binds a public key to an identity (a server, a person,
a device), and is signed by a trusted authority so others can verify it.

At the heart of PKI is a **Certificate Authority (CA)** — an entity whose job is to sign
certificates and vouch for the identity of the holder. When your browser sees a TLS
certificate, it walks up a chain of signatures until it reaches a CA it already trusts.

### Key concepts

**Certificate** — a public key + identity + signature from a CA. Anyone can read it.

**Private key** — the secret counterpart to the public key. Never shared. Used to prove
identity and to sign things (like other certificates).

**Trust anchor** — a Root CA certificate that is explicitly trusted. Distributed to all
clients/devices in advance.

**Chain of trust** — a certificate is trusted if it was signed by a trusted CA,
or by a CA that was signed by a trusted CA, and so on up to the root.

---

## PKI Hierarchy — How Tiering Works

Rather than using a single CA for everything, PKI is typically structured in tiers.
This limits the blast radius if any one key is compromised and keeps the most sensitive
key (Root CA) offline and rarely used.

```
┌─────────────────────────────────────────────────────────┐
│                      ROOT CA                            │
│                                                         │
│  • Self-signed (trusts itself)                          │
│  • Signs Intermediate CA certificates only              │
│  • Kept OFFLINE — in a safe, on a YubiKey               │
│  • Used once every few years                            │
│  • If compromised: entire PKI must be rebuilt           │
└───────────────────────┬─────────────────────────────────┘
                        │  signs
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  INTERMEDIATE CA                        │
│                                                         │
│  • Signed by Root CA                                    │
│  • Signs end-entity certificates (servers, clients)     │
│  • Key lives on disk (encrypted)                        │
│  • Used regularly for day-to-day signing                │
│  • If compromised: revoke & reissue, Root CA untouched  │
└───────────────────────┬─────────────────────────────────┘
                        │  signs
                        ▼
┌─────────────────────────────────────────────────────────┐
│               END-ENTITY CERTIFICATES                   │
│                                                         │
│  • TLS server certificates  (HTTPS)                     │
│  • Client certificates      (mTLS, VPN, SSH)            │
│  • Code signing certificates                            │
│  • User / device certificates                           │
└─────────────────────────────────────────────────────────┘
```

### Why two tiers?

Keeping the Root CA offline means it is never exposed to network attacks. If the
Intermediate CA key is ever compromised, you can revoke it and issue a new one —
signed by the Root CA which is still safe. Without tiering, a single compromised
CA key destroys the entire PKI.

### Why YubiKey for the Root CA?

A YubiKey with PIV support stores the private key in hardware. The key is generated
on-device and is **non-exportable** — it physically cannot be read out. Every signing
operation requires the physical device plus a PIN, and with touch policy enabled,
requires a human to physically tap the key. This provides hardware-level protection
equivalent to a dedicated HSM at a fraction of the cost.

---

## Prerequisites

```bash
sudo apt install yubikey-manager yubico-piv-tool ykcs11 openssl gnutls-bin
```

## Part 1 — Secure the YubiKey

Change all default credentials before doing anything else:

```bash
# Change PIN (default: 123456)
ykman piv access change-pin

# Change PUK (default: 12345678)
ykman piv access change-puk

# Generate and protect management key with PIN
ykman piv access change-management-key --generate --protect
```

## Part 2 — Generate Root CA Key on YubiKey

The private key is generated ON the YubiKey and never leaves it.

```bash
# Generate EC P-384 key in slot 9C (Digital Signature)
ykman piv keys generate \
  --algorithm ECCP384 \
  --pin-policy ALWAYS \
  --touch-policy ALWAYS \
  9c pubkey.pem
```

- `pubkey.pem` — only the public key is exported (safe to keep)
- `--touch-policy ALWAYS` — physical touch required every signing operation

Verify:

```bash
ykman piv info
# Slot 9C should show ECCP384
```

## Part 3 — Create Root CA Certificate

```bash
mkdir -p ~/pki

yubico-piv-tool \
  --action=verify-pin \
  --action=selfsign-certificate \
  --slot=9c \
  --subject="/C=PL/O=YourOrg/CN=YourOrg Root CA/" \
  --valid-days=7300 \
  --input=pubkey.pem \
  --output=~/pki/root-ca.crt \
  --hash=SHA384
```

> **Note:** Subject requires leading AND trailing `/` — this is yubico-piv-tool syntax.

Verify:

```bash
openssl x509 -in ~/pki/root-ca.crt -text -noout | \
  grep -E "Subject:|Issuer:|CA:|Signature Alg"
```

## Part 4 — Import Root Cert back into YubiKey

Required so PKCS#11 can read the public key from the token:

```bash
ykman piv certificates import 9c ~/pki/root-ca.crt
```

## Part 5 — Register libykcs11 with p11-kit

So certtool and other tools can find the YubiKey PKCS#11 module:

```bash
sudo mkdir -p /etc/pkcs11/modules

sudo tee /etc/pkcs11/modules/ykcs11.module << 'EOF'
module: /usr/lib/x86_64-linux-gnu/libykcs11.so
EOF
```

Verify:

```bash
p11-kit list-modules
# Should show: module: ykcs11 → token: YubiKey PIV #XXXXXXXX
```

Get the exact private key URI (needed for signing):

```bash
p11tool --provider /usr/lib/x86_64-linux-gnu/libykcs11.so \
  --list-privkeys --login
```

Note the full URL of `Private key for Digital Signature` — you'll need it below.

## Part 6 — Generate Intermediate CA Key and CSR

```bash
mkdir -p ~/pki/intermediate/{certs,crl,csr,newcerts}
chmod 700 ~/pki/intermediate
touch ~/pki/intermediate/index.txt
echo 1000 > ~/pki/intermediate/serial

# Generate encrypted EC P-384 key (set a strong passphrase)
openssl genpkey \
  -algorithm EC \
  -pkeyopt ec_paramgen_curve:P-384 \
  -aes256 \
  -out ~/pki/intermediate/intermediate.key.pem

chmod 400 ~/pki/intermediate/intermediate.key.pem

# Generate CSR
openssl req -new \
  -key ~/pki/intermediate/intermediate.key.pem \
  -out ~/pki/intermediate/intermediate.csr.pem \
  -subj "/C=PL/O=YourOrg/CN=YourOrg Intermediate CA"
```

Verify:

```bash
openssl req -in ~/pki/intermediate/intermediate.csr.pem -text -noout | \
  grep -E "Subject:|Public Key"
```

## Part 7 — Sign Intermediate with Root CA (YubiKey)

Create the intermediate CA extensions template:

```bash
cat > /tmp/intermediate.tmpl << 'EOF'
cn = "YourOrg Intermediate CA"
organization = "YourOrg"
country = PL
ca
path_len = 0
cert_signing_key
crl_signing_key
expiration_days = 1825
EOF
```

Sign using certtool with the YubiKey. Use the exact URI from Part 5,
with `pin-value` appended:

```bash
certtool \
  --generate-certificate \
  --load-request ~/pki/intermediate/intermediate.csr.pem \
  --load-ca-certificate ~/pki/root-ca.crt \
  --load-ca-privkey "pkcs11:model=YubiKey%20YK5;manufacturer=Yubico%20%28www.yubico.com%29;serial=XXXXXXXX;token=YubiKey%20PIV%20%23XXXXXXXX;id=%02;object=Private%20key%20for%20Digital%20Signature;type=private;pin-value=YOURPIN" \
  --template /tmp/intermediate.tmpl \
  --outfile ~/pki/intermediate/intermediate.crt.pem
```

> **Touch the YubiKey when it blinks!**

Replace `XXXXXXXX` with your YubiKey serial number and `YOURPIN` with your PIN.

## Part 8 — Verify the Chain

```bash
# Inspect intermediate cert
openssl x509 -in ~/pki/intermediate/intermediate.crt.pem -text -noout

# Verify chain — must show OK
openssl verify \
  -CAfile ~/pki/root-ca.crt \
  ~/pki/intermediate/intermediate.crt.pem

# Create full chain file (for TLS)
cat ~/pki/intermediate/intermediate.crt.pem \
    ~/pki/root-ca.crt > ~/pki/intermediate/chain.pem
```

## Final PKI Structure

```
~/pki/
├── root-ca.crt                     ← Root CA cert (distribute to clients)
├── intermediate/
│   ├── intermediate.key.pem        ← Intermediate private key (encrypted)
│   ├── intermediate.csr.pem        ← Intermediate CSR (can discard)
│   ├── intermediate.crt.pem        ← Intermediate certificate
│   └── chain.pem                   ← Full chain (intermediate + root)
└── root/
    ├── index.txt                   ← Certificate database
    └── serial                      ← Serial counter

YubiKey slot 9C:
    Private key  (EC P-384, never extractable)
    Certificate  (YourOrg Root CA)
```

## Signing End-Entity Certificates (Daily Use)

No YubiKey needed — use the intermediate key directly:

```bash
# Create intermediate CA config
cat > ~/pki/intermediate/intermediate.cnf << 'EOF'
[ca]
default_ca = CA_default

[CA_default]
dir           = /home/YOUR_USER/pki/intermediate
database      = $dir/index.txt
serial        = $dir/serial
new_certs_dir = $dir/newcerts
certificate   = $dir/intermediate.crt.pem
private_key   = $dir/intermediate.key.pem
default_days  = 365
default_md    = sha384
policy        = policy_any

[policy_any]
countryName            = optional
organizationName       = optional
commonName             = supplied

[server_cert]
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints       = critical,CA:false
keyUsage               = critical,digitalSignature,keyEncipherment
extendedKeyUsage       = serverAuth
EOF

# Sign a server cert
openssl ca \
  -config ~/pki/intermediate/intermediate.cnf \
  -extensions server_cert \
  -days 365 -notext \
  -in server.csr.pem \
  -out server.crt.pem
```

## Security Notes

| Item | Recommendation |
|---|---|
| YubiKey PIN | Strong, unique, not written down |
| YubiKey PUK | Store securely offline |
| Intermediate key passphrase | Strong, stored in password manager |
| Root CA cert | Distribute to all clients/devices |
| YubiKey physical device | Store in a safe when not in use |
| Backup | Keep a second YubiKey as backup |

> **Warning:** The root CA private key is non-exportable from the YubiKey.
> If you lose the device without a backup, the root CA is gone permanently
> and you must start over with a new root CA distributed to all clients.
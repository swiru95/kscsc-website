## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [AWS Setup](#aws-setup)
   - [Create S3 Bucket](#1-create-s3-bucket)
   - [Set up IAM Roles Anywhere](#2-set-up-iam-roles-anywhere)
   - [Create IAM Role for Devices](#3-create-iam-role-for-devices)
   - [Create Profile](#4-create-profile-in-roles-anywhere)
4. [Issue Device Certificate](#issue-device-certificate)
5. [macOS Setup](#macos-setup)
6. [Verification](#verification)
7. [Adding More Devices](#adding-more-devices)
8. [Cost Estimate](#cost-estimate)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          macOS Device (e.g. Mac Pro)                     │
│                                                                          │
│  ┌──────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │ Unified Log      │  │  Fluent Bit        │  │  start.sh wrapper  │    │
│  │ (auth, ssh,      ├─►│  - exec inputs     │◄─┤  - refreshes creds │    │
│  │  firewall,       │  │  - reads creds     │  │  - timeout 55m     │    │
│  │  security)       │  │  - uploads to S3   │  │  - launchd restart │    │
│  └──────────────────┘  └─────────┬──────────┘  └────────────────────┘    │
│                                  │                                       │
│                                  │ uses temp credentials                 │
│                                  ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  aws_signing_helper                                                │  │
│  │  Cert (X.509) + Private Key + Trust Anchor ARN + Profile + Role    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ HTTPS (TLS) — Roles Anywhere session
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                                AWS Cloud                                 │
│                                                                          │
│  ┌────────────────────┐    ┌──────────────────┐    ┌─────────────────┐   │
│  │ IAM Roles Anywhere │    │  IAM Role        │    │   S3 Bucket     │   │
│  │  - Trust Anchor    ├───►│ (RolesAnywhere   ├───►│ macos-security  │   │
│  │  - Profile         │    │  ForMacos)       │    │ -logs           │   │
│  │  - Verifies cert   │    │  s3:PutObject on │    │                 │   │
│  │    against your CA │    │  CN-scoped path  │    │ /logs/CN/...    │   │
│  └────────────────────┘    └──────────────────┘    └────────┬────────┘   │
│                                                             │            │
│                                                             ▼            │
│                                                    ┌─────────────────┐   │
│                                                    │   Splunk        │   │
│                                                    │   (S3 input)    │   │
│                                                    └─────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. macOS Unified Log generates security events (auth, ssh, firewall, etc.)
2. Fluent Bit `exec` input runs `log show` every 60 seconds
3. Logs are buffered locally in `/tmp/fluent-bit-s3`
4. Every 60 seconds, Fluent Bit uploads buffered logs to S3
5. The S3 plugin reads short-lived credentials from the AWS credentials file
6. `aws_signing_helper` exchanges X.509 certificate → temporary AWS credentials (1hr lifetime)
7. Credentials auto-refresh every 55 minutes via Fluent Bit restart cycle
8. Splunk pulls logs from S3 for analysis

---

## Prerequisites

- All names in the examples below are placeholders. Replace them with your own device aliases, bucket names, and IAM resource names.
- An AWS account
- A working **Step CA** (or any CA that can issue X.509 certs) with an Intermediate CA in PEM format
- macOS Sequoia (or later) on each device
- Homebrew installed
- Each device has a unique hostname (used as certificate CN)

---

## AWS Setup

### 1. Create S3 Bucket

In AWS Console → S3 → Create Bucket:

- **Name:** `example-security-logs` (must be globally unique)
- **Region:** e.g. `eu-central-1`
- **Block all public access:** ON (default)
- **Encryption:** SSE-S3 (default)
- **Versioning:** Recommended

---

### 2. Set up IAM Roles Anywhere

#### 2a. Create Trust Anchor

The Trust Anchor tells AWS which CA to trust. You upload your **Intermediate CA certificate** (keep your Root CA offline).

**AWS Console → IAM → Roles Anywhere → Trust Anchors → Create Trust Anchor**

- **Name:** `device-ingest-ca`
- **CA type:** External certificate bundle
- **Certificate data:** paste your Intermediate CA cert in PEM format

```
-----BEGIN CERTIFICATE-----
(your intermediate CA cert)
-----END CERTIFICATE-----
```

Or via CLI:
```bash
aws rolesanywhere create-trust-anchor \
  --name "device-ingest-ca" \
  --source "sourceType=CERTIFICATE_BUNDLE,sourceData={x509CertificateData=$(cat intermediate-ca.pem)}" \
  --enabled
```

Save the **Trust Anchor ARN** for later.

---

### 3. Create IAM Role for Devices

**AWS Console → IAM → Roles → Create Role → Custom trust policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "rolesanywhere.amazonaws.com"
      },
      "Action": [
        "sts:AssumeRole",
        "sts:TagSession",
        "sts:SetSourceIdentity"
      ],
      "Condition": {
        "StringEquals": {
          "aws:PrincipalTag/x509Subject/CN": [
            "DEVICE-01",
            "DEVICE-02"
          ]
        }
      }
    }
  ]
}
```

> The condition restricts which certificate CNs can assume the role — only your specific hostnames.

#### Attach this permission policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::example-security-logs/logs/${aws:PrincipalTag/x509Subject/CN}/*"
    }
  ]
}
```

> The dynamic `${aws:PrincipalTag/x509Subject/CN}` automatically scopes each device to its own S3 path matching its certificate CN.

- **Role name:** `MacosLogIngestRole`

Save the **Role ARN** for later.

---

### 4. Create Profile in Roles Anywhere

**AWS Console → IAM → Roles Anywhere → Profiles → Create Profile**

- **Name:** `macos-log-ingest-profile`
- **Roles:** select `MacosLogIngestRole`
- **Session duration:** 3600 seconds (1 hour)

Save the **Profile ARN** for later.

---

You should now have three ARNs:
```
Trust Anchor ARN: arn:aws:rolesanywhere:REGION:ACCOUNT:trust-anchor/UUID
Profile ARN:      arn:aws:rolesanywhere:REGION:ACCOUNT:profile/UUID
Role ARN:         arn:aws:iam::ACCOUNT:role/MacosLogIngestRole
```

---

## Issue Device Certificate

For each macOS device, issue an X.509 certificate with the **hostname as CN**.

### Using Step CA

```bash
# On the Step CA server — issue cert for each device
step ca certificate "DEVICE-01" device.crt device.key \
  --ca-url https://your-step-ca-url \
  --root /path/to/root-ca.crt \
  --not-after 24h \
  --no-password \
  --insecure
```

> Short cert lifetime (24h) is best practice — cert auto-renews via `step ca renew --daemon` on the device, or you can use longer lifetimes if simpler.

### Certificate requirements
- CN must match exactly the hostname expected in the IAM Role trust policy condition
- Must be signed by the Intermediate CA registered as Trust Anchor in AWS
- Private key must be unencrypted (or use Step Agent for renewal)

---

## macOS Setup

Run all of these on each macOS device.

### 1. Install Fluent Bit

```bash
brew install fluent-bit
```

### 2. Install AWS Signing Helper

```bash
# For Apple Silicon (M1/M2/M3+)
curl -Lo aws_signing_helper \
  "https://rolesanywhere.amazonaws.com/releases/1.8.2/Aarch64/MacOS/Sonoma/aws_signing_helper"

# Verify it's a real binary
file aws_signing_helper
# Should show: Mach-O 64-bit executable arm64

chmod +x aws_signing_helper
sudo mv aws_signing_helper /usr/local/bin/
```

### 3. Install GNU coreutils

```bash
brew install coreutils
```

This provides `gtimeout` which is needed for the auto-restart wrapper.

### 4. Place Device Certificate and Key

```bash
sudo mkdir -p /opt/homebrew/etc/fluent-bit/certs
sudo cp device.crt /opt/homebrew/etc/fluent-bit/certs/
sudo cp device.key /opt/homebrew/etc/fluent-bit/certs/
sudo cp intermediate-ca.crt /opt/homebrew/etc/fluent-bit/certs/

sudo chmod 600 /opt/homebrew/etc/fluent-bit/certs/device.key
sudo chmod 644 /opt/homebrew/etc/fluent-bit/certs/device.crt
sudo chmod 644 /opt/homebrew/etc/fluent-bit/certs/intermediate-ca.crt
sudo chown -R root /opt/homebrew/etc/fluent-bit/certs/
```

Also create the directory for credentials:
```bash
sudo mkdir -p /opt/homebrew/etc/fluent-bit/aws
```

### 5. Test Roles Anywhere Authentication

```bash
aws_signing_helper credential-process \
  --certificate /opt/homebrew/etc/fluent-bit/certs/device.crt \
  --private-key /opt/homebrew/etc/fluent-bit/certs/device.key \
  --intermediates /opt/homebrew/etc/fluent-bit/certs/intermediate-ca.crt \
  --trust-anchor-arn arn:aws:rolesanywhere:REGION:ACCOUNT:trust-anchor/UUID \
  --profile-arn arn:aws:rolesanywhere:REGION:ACCOUNT:profile/UUID \
  --role-arn arn:aws:iam::ACCOUNT:role/MacosLogIngestRole
```

You should get JSON with temporary credentials:
```json
{
  "Version": 1,
  "AccessKeyId": "ASIA...",
  "SecretAccessKey": "...",
  "SessionToken": "...",
  "Expiration": "2026-04-26T15:00:00Z"
}
```

If this works, you've successfully bound the device certificate to AWS.

### 6. Configure Fluent Bit

```bash
sudo nano /opt/homebrew/etc/fluent-bit/fluent-bit.conf
```

```ini
[SERVICE]
    Flush        5
    Daemon       Off
    Log_Level    info

# SSH & Remote Access
[INPUT]
    Name          exec
    Tag           macos.ssh
    Command       log show --predicate 'subsystem == "com.openssh.sshd"' --last 1m --style syslog
    Interval_Sec  60

# Authentication & sudo
[INPUT]
    Name          exec
    Tag           macos.auth
    Command       log show --predicate 'eventMessage contains "authentication" OR eventMessage contains "sudo" OR eventMessage contains "authorize"' --last 1m --style syslog
    Interval_Sec  60

# Failed logins & lockouts
[INPUT]
    Name          exec
    Tag           macos.failures
    Command       log show --predicate 'eventMessage contains "failed" OR eventMessage contains "denied" OR eventMessage contains "locked"' --last 1m --style syslog
    Interval_Sec  60

# Firewall events
[INPUT]
    Name          exec
    Tag           macos.firewall
    Command       log show --predicate 'subsystem == "com.apple.alf"' --last 1m --style syslog
    Interval_Sec  60

# System integrity & Gatekeeper
[INPUT]
    Name          exec
    Tag           macos.security
    Command       log show --predicate 'subsystem == "com.apple.securityd" OR subsystem == "com.apple.ManagedClient"' --last 1m --style syslog
    Interval_Sec  60

[OUTPUT]
    Name              s3
    Match             *
  bucket            example-security-logs
    region            eu-central-1
    store_dir         /tmp/fluent-bit-s3
  s3_key_format     /logs/DEVICE-01/%Y/%m/%d/$TAG-%H%M%S.log
    total_file_size   1M
    upload_timeout    60s
```

> **Important:** The path `/logs/DEVICE-01/` must match the **certificate CN** since the IAM policy uses `${aws:PrincipalTag/x509Subject/CN}`. Each device has its own certificate CN and matching S3 path.

### 7. Create Credential Refresh Script

```bash
sudo nano /opt/homebrew/etc/fluent-bit/creds-refresh.sh
```

```bash
#!/bin/bash
CREDS=$(/usr/local/bin/aws_signing_helper credential-process \
  --certificate /opt/homebrew/etc/fluent-bit/certs/device.crt \
  --private-key /opt/homebrew/etc/fluent-bit/certs/device.key \
  --intermediates /opt/homebrew/etc/fluent-bit/certs/intermediate-ca.crt \
  --trust-anchor-arn arn:aws:rolesanywhere:REGION:ACCOUNT:trust-anchor/UUID \
  --profile-arn arn:aws:rolesanywhere:REGION:ACCOUNT:profile/UUID \
  --role-arn arn:aws:iam::ACCOUNT:role/MacosLogIngestRole)

cat > /opt/homebrew/etc/fluent-bit/aws/credentials << EOF
[default]
aws_access_key_id = $(echo $CREDS | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKeyId'])")
aws_secret_access_key = $(echo $CREDS | python3 -c "import sys,json; print(json.load(sys.stdin)['SecretAccessKey'])")
aws_session_token = $(echo $CREDS | python3 -c "import sys,json; print(json.load(sys.stdin)['SessionToken'])")
EOF

chmod 600 /opt/homebrew/etc/fluent-bit/aws/credentials
echo "$(date) Credentials refreshed"
```

```bash
sudo chmod 700 /opt/homebrew/etc/fluent-bit/creds-refresh.sh
sudo chown root /opt/homebrew/etc/fluent-bit/creds-refresh.sh
```

### 8. Create Start Wrapper Script

This script:
1. Refreshes credentials at startup
2. Runs Fluent Bit for 55 minutes (well under the 1hr token lifetime)
3. Lets `launchd` restart it via `KeepAlive`, which triggers another credential refresh

```bash
sudo nano /opt/homebrew/etc/fluent-bit/start.sh
```

```bash
#!/bin/bash

# Refresh credentials before starting
/opt/homebrew/etc/fluent-bit/creds-refresh.sh

# Run Fluent Bit for 55 minutes then exit (launchd KeepAlive will restart it)
exec /opt/homebrew/bin/gtimeout 3300 /opt/homebrew/bin/fluent-bit -c /opt/homebrew/etc/fluent-bit/fluent-bit.conf
```

```bash
sudo chmod 700 /opt/homebrew/etc/fluent-bit/start.sh
sudo chown root /opt/homebrew/etc/fluent-bit/start.sh
```

### 9. Grant Full Disk Access

Fluent Bit needs Full Disk Access to read system logs:

1. **System Settings → Privacy & Security → Full Disk Access**
2. Click 🔒 → authenticate
3. Click `+` → press `Cmd + Shift + G` → enter `/opt/homebrew/bin/`
4. Select `fluent-bit` → toggle ON

### 10. Setup launchd Service

```bash
sudo nano /Library/LaunchDaemons/io.fluentbit.plist
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>io.fluentbit</string>

    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/etc/fluent-bit/start.sh</string>
    </array>

    <key>EnvironmentVariables</key>
    <dict>
        <key>AWS_SHARED_CREDENTIALS_FILE</key>
        <string>/opt/homebrew/etc/fluent-bit/aws/credentials</string>
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/opt/homebrew/var/log/fluent-bit.log</string>

    <key>StandardErrorPath</key>
    <string>/opt/homebrew/var/log/fluent-bit-error.log</string>

    <key>UserName</key>
    <string>root</string>
</dict>
</plist>
```

Set permissions and load:
```bash
sudo chown root:wheel /Library/LaunchDaemons/io.fluentbit.plist
sudo chmod 644 /Library/LaunchDaemons/io.fluentbit.plist
sudo launchctl bootstrap system /Library/LaunchDaemons/io.fluentbit.plist
```

---

## Verification

### Check service is running

```bash
sudo launchctl list | grep fluent
# Should show: PID  0  io.fluentbit
```

### Watch live logs

```bash
sudo tail -f /opt/homebrew/var/log/fluent-bit.log
```

You should see:
```
[info] [output:s3:s3.0] Successfully uploaded object /logs/DEVICE-01/2026/04/26/macos.auth-...
```

### Verify in AWS S3 Console

Navigate to your bucket → `logs/DEVICE-01/YYYY/MM/DD/` — you should see log files appearing every minute.

### Service management commands

```bash
# Stop service
sudo launchctl bootout system /Library/LaunchDaemons/io.fluentbit.plist

# Start service
sudo launchctl bootstrap system /Library/LaunchDaemons/io.fluentbit.plist

# Manual credential refresh (for testing)
sudo /opt/homebrew/etc/fluent-bit/creds-refresh.sh
sudo cat /opt/homebrew/etc/fluent-bit/aws/credentials
```

---

## Adding More Devices

For each new device:

1. **Add hostname to IAM Role trust policy condition:**
   ```json
   "aws:PrincipalTag/x509Subject/CN": [
    "DEVICE-01",
    "DEVICE-02",
    "DEVICE-03"
   ]
   ```

2. **Issue a new certificate** with the new device's hostname as CN

3. **Follow the macOS setup steps** on the new device, replacing `DEVICE-01` with that device's CN in:
   - `s3_key_format` in fluent-bit.conf
   - certificate filenames in `creds-refresh.sh`

No new IAM users, no new policies — the dynamic `${aws:PrincipalTag/x509Subject/CN}` handles routing automatically based on the cert CN.

---

## Cost Estimate

| Resource | Estimated Monthly Cost |
|---|---|
| S3 Storage (~1-5 GB) | ~$0.02 - $0.12 |
| S3 PUT Requests (~170k/month per device) | ~$0.85 |
| Data Transfer Out (to Splunk) | ~$0.09 - $0.45 |
| IAM Roles Anywhere | Free |
| **Total per device** | **~$1/month** |

> Set up an **S3 Lifecycle Policy** to auto-delete logs older than 90 days to keep costs minimal.

---

## Security Considerations

| Control | Implementation |
|---|---|
| No long-lived credentials | Roles Anywhere with 1hr temp tokens |
| Per-device identity | Each device has unique X.509 cert |
| Least privilege | Each cert can only write to its own S3 path |
| Encryption in transit | All HTTPS/TLS |
| Encryption at rest | S3 SSE-S3 |
| No public S3 access | Block all public access |
| Private key protection | Root-only readable, chmod 600 |
| Cert auto-renewal | Optional via `step ca renew --daemon` |
| Auto-restart | launchd `KeepAlive` for self-healing |

---

## Architecture Decision Notes

### Why IAM Roles Anywhere over static IAM users?
- No long-lived credentials on devices
- Compromised cert expires within token lifetime (1hr)
- Cert can be revoked at the CA without AWS changes
- Better audit trail per device

### Why Fluent Bit over native macOS log forwarding?
- Lightweight (~450KB memory)
- CNCF-graduated open source project
- Cross-platform (same setup works on Linux, less work for mixed fleets)
- Direct S3 integration without intermediaries

### Why the timeout/restart pattern?
Fluent Bit's S3 plugin **does not natively support `credential_process`** on macOS (only Linux). It also doesn't reliably re-read the credentials file when contents change. The cleanest workaround is to restart Fluent Bit periodically — `start.sh` refreshes credentials on each restart, and `gtimeout` ensures restarts happen before token expiry.

### Why 55 minutes timeout vs 50?
- AWS Roles Anywhere tokens last 1 hour (3600s)
- 55 minutes (3300s) gives a 5-minute safety margin
- Less restart frequency = fewer duplicate logs
- Still well within token lifetime
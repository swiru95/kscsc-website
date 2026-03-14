# Access Control Policy

**Document ID:** ACP-001  
**Version:** 1.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**ISO 27001 Reference:** A.9, A.8.3

---

## 1. Purpose

This policy defines access control principles and requirements for all systems, devices, and services used in business operations. It ensures that access to information assets is appropriately restricted, authenticated, and logged.

## 2. Scope

Applies to:
- Endpoint devices: MacBook Pro, Mac Mini, MSI/Kali Linux
- Server infrastructure: Proxmox host, Debian VM(s), Splunk instance
- Cloud services: Microsoft 365 Business Premium, Microsoft Azure, OneDrive for Business
- Network: OpenVPN infrastructure
- Any third-party tools or platforms used during client engagements

## 3. Principles

- **Least Privilege** – Access is granted only to the minimum resources required for a task
- **Need to Know** – Access to client data is restricted to the duration and scope of the engagement
- **Default Deny** – All access is denied unless explicitly permitted
- **Segregation** – Business, personal, and client engagement environments are logically separated where possible

## 4. Authentication Requirements

### 4.1 Password Policy

| Requirement | Standard |
|---|---|
| Minimum length | 16 characters for service accounts; 20+ for critical systems |
| Complexity | Mix of upper, lower, numbers, symbols; no dictionary words |
| Reuse | No reuse of last 12 passwords |
| Storage | Password manager only (e.g. Bitwarden, 1Password) – no plaintext, no browser save for critical accounts |
| Sharing | Passwords are never shared |

### 4.2 Multi-Factor Authentication (MFA)

MFA is **mandatory** for:

| System | MFA Method |
|---|---|
| Microsoft 365 / Azure | Authenticator app (TOTP or push) |
| macOS login (if remote access enabled) | System-level controls |
| VPN (OpenVPN) | Certificate-based authentication + optional TOTP |
| Proxmox web UI | Strong password (isolated network, not internet-exposed) |
| Splunk web UI | Strong password (local network only) |
| Any SaaS tool with client data access | Authenticator app |

MFA backup codes are stored in the password manager, encrypted.

### 4.3 SSH Access

- Password authentication: **disabled**
- Key-based authentication: **required**
- SSH keys: minimum RSA 4096 or Ed25519
- Private keys: protected with a passphrase
- Root login via SSH: **disabled** (`PermitRootLogin no`)
- Authorised key inventory maintained in Asset Register (AST-001)

## 5. Device Access Controls

### 5.1 Screen Lock and Idle Timeout

| Device | Lock Timeout |
|---|---|
| MacBook Pro | ≤ 5 minutes idle |
| Mac Mini | ≤ 5 minutes idle |
| MSI / Kali Linux | ≤ 5 minutes idle |

### 5.2 Disk Encryption

| Device | Encryption |
|---|---|
| MacBook Pro | FileVault 2 (enabled, recovery key stored securely offline) |
| Mac Mini | FileVault 2 |
| MSI / Kali Linux | LUKS full-disk encryption |
| Proxmox host | Disk encryption at volume/VM level |

### 5.3 Physical Access

- All devices are physically secured when unattended
- Devices are not left unattended in public spaces
- Devices used in public spaces use a privacy screen

## 6. Network Access

### 6.1 OpenVPN

- Certificates issued per device; no shared certificates
- Certificate validity reviewed annually
- Revocation list (CRL) maintained and current
- VPN logs retained per Monitoring Policy (MON-001)

### 6.2 Proxmox / Local Network

- Proxmox management UI is not exposed to the public internet
- Access to the Proxmox host is via local network or VPN only
- Firewall rules follow default-deny with explicit allow rules documented

### 6.3 Azure

- Network Security Groups (NSGs) applied to all resources
- No resources with public IP unless explicitly required and documented
- Azure resources provisioned in EU regions (Poland Central or West Europe preferred)
- Privileged Identity Management (PIM) or role assignment review every 6 months

## 7. Client Engagement Access

- Credentials obtained during client engagements (test accounts, API keys, etc.) are:
  - Stored in an engagement-specific vault entry in the password manager
  - Labelled with engagement name and expiry
  - Deleted or returned to the client at engagement close
- Client network access (VPN, jump hosts) is terminated immediately upon engagement completion
- Engagement-specific SSH keys are generated per engagement and deleted after

## 8. Third-Party and Subcontractor Access

- The business does not currently engage subcontractors with access to client systems
- If this changes, a formal access request, NDA, and time-limited access grant are required before any access is provided

## 9. Access Review

| Scope | Frequency |
|---|---|
| Azure role assignments | Every 6 months |
| Microsoft 365 licences and permissions | Annual |
| SSH authorised keys | Annual |
| OpenVPN certificates | Annual |
| Active engagement credentials | At engagement close |

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

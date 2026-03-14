# Access Control Policy

**Document ID:** ACP-001  
**Version:** 2.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**ISO 27001 Reference:** A.9, A.8.3

---

## 1. Purpose

This policy defines access control principles and requirements for all systems, devices, and services used in business operations. It ensures that access to information assets is appropriately restricted, authenticated, and logged.

## 2. Scope

Applies to:
- Business computers (local devices)
- Server infrastructure (virtualization hosts, application servers)
- Cloud services (email, collaboration, storage, compute)
- Network infrastructure (VPN, firewalls, routers)
- Any tools or platforms used in client engagements

## 3. Principles

- **Least Privilege** – Access is granted only to the minimum resources required for a task
- **Need to Know** – Access to client data is restricted to the duration and scope of the engagement
- **Default Deny** – All access is denied unless explicitly permitted
- **Segregation** – Business, personal, and client engagement environments are logically separated where possible

## 4. Authentication Requirements

### 4.1 Authentication Hierarchy

Authentication follows a priority order, applied to all systems and services:

1. **Passwordless Authentication / Passkeys** – Preferred where available (biometric, hardware key, platform-native authentication)
2. **Single Sign-On (SSO) via Identity Provider** – Preferred for cloud services where passkeys are not available
3. **Password-Based Authentication** – Used only when passwordless and SSO are not available
   - Minimum length: 12+ characters
   - Storage: Secure credential vault or password manager only – no plaintext, no browser storage
   - Passwords are never shared or reused across systems

### 4.2 Multi-Factor Authentication (MFA)

**MFA is mandatory for all administrative access** to business devices and services, including:
- Administrative access to cloud services
- Server management interfaces
- VPN access
- Any service with access to client or business data

Acceptable MFA methods:
- Biometric authentication (where platform-supported)
- Hardware security keys
- Time-based one-time password (TOTP) authenticator app
- Platform-provided authentication methods

Backup MFA codes, if applicable, are stored securely in the password manager.

### 4.3 Key-Based Access

Where key-based authentication is used (e.g., remote server access):
- Key authentication is required; password authentication is disabled
- Private keys are protected with a strong passphrase
- Root-level access is restricted and audited
- Key inventory is maintained and reviewed annually

## 5. Device Access Controls

### 5.1 Screen Lock and Idle Timeout

| Device Category | Lock Timeout |
|---|---|
| Business computers | ≤ 5 minutes idle |
| Servers (if local access configured) | ≤ 5 minutes idle |

### 5.2 Disk Encryption

All business computers and servers have full-disk encryption enabled with platform-managed or strong encryption keys.

### 5.3 Physical Access

- All devices are physically secured when unattended
- Devices are not left unattended in public spaces
- Devices used in public spaces use a privacy screen

## 6. Cloud Services

Access to cloud services follows the authentication hierarchy (Section 4.1):
- Passwordless authentication or passkeys are preferred
- SSO via identity provider is enabled where available
- All administrative roles have MFA enforced
- Cloud resources are provisioned in compliant regions (EU-based preferred)
- Role-based access control (RBAC) is implemented with least-privilege assignment
- Privileged role assignments are reviewed every 6 months

## 7. Network Access

- VPN access requires strong authentication and MFA
- Certificates used for network authentication are reviewed and renewed annually
- Network infrastructure (firewalls, routers) follows a default-deny approach; all access rules are documented
- VPN and network logs are retained per Monitoring Policy

## 8. Client Engagement Access

Credentials obtained during client engagements (test accounts, API keys, temporary access) are:
  - Stored in an engagement-specific vault in the password manager
  - Labelled with engagement name and documentation of permitted scope and expiry
  - Deleted or returned to the client at engagement close
- Client network access is terminated immediately upon engagement completion
- Engagement-specific access keys are generated per engagement and securely deleted after engagement close

## 9. Third-Party and Subcontractor Access

- The business does not currently engage subcontractors with access to client systems
- If this changes, a formal access request, NDA, and time-limited access grant are required before any access is provided

## 10. Access Review

| Scope | Frequency |
|---|---|
| Cloud service role assignments | Every 6 months |
| User permissions and cloud access | Annual |
| Authentication keys and certificates | Annual |
| Active engagement credentials | At engagement close |

---

*Approved by:* Krzysztof Swidrak  
*Date:* 13.03.2023

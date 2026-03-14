# Asset Register

**Document ID:** AST-001  
**Version:** 1.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual (and upon any addition/removal of assets)  
**ISO 27001 Reference:** A.8.1

---

## 1. Purpose

This register inventories all information assets used in business operations. It supports access control decisions, risk assessment, data classification, and compliance with ISO 27001 Annex A.8 (Asset Management).

---

## 2. Hardware Assets

| Asset ID | Type | Description | Serial / Identifier | Owner | Location | Classification | Encryption | Status |
|---|---|---|---|---|---|---|---|---|
| HW-001 | Laptop | MacBook Pro | [Serial] | Krzysztof Swidrak | Primary workplace | Confidential | FileVault 2 | Active |
| HW-002 | Desktop | Mac Mini | [Serial] | Krzysztof Swidrak | Primary workplace | Confidential | FileVault 2 | Active |
| HW-003 | Laptop | MSI [Model] / Kali Linux | [Serial] | Krzysztof Swidrak | Primary workplace / field | Confidential | LUKS | Active |
| HW-004 | Server | Proxmox host [Model] | [Serial] | Krzysztof Swidrak | Primary workplace | Confidential | Volume/VM encryption | Active |
| HW-005 | External HDD | Time Machine backup – MacBook Pro | [Model/S/N] | Krzysztof Swidrak | Primary workplace | Confidential | AES-256 (Time Machine) | Active |
| HW-006 | External HDD | Time Machine backup – Mac Mini | [Model/S/N] | Krzysztof Swidrak | Primary workplace | Confidential | AES-256 (Time Machine) | Active |
| HW-007 | External HDD | Offsite backup – rotated quarterly | [Model/S/N] | Krzysztof Swidrak | Offsite | Confidential | VeraCrypt | Active |

---

## 3. Virtual / Software Assets (Proxmox VMs)

| Asset ID | Type | Description | Host | IP / Hostname | Classification | Backup | Status |
|---|---|---|---|---|---|---|---|
| VM-001 | VM | Debian – general server | HW-004 | [IP] | Confidential | Daily PBS | Active |
| VM-002 | VM | Splunk Enterprise / Free | HW-004 | [IP] | Confidential | Daily PBS | Active |
| VM-003 | VM | [Other VMs – e.g. pentest lab] | HW-004 | [IP] | Confidential | Weekly PBS | Active |

---

## 4. Cloud Services and SaaS

| Asset ID | Service | Provider | Region | Purpose | Data Classification | MFA | Admin Account | Status |
|---|---|---|---|---|---|---|---|---|
| CLD-001 | Microsoft 365 Business Premium | Microsoft | EU (West Europe / Poland) | Email, OneDrive, Teams, licensing | Internal / Confidential | Yes | [email] | Active |
| CLD-002 | Microsoft Azure | Microsoft | Poland Central / West Europe | Hosting, identity, networking | Internal / Confidential | Yes | [email] | Active |
| CLD-003 | OneDrive for Business | Microsoft | EU | Document storage and backup | Internal / Confidential | Yes (via M365) | [email] | Active |
| CLD-004 | OpenVPN (self-hosted) | Self | Local (Proxmox) | Secure remote access | N/A (infrastructure) | Cert-based | N/A | Active |

---

## 5. Network Infrastructure

| Asset ID | Type | Description | Location | IP / Hostname | Authentication | Status |
|---|---|---|---|---|---|---|
| NET-001 | VPN | OpenVPN server | Proxmox VM | [IP/hostname] | Client certificate + key | Active |
| NET-002 | Router/Firewall | [ISP router or dedicated firewall] | Primary workplace | [IP] | Admin password (unique) | Active |
| NET-003 | Switch | [If applicable] | Primary workplace | N/A | N/A | Active |

---

## 6. SSH Key Inventory

| Key ID | Key Type | Fingerprint (SHA-256) | Used By | Authorised On | Created | Last Reviewed |
|---|---|---|---|---|---|---|
| KEY-001 | Ed25519 | [fingerprint] | Krzysztof Swidrak – MacBook Pro | Proxmox host, Debian VM | 01.03.2023 | 01.03.2023 |
| KEY-002 | Ed25519 | [fingerprint] | Krzysztof Swidrak – Mac Mini | Proxmox host, Debian VM | 01.03.2023 | 01.03.2023 |
| KEY-003 | Ed25519 | [fingerprint] | Krzysztof Swidrak – MSI/Kali | Proxmox host | 01.03.2023 | 01.03.2023 |

---

## 7. Engagement Credential Tracking

Active engagement credentials (test accounts, client VPN certs, API keys) are tracked in the password manager under a dedicated vault labelled by engagement. This register tracks only which engagements have active credentials outstanding.

**Note:** Specific client engagement details are withheld for confidentiality. The table below shows the template structure; actual engagement data is maintained internally only.

| Engagement ID | Client | Credential Type | Status | Expected Close |
|---|---|---|---|---|
| ENG-YYYY-NNN | [Confidential] | Test AD accounts, VPN cert, API keys | Active/Closed | [Date] |
| ENG-YYYY-NNN | [Confidential] | Test environment access | Closed | [Date] |

---

## 8. Record of Processing Activities (RoPA – Lightweight)

*Required under GDPR Art. 30 for controllers. Simplified version for sole proprietor.*

| Processing Activity | Data Categories | Legal Basis | Retention | Sub-processors | Transfer outside EU? |
|---|---|---|---|---|---|
| Client contact management | Names, business emails, business phones | Legitimate interest / Contract | Duration + 1 year | Microsoft 365 | No |
| Invoice and contract management | Names, addresses, NIP | Legal obligation | 5-7 years | None | No |
| Security log collection | IP addresses (may include personal), auth events | Legitimate interest (security) | 12 months | None (local Splunk) | No |
| Email communications | Names, email addresses | Contract / Legitimate interest | 3 years | Microsoft 365 | No |

---

## 9. Asset Review Log

| Review Date | Reviewer | Changes Made | Next Review |
|---|---|---|---|
| 01.03.2023 | Krzysztof Swidrak | Initial creation | 01.03.2024 |

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

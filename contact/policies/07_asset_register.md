# Asset Register

**Document ID:** AST-001  
**Version:** 1.0  
**Effective Date:** 01.03.2023  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual (and upon any addition/removal of assets)  
**Last Review Date:** 30.04.2026  
**ISO 27001 Reference:** A.8.1

---

## 1. Purpose

This register inventories all information assets used in business operations. It supports access control decisions, risk assessment, data classification, and compliance with ISO 27001 Annex A.8 (Asset Management).

---

## 2. Hardware Assets

| Asset ID | Type | Description | Serial / Identifier | Owner | Location | Classification | Encryption | Status |
|---|---|---|---|---|---|---|---|---|
| HW-001 | Laptop | Primary workstation | [Serial] | Owner | Primary workplace | Confidential | Platform-native | Active |
| HW-002 | Desktop | Secondary workstation | [Serial] | Owner | Primary workplace | Confidential | Platform-native | Active |
| HW-003 | Laptop | Field assessment device | [Serial] | Owner | Primary workplace / field | Confidential | Full-disk encryption | Active |
| HW-004 | Server | Virtualization host | [Serial] | Owner | Primary workplace | Confidential | Volume/VM encryption | Active |
| HW-005 | External HDD | Backup storage – primary | [Model/S/N] | Owner | Primary workplace | Confidential | AES-256 | Active |
| HW-006 | External HDD | Backup storage – secondary | [Model/S/N] | Owner | Primary workplace | Confidential | AES-256 | Active |
| HW-007 | External HDD | Offsite backup – rotated quarterly | [Model/S/N] | Owner | Offsite | Confidential | Full-disk encryption | Active |

---

## 3. Virtual / Software Assets

| Asset ID | Type | Description | Host | IP / Hostname | Classification | Backup | Status |
|---|---|---|---|---|---|---|---|
| VM-001 | VM | General purpose server | HW-004 | [IP] | Confidential | Daily | Active |
| VM-002 | VM | Monitoring and logging server | HW-004 | [IP] | Confidential | Daily | Active |
| VM-003 | VM | Assessment / lab environment | HW-004 | [IP] | Confidential | Weekly | Active |

---

## 4. Cloud Services and SaaS

| Asset ID | Service | Provider | Region | Purpose | Data Classification | MFA | Admin Account | Status |
|---|---|---|---|---|---|---|---|---|
| CLD-001 | Productivity suite | Cloud vendor A | EU | Email, collaboration, licensing | Internal / Confidential | Yes | [email] | Active |
| CLD-002 | Compute platform | Cloud vendor B | EU | Hosting, identity, networking | Internal / Confidential | Yes | [email] | Active |
| CLD-003 | Document storage | Cloud vendor A | EU | Document storage and backup | Internal / Confidential | Yes (via suite) | [email] | Active |
| CLD-004 | VPN (self-hosted) | Self | On-premises | Secure remote access | N/A (infrastructure) | Cert-based | N/A | Active |

---

## 5. Network Infrastructure

| Asset ID | Type | Description | Location | IP / Hostname | Authentication | Status |
|---|---|---|---|---|---|---|
| NET-001 | VPN | Secure remote access gateway | On-premises | [IP/hostname] | Client certificate + key | Active |
| NET-002 | Router/Firewall | Perimeter network device | Primary workplace | [IP] | Admin password (unique) | Active |
| NET-003 | Switch | [Network switch – if applicable] | Primary workplace | N/A | N/A | Active |

---

## 6. SSH Key Inventory

| Key ID | Key Type | Fingerprint (SHA-256) | Used By | Authorised On | Created | Last Reviewed |
|---|---|---|---|---|---|---|
| KEY-001 | Asymmetric keypair | [fingerprint] | Owner – Device A | Virtualization host, servers | [Date] | [Date] |
| KEY-002 | Asymmetric keypair | [fingerprint] | Owner – Device B | Virtualization host, servers | [Date] | [Date] |
| KEY-003 | Asymmetric keypair | [fingerprint] | Owner – Device C | Virtualization host | [Date] | [Date] |

---

## 7. Engagement Credential Tracking

Active engagement credentials (test accounts, client VPN certs, API keys) are tracked in the password manager under a dedicated vault labelled by engagement. This register tracks only which engagements have active credentials outstanding.

**Note:** Specific client engagement details are withheld for confidentiality. The table below shows the template structure; actual engagement data is maintained internally only.

| Engagement ID | Client | Credential Type | Status | Expected Close |
|---|---|---|---|---|
| ENG-YYYY-NNN | [Confidential] | Test accounts, VPN cert, API keys | Active/Closed | [Date] |
| ENG-YYYY-NNN | [Confidential] | Test environment access | Closed | [Date] |

---

## 8. Record of Processing Activities (RoPA – Lightweight)

*Required under GDPR Art. 30 for controllers. Simplified version for sole proprietor.*

| Processing Activity | Data Categories | Legal Basis | Retention | Sub-processors | Transfer outside EU? |
|---|---|---|---|---|---|
| Client contact management | Names, business emails, business phones | Legitimate interest / Contract | Duration + 1 year | Cloud productivity suite | No |
| Invoice and contract management | Names, addresses, NIP | Legal obligation | 5-7 years | None | No |
| Security log collection | IP addresses (may include personal), auth events | Legitimate interest (security) | 12 months | None (on-premise SIEM) | No |
| Email communications | Names, email addresses | Contract / Legitimate interest | 3 years | Cloud productivity suite | No |

---

## 9. Asset Review Log

| Review Date | Reviewer | Changes Made | Next Review |
|---|---|---|---|
| 01.03.2023 | Krzysztof Swidrak | Initial creation | 01.03.2024 |

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

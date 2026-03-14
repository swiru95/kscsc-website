# Data Protection and Retention Policy

**Document ID:** DPR-001  
**Version:** 1.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**ISO 27001 Reference:** A.8, A.18  
**GDPR Reference:** Art. 5, 13, 17, 25, 30

---

## 1. Purpose

This policy defines how the business collects, stores, handles, and deletes information assets and personal data in a manner consistent with GDPR/RODO obligations and the ISO 27001 framework.

## 2. Scope

Applies to all information processed in connection with business operations, including:
- Client deliverables (reports, findings, configurations, architecture documents)
- Technical data (logs, network captures, vulnerability scan outputs)
- Business records (contracts, invoices, correspondence)
- Personal data (contractor/client contact information: names, business email addresses, business phone numbers)

## 3. Data Categories Processed

| Category | Examples | Personal Data? | Legal Basis (GDPR) |
|---|---|---|---|
| Client technical data | Logs, configs, pentest findings | No | Contract performance |
| Business contacts | Names, business emails, phone numbers | Yes (limited) | Legitimate interest / Contract |
| Financial records | Invoices, payment records | Yes (minimal) | Legal obligation |
| Business correspondence | Emails, meeting notes | Possibly | Legitimate interest |

> **Note:** The business does not process sensitive personal data (special categories under Art. 9 GDPR), payment card data, banking credentials, or consumer PII.

## 4. Data Minimisation

Consistent with GDPR Art. 5(1)(c):
- Only data necessary for the specific engagement is collected
- Personal data is limited to business contact information (email, phone) of client representatives
- Client systems data processed during engagements is scoped to what is required by the statement of work

## 5. Storage Locations and Requirements

| Data Type | Permitted Storage | Encryption Required |
|---|---|---|
| Client deliverables | Local (Proxmox/Debian), OneDrive for Business (EU) | Yes |
| Technical logs | Splunk on Proxmox (local) | Yes (disk encryption) |
| Business records | OneDrive for Business, local backup | Yes |
| Email/contacts | Microsoft 365 (EU datacentre) | Platform-managed |
| Temporary working files | Local device only | Yes (FileVault/LUKS) |

All storage must remain within the EU/EEA. No client data is stored on personal cloud accounts (iCloud personal, Google Drive personal, etc.).

## 6. Retention Schedule

| Data Category | Retention Period | Basis |
|---|---|---|
| Client deliverables and reports | 5 years after engagement close | Contractual, professional liability |
| Technical working files (raw logs, pcaps, interim outputs) | 90 days after engagement close, then securely deleted | Data minimisation |
| Invoices and financial records | 5 years (7 years if VAT-registered) | Polish tax law (Ustawa o rachunkowości) |
| Contracts and NDAs | Duration + 5 years after expiry | Legal obligation |
| Email correspondence | 3 years after last contact | Legitimate interest |
| Business contact details | Duration of business relationship + 1 year | Legitimate interest |
| Security logs (Splunk) | 12 months rolling | Monitoring Policy (MON-001) |
| Backup archives | Per Backup Policy (BKP-001) | Operational |

## 7. Data Subject Rights

Where personal data is processed, individuals have rights under GDPR. The business will respond to verified requests within 30 days:
- **Access (Art. 15)** – Provide a copy of data held
- **Rectification (Art. 16)** – Correct inaccurate data
- **Erasure (Art. 17)** – Delete data where no legal basis exists for retention
- **Portability (Art. 20)** – Provide data in a machine-readable format where applicable
- **Objection (Art. 21)** – Stop processing based on legitimate interest

## 8. Secure Deletion

When retention periods expire, data must be securely deleted:

| Media | Method |
|---|---|
| SSD (Mac, MSI) | File-level encryption key destruction (FileVault / LUKS volume deletion) |
| HDD (Proxmox server) | `shred` or `nwipe` (minimum 3 passes), or physical destruction |
| Cloud storage | Platform deletion confirmed, followed by removal from backups at next backup cycle |
| Printed documents | Cross-cut shredding |

Secure deletion is logged with: data category, volume/approximate size, method used, date.

## 9. Data Transfers

- Client data is not transferred to third parties without explicit client consent or contractual necessity
- Sub-processors (Microsoft 365, Azure) are EU-based and covered by standard contractual clauses where applicable
- No client data is shared via unencrypted channels (no plain email attachments for Confidential data – use password-protected archives or secure file sharing)

## 10. Privacy by Design

New engagements or tooling are assessed for privacy impact before initiation:
- Limit data collection to what is strictly necessary
- Prefer anonymised or pseudonymised data in testing environments
- Document any deviation where client data must be used in a test context

## 11. Record of Processing Activities (RoPA)

A lightweight RoPA is maintained (see Asset Register – AST-001) documenting:
- What personal data is processed
- Purpose and legal basis
- Storage location and retention period
- Recipients / sub-processors

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

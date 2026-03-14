# Data Protection and Retention Policy

**Document ID:** DPR-001  
**Version:** 2.0  
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

## 4.1 Contractual Requirements for Protected Data

Before processing any personally identifiable information (PII), sensitive data, or other information protected under applicable law (including but not limited to GDPR, CCPA, industry-specific regulations), the following requirements must be met:

- **Explicit Declaration**: All such data categories must be explicitly identified and described in the engagement contract or data processing addendum (DPA)
- **Legal Basis Documented**: The contract must state the legal basis for processing (e.g., contract performance, client instruction, regulatory obligation)
- **Processing Scope**: The contract must define the permitted scope of processing, including:
  - Which systems/data sources may be accessed
  - Technical scope (e.g., network segment, application layer)
  - Engagement purpose (e.g., penetration testing, audit, compliance assessment)
- **Retention and Deletion Terms**: The contract must specify how data will be handled after engagement closure (retention period, secure deletion method)
- **Audit Trail**: Description of how processing is logged and monitored

**No protected data shall be processed without prior written agreement on these terms.**

## 5. Storage Locations and Requirements

| Data Type | Permitted Storage | Encryption |
|---|---|---|
| Client deliverables | Local machines, cloud storage | Platform-managed encryption |
| Technical logs | Cloud storage, local server, SIEM platform | Platform-managed encryption |
| Business records | Local machines, cloud storage | Platform-managed encryption |
| Email/contacts | Local machines, cloud storage | Platform-managed encryption |
| Temporary working files | Local machines only | Platform-managed encryption |

All storage must remain within the EU/EEA. No data is stored on personal cloud accounts.

## 6. Retention Schedule

| Data Category | Retention Period | Basis |
|---|---|---|
| Client deliverables and reports | Per engagement contract; standard: duration of contract | Contractual, professional liability |
| Technical working files (raw logs, pcaps, interim outputs) | Immediately after engagement close, then securely deleted | Data minimisation |
| Invoices and financial records | 5 years (7 years if VAT-registered) | Polish tax law (Ustawa o rachunkowości) |
| Contracts and NDAs | Duration + 5 years after expiry | Legal obligation |
| Email correspondence | 1 year after last contact | Legitimate interest |
| Business contact details | Duration of business relationship + 1 year | Legitimate interest |
| Security logs | 90 days active, then archived for 12 months | Monitoring and compliance |
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
| SSD (Computers) | File-level encryption key destruction or platform-native secure erase |
| HDD (Servers) | Secure wipe (minimum 3 passes) or physical destruction |
| Cloud storage | Platform deletion confirmed, followed by removal from backups at next backup cycle |
| Printed documents | Cross-cut shredding |

Secure deletion is logged with: data category, volume/approximate size, method used, date.

## 9. Data Transfers

- Client data is not transferred to third parties without explicit client consent or contractual necessity
- Sub-processors (CSP, SaaS providers) are EU-based and covered by standard contractual clauses where applicable
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
*Date:* 13.03.2023

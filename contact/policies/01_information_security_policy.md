# Information Security Policy

**Document ID:** ISP-001  
**Version:** 2.0  
**Effective Date:** 01.03.2023  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**Last Review Date:** 30.04.2026  
**ISO 27001 Reference:** A.5, A.6, A.7

---

## 1. Purpose

This policy establishes the information security framework for Krzysztof Swidrak Cyber Security Consulting (KSCSC), a sole proprietorship providing cybersecurity advisory and testing services. It defines the principles, responsibilities, and minimum controls required to protect business and client information assets.

## 2. Scope

This policy applies to:
- All information assets owned or processed by the business
- All devices used for business purposes (Asset Register)
- All cloud services (Asset Register)
- All client engagements and associated deliverables
- Network infrastructure including VPN provider

## 3. Information Security Principles

The business operates according to the CIA triad:

- **Confidentiality** – Information is accessible only to those authorised to access it
- **Integrity** – Information is accurate, complete, and protected from unauthorised modification
- **Availability** – Information and systems are accessible when required for legitimate business use

## 4. Responsibilities

As a sole proprietor, the owner assumes all roles:

| Role | Responsibility |
|---|---|
| Information Security Officer | Policy ownership, risk decisions, incident authority |
| Data Controller | Compliance with GDPR/RODO for any personal data processed |
| System Administrator | Maintenance of all infrastructure and access controls |
| Asset Owner | Inventory and classification of all information assets |

## 5. Information Classification

All information assets must be classified according to the following scheme:

| Level | Label | Description | Examples |
|---|---|---|---|
| 1 | **Public** | No harm if disclosed | Marketing materials, public CVs |
| 2 | **Internal** | For business use only | Invoices, contracts, business communications |
| 3 | **Confidential** | Client or sensitive business data requiring protection | Client reports, pentest findings, configurations, architecture docs, logs |

Default classification for any unlabelled information: **Confidential**.

Client deliverables are always classified as **Confidential** unless the client explicitly agrees otherwise in writing.

## 6. Security Controls Overview

| Domain | Control |
|---|---|
| Physical | Screen lock (≤5 min timeout), full-disk encryption on all devices |
| Logical | MFA on all business accounts, unique passwords via password manager, passwordless authentication preferred |
| Network | VPN for remote access, server infrastructure isolated from public internet |
| Cloud | Cloud resources in EU regions, MFA enforced on all administrative access |
| Monitoring | SIEM platform for log aggregation and alerting |
| Backup | Encrypted backups per Backup Policy (BKP-001) |
| Incident | Documented response procedure per Incident Response Policy (IRP-001) |

## 7. Compliance and Legal Obligations

The business maintains awareness of and compliance with:
- **GDPR / RODO** – for any personal data (contractor emails, phone numbers)
- **ISO 27001:2022** – used as the guiding framework (not formally certified)
- **Client contractual obligations** – NDAs and data handling clauses take precedence where stricter
- **Polish law** – applicable regulations for sole proprietors providing IT security services

## 8. Policy Exceptions

Any deviation from this policy must be:
1. Documented in writing with a stated business justification
2. Assessed for risk before implementation
3. Reviewed annually or when circumstances change

## 9. Policy Review

This policy is reviewed annually or following:
- A significant security incident
- A material change in business operations or infrastructure
- Changes in applicable law or regulation

---

*Approved by:* Krzysztof Swidrak  
*Date:* 13.03.2023

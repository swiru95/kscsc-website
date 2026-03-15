# Backup Policy

**Document ID:** BKP-001  
**Version:** 1.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**ISO 27001 Reference:** A.12.3, A.17.1

---

## 1. Purpose

This policy defines backup requirements to ensure business continuity and the recovery of information assets following data loss, system failure, ransomware, or other disruptive events.

## 2. Scope

Applies to all business-critical data and systems:
- Endpoint devices (primary workstations, security testing endpoint)
- On-premise server (host configuration and virtual machines)
- Cloud data (productivity suite, cloud storage, cloud platform)
- Client deliverables and active engagement data

## 3. Backup Principles

- **3-2-1 Rule** – Maintain at least 3 copies of critical data, on 2 different media, with 1 copy offsite
- **Encryption** – All backups are encrypted at rest and in transit
- **Integrity** – Backups are verified regularly; unverified backups are not trusted
- **Immutability** – Where possible, backup destinations are append-only or immutable to protect against ransomware

## 4. Backup Schedule

### 4.1 Primary Workstations

| Mechanism | Destination | Frequency | Retention |
|---|---|---|---|
| Cloud backup service | Provider-managed cloud storage (encrypted) | Continuous / automatic | Per provider retention policy |
| Cloud sync | Cloud storage (EU) | Continuous sync for Documents folder | 90 days version history |
| Manual encrypted archive | External HDD or NAS | Monthly | 6 months |

### 4.2 Security Testing Endpoint

| Mechanism | Destination | Frequency | Retention |
|---|---|---|---|
| Incremental sync + encrypted archive | On-premise NAS share or external HDD | Weekly | 4 weeks |
| Critical engagement files | Cloud storage (via encrypted archive upload) | Per engagement | Per retention schedule in DPR-001 |

### 4.3 On-Premise Server

| Mechanism | Destination | Frequency | Retention |
|---|---|---|---|
| VM backup (hypervisor-native) | Local storage | Daily (VMs) | 7 daily, 4 weekly |
| Offsite replication (primary) | Cloud platform A (encrypted) | Daily (after local backup) | Per cloud retention policy |
| Offsite replication (secondary) | Cloud platform B (encrypted) | Daily (after local backup) | Per cloud retention policy |
| Server host configuration | Exported and stored in cloud storage | After any configuration change | Last 5 versions |
| SIEM indexes | Included in VM backup | Daily | Per VM backup schedule |

### 4.4 Cloud Services

| Service | Backup Approach | Notes |
|---|---|---|
| Cloud storage | Provider-managed redundancy + version history (90 days) | Enable recycle bin retention max |
| Cloud email | Provider-managed; export archive annually | Store encrypted local copy |
| Cloud platform resources | Infrastructure-as-Code templates stored in version control | IaC approach preferred |
| Cloud virtual machines (if any) | Platform-native backup or snapshot per resource | Enable if VMs are business-critical |

## 5. Encryption Requirements

| Backup Type | Encryption Method |
|---|---|
| Automated local backup | AES-256 (native encryption, password set at creation) |
| External HDD | Full-disk encryption or encrypted disk image |
| Incremental sync archives | Encryption before transfer, or sync to encrypted volume |
| Server VM backup | Built-in client-side encryption |
| Cloud uploads | TLS in transit; encrypted at rest by provider; additional encryption for sensitive archives |

Encryption keys / passphrases are stored in the password manager. Recovery keys for full-disk encryption stored offline (printed, physically secured).

## 6. Offsite Backup

The 3-2-1 rule requires at least one offsite copy. Offsite options in use:

- **Cloud storage** – primary offsite for documents and deliverables (EU datacentre)
- **Physical external drive stored offsite** – rotated quarterly to a separate physical location (e.g., safety deposit, separate premises)

## 7. Backup Testing and Verification

| Test | Frequency | Method |
|---|---|---|
| File restore test (workstation) | Monthly | Restore a sample file from automated local backup |
| VM restore test (server) | Quarterly | Restore a VM from server backup to test environment |
| Full recovery simulation | Annually | Simulate loss of primary device; restore from backup |
| Backup integrity check | Monthly | Verify server backup checksums; verify local backup logs show success |

All test results are documented with: date, what was tested, outcome, any remediation taken.

## 8. Recovery Time and Recovery Point Objectives

| Asset | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|---|---|---|
| Primary workstation | 4 hours (restore or replacement) | 1 hour (automated local backup) |
| Server virtual machines | 24 hours | 24 hours |
| Client deliverables | 24 hour | 24 hours (cloud sync) |
| Email | 2 hours | 24 hours |

These are targets for planning; actual recovery time depends on failure scenario.

## 9. Backup Media Management

- External HDDs used for backup are labelled, inventoried in the Asset Register (AST-001), and tested annually for physical integrity
- Failed or end-of-life backup media is securely erased before disposal (per DPR-001 secure deletion requirements)

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

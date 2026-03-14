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
- Endpoint devices (MacBook Pro, Mac Mini, MSI/Kali Linux)
- Proxmox server (host configuration and VMs)
- Cloud data (Microsoft 365, OneDrive for Business, Azure)
- Client deliverables and active engagement data

## 3. Backup Principles

- **3-2-1 Rule** – Maintain at least 3 copies of critical data, on 2 different media, with 1 copy offsite
- **Encryption** – All backups are encrypted at rest and in transit
- **Integrity** – Backups are verified regularly; unverified backups are not trusted
- **Immutability** – Where possible, backup destinations are append-only or immutable to protect against ransomware

## 4. Backup Schedule

### 4.1 MacBook Pro and Mac Mini

| Mechanism | Destination | Frequency | Retention |
|---|---|---|---|
| Time Machine | External encrypted HDD (local) | Continuous / hourly | 1 month local rolling |
| OneDrive for Business | Microsoft 365 cloud (EU) | Continuous sync for Documents folder | 90 days version history |
| Manual encrypted archive | External HDD or NAS | Monthly | 6 months |

### 4.2 MSI / Kali Linux

| Mechanism | Destination | Frequency | Retention |
|---|---|---|---|
| `rsync` + encrypted archive | Proxmox NAS share or external HDD | Weekly | 4 weeks |
| Critical engagement files | OneDrive for Business (via encrypted archive upload) | Per engagement | Per retention schedule in DPR-001 |

### 4.3 Proxmox Server

| Mechanism | Destination | Frequency | Retention |
|---|---|---|---|
| Proxmox Backup Server (PBS) or Vzdump | Local storage + external HDD | Daily (VMs) | 7 daily, 4 weekly |
| Proxmox host config | Exported and stored in OneDrive for Business | After any configuration change | Last 5 versions |
| Splunk indexes | Included in VM backup | Daily | Per VM backup schedule |

### 4.4 Microsoft 365 / Azure

| Service | Backup Approach | Notes |
|---|---|---|
| OneDrive for Business | Microsoft-managed redundancy + version history (90 days) | Enable recycle bin retention max |
| Exchange Online (email) | Microsoft-managed; export to .pst annually | Store encrypted local copy |
| Azure resources | ARM templates or Terraform IaC stored in Git | Infrastructure-as-Code approach preferred |
| Azure VMs (if any) | Azure Backup or snapshot per resource | Enable if VMs are business-critical |

## 5. Encryption Requirements

| Backup Type | Encryption Method |
|---|---|
| Time Machine | AES-256 (native, password set at creation) |
| External HDD | VeraCrypt volume or macOS encrypted disk image |
| Rsync archives | GPG encryption before transfer, or rsync to LUKS-encrypted volume |
| Proxmox PBS | Built-in client-side encryption (ChaCha20-Poly1305) |
| Cloud uploads | TLS in transit; encrypted at rest by provider; additional encryption for sensitive archives |

Encryption keys / passphrases are stored in the password manager. Recovery key for FileVault stored offline (printed, physically secured).

## 6. Offsite Backup

The 3-2-1 rule requires at least one offsite copy. Offsite options in use:

- **OneDrive for Business** – primary offsite for documents and deliverables (EU datacentre)
- **Physical external drive stored offsite** – rotated quarterly to a separate physical location (e.g., safety deposit, separate premises)

## 7. Backup Testing and Verification

| Test | Frequency | Method |
|---|---|---|
| File restore test (macOS) | Monthly | Restore a sample file from Time Machine |
| VM restore test (Proxmox) | Quarterly | Restore a VM from PBS backup to test environment |
| Full recovery simulation | Annually | Simulate loss of primary device; restore from backup |
| Backup integrity check | Monthly | Verify PBS checksums; verify Time Machine log shows success |

All test results are documented with: date, what was tested, outcome, any remediation taken.

## 8. Recovery Time and Recovery Point Objectives

| Asset | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|---|---|---|
| MacBook Pro (primary workstation) | 4 hours (restore or replacement) | 1 hour (Time Machine) |
| Proxmox VMs | 2 hours | 24 hours |
| Client deliverables | 1 hour | 24 hours (OneDrive sync) |
| Email | 2 hours | 24 hours |

These are targets for planning; actual recovery time depends on failure scenario.

## 9. Backup Media Management

- External HDDs used for backup are labelled, inventoried in the Asset Register (AST-001), and tested annually for physical integrity
- Failed or end-of-life backup media is securely erased before disposal (per DPR-001 secure deletion requirements)

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

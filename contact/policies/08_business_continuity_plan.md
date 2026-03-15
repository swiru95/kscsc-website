# Business Continuity Plan

**Document ID:** BCP-001  
**Version:** 1.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor – Krzysztof Swidrak Cyber Security Consulting (KSCSC)  
**Review Cycle:** Annual minimum; after any BCP activation or material infrastructure change  
**ISO 27001 Reference:** A.17 (Information Security Aspects of BCM)  
**DORA Reference:** Regulation (EU) 2022/2554, Art. 11 – ICT Business Continuity Policy  
**Related Documents:** ISP-001, DPR-001, ACP-001, MON-001, BKP-001, IRP-001, AST-001

---

## Regulatory Note

This Business Continuity Plan is prepared in the context of Art. 11 of Regulation (EU) 2022/2554 (DORA), which requires financial entities to ensure that their ICT third-party service providers maintain adequate business continuity arrangements. This document is intended for presentation to financial entity clients as evidence of operational resilience measures in place at the supplier level.

KSCSC is a sole proprietorship. This plan is proportionate to the scale and nature of the services provided and is not intended to represent the continuity posture of a multi-person organisation. Where DORA requirements exceed what is feasible for a sole proprietor, this document identifies compensating controls and residual risks transparently.

---

## 1. Executive Summary

**Business Name:** Krzysztof Swidrak Cyber Security Consulting (KSCSC)  
**Legal Form:** Jednoosobowa Działalność Gospodarcza (JDG) – Polish sole proprietorship  
**NIP:** 9522237510  
**REGON:** 524446530  
**Principal:** Krzysztof Swidrak  
**Services Provided:** Cybersecurity advisory and testing services (penetration testing, security assessments, architecture review, technical documentation)  
**Primary Contact:** contact@kscsc.online  
**BCP Emergency Contact:** contact@kscsc.online – same as above; escalation to trusted colleague (see Section 8) if principal is incapacitated  

This plan defines how KSCSC maintains or rapidly restores the delivery of contracted cybersecurity services following a disruptive event. Given the nature of services provided (advisory and testing, not operational infrastructure or 24/7 support), the primary continuity concern is the ability to deliver engagements on schedule and protect client data in transit.

---

## 2. Scope

### 2.1 Services in Scope

| Service | Criticality | Client Impact if Disrupted |
|---|---|---|
| Penetration testing and security assessments | High | Delayed delivery of engagement; no real-time operational dependency for client |
| Security architecture review and advisory | High | Delayed delivery |
| Technical and architectural documentation | Medium | Delayed delivery |
| Incident response advisory (if contracted) | Critical | Time-sensitive; client may have SLA dependency |

### 2.2 Assets in Scope

All assets listed in Asset Register (AST-001), specifically:

- **HW-001** Primary workstation
- **HW-002** Secondary workstation / backup
- **HW-003** Field assessment device
- **HW-004** On-premise server – virtualisation host, SIEM, VMs
- **CLD-001–003** Cloud productivity suite, cloud platform, cloud storage
- **NET-001** VPN – secure remote access

### 2.3 Out of Scope

- Services not contractually agreed with the client referencing this BCP
- Personal (non-business) data and systems
- Client-side infrastructure (the client is responsible for their own BCM)

---

## 3. Business Impact Analysis (BIA)

### 3.1 Critical Business Functions

| Function | Description | Max Tolerable Downtime (MTD) | Recovery Time Objective (RTO) | Recovery Point Objective (RPO) |
|---|---|---|---|---|
| Engagement delivery | Execution and documentation of pentest / advisory engagements | 5 business days | 24 hours | 24 hours |
| Client communication | Email, reporting, coordination | 4 hours | 2 hours | 24 hours |
| Access to engagement tooling | Testing VMs, scanning infrastructure | 3 business days | 24 hours | 24 hours |
| Access to client deliverables | Reports, evidence, notes in progress | 2 hours | 24 hours | 24 hours |
| Secure remote access (VPN) | Access to on-premise server, client networks (if in-scope) | 2 hours | 2 hours | N/A |
| Log collection and monitoring | SIEM on on-premise server | 24 hours | 24 hours | 12 hours |
| Incident response advisory (if SLA exists) | Time-sensitive advisory support | Per client SLA | Per client SLA | N/A |

### 3.2 Key Dependencies

| Dependency | Provider | Redundancy Available | Failure Impact |
|---|---|---|---|
| Internet connectivity | ISP | Mobile broadband (4G/5G fallback) | High – all remote work affected |
| Primary workstation | Self | Secondary workstation as hot standby | Medium – 1–2 hour switchover |
| Cloud platform | Cloud provider | No direct alternative; provider SLA 99.9% | High for email; medium for storage |
| Local infrastructure (on-premise server) | Self-hosted | Cloud-based VM as fallback for critical VMs | Medium |
| Electricity supply | Local provider | UPS for server; laptop batteries | Low (short outages); High (extended) |
| Physical premises | Home office | Remote work from alternate location | Low |
| Principal availability (health/incapacity) | N/A | Trusted colleague for administrative continuity | Critical – see Section 8 |

---

## 4. Threat and Risk Scenarios

| Scenario | Likelihood | Impact | Primary Response |
|---|---|---|---|
| Primary workstation failure (HW) | Medium | Medium | Switchover to secondary workstation (HW-002) |
| On-premise server failure | Low | Medium | Restore VMs to cloud platform; access backups |
| Ransomware / malware on endpoint | Low | High | Isolate, re-image from backup, restore data |
| Cloud service outage | Low | High | Use cached/offline files; resume when restored |
| Internet outage (ISP) | Medium | High | Mobile broadband fallback |
| Data loss (accidental deletion) | Low | Medium | Restore from cloud version history or backup |
| Physical loss/theft of device | Low | High | Remote wipe; restore from backup; notify per IRP-001 |
| Principal incapacity (illness, accident) | Low | Critical | Trusted colleague protocol (Section 8); client notification |
| Physical premises unavailable | Low | Low | Remote work from alternate location |
| Prolonged power outage (>4h) | Low | High | UPS bridge; relocate to alternate premises with power |
| Key tool / software vendor discontinuation | Low | Medium | Maintain documented alternatives for critical tools |

Risk ratings are reviewed annually and following any incident.

---

## 5. Continuity Strategies

### 5.1 Workstation Failure

**Primary:** Primary workstation (HW-001)  
**Failover:** Secondary workstation (HW-002) – configured identically, full-disk encryption enabled, same toolset installed, same cloud sync active

**Procedure:**
1. Confirm HW-001 failure (hardware fault, theft, or unrecoverable compromise)
2. Power on HW-002 – verify OS, tools, and cloud sync current
3. Connect to VPN via HW-002
4. Resume work – estimated switchover time: **≤ 2 hours**
5. Notify client if engagement schedule is affected (see Section 6)
6. Log event in incident record (IRP-001, INC-YYYY-NNN)

If both primary and secondary workstations are unavailable: field assessment device (HW-003) provides emergency capability for testing tooling. Some platform-specific tooling may be unavailable until device replacement.

### 5.2 On-Premise Server Failure

**Procedure:**
1. Assess failure: hardware fault vs. configuration vs. storage failure
2. If resolvable within RTO: restore from hypervisor-native backup snapshots
3. If not resolvable within RTO:
   - Spin up equivalent VM in **cloud platform (EU region)**
   - Restore critical VM data from encrypted backup (cloud storage or external HDD)
   - Redirect SIEM ingestion to cloud VM or pause monitoring temporarily (log gap documented)
4. Estimated RTO for critical VMs: **24 hours**

### 5.3 Ransomware or Malware Event

**Refer to:** Incident Response Policy (IRP-001) – P1 Critical procedure

**Additional BCP steps:**
1. **Do not pay ransom** – restore from backup is the recovery path
2. Isolate affected device immediately (network disconnect before power off)
3. Verify backup integrity before restoring (check server backup checksums, cloud backup logs)
4. Re-image affected device from clean OS media
5. Restore data from last verified clean backup
6. Assess whether client data was accessed or exfiltrated – notify per IRP-001 Section 5 (GDPR) and client contract
7. Enhanced monitoring for 30 days post-recovery

### 5.4 Internet Connectivity Failure

**Primary:** Fixed broadband via ISP  
**Fallback:** Mobile broadband (5G/4G) via smartphone hotspot or dedicated mobile router

**Procedure:**
1. Confirm ISP outage (check ISP status page, test with mobile device)
2. Enable mobile hotspot
3. Connect primary workstation to hotspot – confirm connectivity
4. For bandwidth-intensive tasks (large transfers, VM access): defer if possible or use cloud resources directly
5. If outage exceeds 4 hours: relocate to alternate location (co-working space, client premises, or other location with broadband)
6. Notify client if engagement timeline is affected

Mobile data costs during failover are a business expense.

### 5.5 Cloud Service Outage

**Procedure:**
1. Verify outage via cloud provider service health dashboard
2. Activate offline mode:
   - Email: Use locally cached email (recent mail available offline)
   - Files: Locally synced files remain available offline
   - Communication: Switch to phone or alternative messaging for urgent client contact
3. Continue work on locally available files; defer cloud-dependent tasks
4. Do not attempt to replicate data to personal cloud services during outage
5. Resume normal operations when service is restored; verify sync integrity
6. If outage exceeds 24 hours: assess whether engagement timelines require client notification

### 5.6 Physical Premises Unavailable

All business operations can be conducted remotely. No on-site infrastructure is required for service delivery (on-premise server is accessible via VPN from any location).

**Alternate work locations:**
1. Co-working space – primary alternate
2. Trusted contact / family premises – emergency alternate
3. Client premises – if client agrees and engagement scope permits

Physical access to the on-premise server may be required for hardware failures. If premises are inaccessible long-term, server hardware must be relocated or replaced with cloud equivalent (see 5.2).

### 5.7 Device Theft or Loss

**Procedure:**
1. Immediately remotely wipe device (via platform-native remote wipe capability) or rely on full-disk encryption rendering data unreadable without credentials
2. Revoke device-specific credentials:
   - Disable device in cloud identity provider
   - Revoke VPN certificate for that device (update revocation list)
   - Revoke authentication keys associated with the device (AST-001 key inventory)
   - Change any passwords that may have been cached on the device
3. Report theft to police (for insurance and legal record)
4. Notify clients if device held any in-progress engagement data
5. Restore from backup onto replacement device
6. Document in IRP-001 incident record; assess GDPR notification need

---

## 6. Communication Plan

### 6.1 Client Notification Thresholds

| Situation | Notification Timeline | Channel |
|---|---|---|
| Disruption expected to delay delivery by > 1 business day | Within 4 hours of confirmed disruption | Email + phone |
| Client data potentially affected (loss, theft, exposure) | Immediately upon confirmation | Phone first, then written |
| Personal data breach (GDPR Art. 33 trigger) | Within 24 hours of awareness (to allow client to meet their own 72h obligation) | Written (email) + phone |
| Service restored after disruption | Within 2 hours of restoration | Email |
| Engagement timeline revision required | Same business day | Email with revised schedule |

### 6.2 Client Communication Template – Service Disruption

```
Subject: Service Continuity Notice – [Engagement Name / Reference]

Dear [Client Contact],

I am writing to inform you that KSCSC is currently experiencing 
a service disruption affecting [describe: workstation / connectivity / infrastructure].

Impact on your engagement: [describe specific impact – delayed deliverable, 
temporary inability to access X, etc.]

Estimated resolution: [date/time or "under investigation"]

Revised delivery timeline: [if applicable]

Actions taken: [brief summary of recovery steps in progress]

I will provide a further update by [specific time].

If this is urgent, please contact me directly at contact@kscsc.online.

Krzysztof Swidrak
KSCSC
```

### 6.3 Escalation Contacts

| Contact | Role | Details | When to Engage |
|---|---|---|---|
| Trusted colleague | Peer support / admin proxy | Details held securely (see Section 8) | Principal incapacity > 24h |
| Client security contact | Client-side incident notification | Per contract / engagement sheet | Data breach, SLA breach |
| UODO | GDPR breach notification | uodo.gov.pl / incydent notification portal | Personal data breach, 72h window |
| CERT Polska | National incident reporting | cert.pl / incydent@cert.pl | Significant cyber incident |
| Cloud provider support | Cloud service issues | Via provider admin portal → Support | Cloud platform failures |

---

## 7. Testing and Exercises

DORA Art. 11(6) requires that continuity plans are **tested and reviewed** at least annually. For a sole proprietor, testing is necessarily simplified but must be documented.

| Test Type | Description | Frequency | Owner |
|---|---|---|---|
| Tabletop exercise | Walk through 2 disruption scenarios (e.g., workstation failure + internet outage) against this plan; identify gaps | Annual | Principal |
| Workstation failover test | Actually switch primary work to secondary workstation for one business day | Annual | Principal |
| Backup restore test | Restore a sample engagement file + a VM from backup; verify integrity | Quarterly (see BKP-001) | Principal |
| Mobile failover test | Work exclusively via mobile broadband for 2 hours | Annual | Principal |
| Cloud VM spinup test | Deploy and configure a VM in cloud platform from documented runbook | Annual | Principal |
| Communication test | Send a test notification to a client contact confirming BCP contact details are current | Annual | Principal |

**Test Documentation:**

Each test is recorded with:
```
Test ID:        BCP-TEST-YYYY-NNN
Date:           
Test Type:      
Scenario:       
Participants:   
Outcome:        Pass / Partial / Fail
Gaps Identified:
Remediation Actions:
Remediation Deadline:
Next Test:      
```

Test records are retained for 5 years and made available to clients upon request.

---

## 8. Key Person Risk – Principal Incapacity

This is the most significant operational resilience risk for a sole proprietor and must be addressed transparently.

### 8.1 Risk Description

All service delivery capability resides with the principal. Illness, accident, or other incapacity exceeding the MTD (5 business days for engagement delivery) creates a material risk of service failure.

### 8.2 Mitigating Controls

| Control | Description |
|---|---|
| Engagement documentation | All active engagements are documented with current status, methodology, and findings at all times, enabling a qualified peer to continue or conclude the work |
| Trusted colleague arrangement | A trusted industry colleague has agreed to act as emergency contact and, if required, assist with engagement handover or client communication. NDA in place. Contact details held securely in the password manager. |
| Advance client notification clause | Contracts include a clause permitting notification and engagement suspension/handover in case of principal incapacity exceeding 5 business days |
| Credential escrow | A sealed encrypted archive containing critical access credentials is held with a trusted family member for use in emergency recovery only |
| Client contractual protection | Force majeure clause included in standard terms of business |

### 8.3 Residual Risk

Despite mitigating controls, incapacity exceeding 4–6 weeks may result in inability to fulfil contractual obligations. This residual risk is disclosed to clients upon request and reflected in contract terms. Clients with zero-tolerance continuity requirements should consider dual-supplier arrangements.

---

## 9. DORA Alignment Summary

This section maps key DORA Art. 11 requirements to this plan for client reference.

| DORA Art. 11 Requirement | How Addressed in This Plan |
|---|---|
| Art. 11(1)(a) – Continuity plans ensuring critical functions in case of disruption | Section 5 – Continuity Strategies per scenario |
| Art. 11(1)(b) – Activation of plans; measures to restore functions within RTO | Section 5 (per scenario procedures) + Section 3.1 (RTO/RPO table) |
| Art. 11(1)(c) – Provisional measures to protect confidentiality and integrity | IRP-001 (containment), ACP-001 (access revocation), BKP-001 (encrypted backups) |
| Art. 11(1)(d) – Communication and crisis management procedures | Section 6 – Communication Plan |
| Art. 11(2) – BCP covers all ICT systems supporting critical functions | Section 2 – Scope; Asset Register (AST-001) |
| Art. 11(4) – Testing at least annually | Section 7 – Testing and Exercises |
| Art. 11(5) – Reports on testing results available to competent authorities | Section 7 – Test Documentation (available to clients on request) |
| Art. 11(6) – Review after ICT disruption or major change | Section 10 – Plan Maintenance |
| Art. 11(7) – Backup policies and restoration procedures | BKP-001 (Backup Policy) |

**Limitations and Transparent Disclosures:**

The following DORA requirements applicable to financial entities are **not directly replicable** at sole proprietor scale and are disclosed here as residual risks:

| Requirement | Limitation | Compensating Control |
|---|---|---|
| Geographic redundancy of ICT systems | Primary infrastructure is single-location (home office + on-premise server) | EU cloud platform as secondary; cloud storage offsite sync |
| Dedicated crisis management function | No separation of roles possible (sole proprietor) | Trusted colleague arrangement (Section 8) |
| Crisis communication team | Single point of contact only | All client contacts documented; colleague can assist communication |
| Formal RTO testing under realistic conditions | Full DR simulation limited by single-person operation | Tabletop + component-level tests (Section 7) |

---

## 10. Plan Maintenance

This plan is a living document. It is updated:

| Trigger | Action |
|---|---|
| Annual review (minimum) | Full review of all scenarios, contacts, RTOs, and asset inventory |
| After any BCP activation | Post-incident review; update plan within 10 business days |
| Material infrastructure change | Update affected sections within 30 days of change |
| New client contract with different SLA | Review and update RTO/MTD targets if required |
| Change in trusted colleague arrangement | Update Section 8 immediately |

**Version History:**

| Version | Date | Author | Summary of Changes |
|---|---|---|---|
| 1.0 | 15.03.2026 | Krzysztof Swidrak | Initial release |

---

## 11. Approval and Declaration

I, Krzysztof Swidrak, acting as the owner and sole operator of Krzysztof Swidrak Cyber Security Consulting (NIP: 6793290134), confirm that:

- This Business Continuity Plan reflects the actual operational capabilities and limitations of the business
- The controls described are implemented and maintained as stated
- This plan is reviewed at minimum annually and following any activation
- Test results are documented and available to clients upon written request
- Any material change to the business's continuity posture will be communicated to affected clients within 30 days

*Signed:* Krzysztof Swidrak  
*Date:* 15.03.2026  
*Next scheduled review:* 15.03.2027

---

*Krzysztof Swidrak Cyber Security Consulting (KSCSC) | NIP: 6793290134 | contact@kscsc.online*

# Incident Response Policy

**Document ID:** IRP-001  
**Version:** 1.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**ISO 27001 Reference:** A.16.1  
**GDPR Reference:** Art. 33, 34

---

## 1. Purpose

This policy defines the process for identifying, responding to, containing, and recovering from information security incidents. It also covers regulatory notification obligations under GDPR where personal data is affected.

## 2. Scope

Applies to all security incidents affecting:
- Business devices and infrastructure
- Client data or systems accessed during engagements
- Business accounts (cloud productivity suite, cloud platform, email)
- Any personal data processed by the business

## 3. Incident Classification

| Severity | Definition | Examples | Target Response Time |
|---|---|---|---|
| **P1 – Critical** | Active threat causing or likely to cause significant damage to client data, business systems, or compliance obligations | Active ransomware, confirmed data breach, root compromise of infrastructure | Immediate – within 12 hours |
| **P2 – High** | Significant security event requiring urgent action | Successful credential phishing, unauthorised access to any system, malware detected but contained | Within 24 hours |
| **P3 – Medium** | Suspicious activity or potential incident under investigation | Repeated failed auth, anomalous outbound traffic, lost device (unconfirmed compromise) | Within 48 hours |
| **P4 – Low** | Policy violation or minor event with no confirmed impact | Unencrypted file found in wrong location, software misconfiguration | Within 72 hours |

## 4. Incident Response Process

### Phase 1: Identification

**Sources of detection:**
- SIEM alerts (see Monitoring Policy MON-001)
- Manual review of logs or system behaviour
- Client notification
- Third-party notification (cloud security alerts, platform advisories, etc.)

**On detection:**
- Record the time of detection and initial observations
- Do not attempt to remediate before containing – preserve evidence
- Open an incident record (see Section 7)

### Phase 2: Containment

**Short-term containment (immediate):**
- Isolate affected device from network if active compromise suspected
  - Endpoint devices: disable network interfaces; do not power off to preserve volatile evidence
  - Virtual machines: suspend or disconnect VM network interface
- Revoke active sessions / tokens for affected cloud accounts
- Invalidate and rotate compromised credentials immediately
- If VPN is compromised: revoke certificate, update revocation list, restart service

**Long-term containment:**
- Apply patches or configuration changes to prevent reinfection
- Restore from known-good backup if system integrity is in doubt
- Increase monitoring verbosity on adjacent systems

### Phase 3: Eradication

- Identify root cause (malware, credential theft, misconfiguration, vulnerability)
- Remove malicious artefacts (malware, backdoors, unauthorised SSH keys)
- Patch or mitigate the exploited vulnerability
- Re-image device if full integrity cannot be confirmed
- Reset all credentials associated with the compromised scope

### Phase 4: Recovery

- Restore system from verified clean backup (per BKP-001)
- Verify system integrity before returning to production use
- Monitor restored systems with elevated logging for minimum 14 days post-incident
- Confirm client data integrity where client systems or data were in scope

### Phase 5: Post-Incident Review

Within 5 business days of incident closure:
- Complete incident record (Section 7)
- Identify root cause and contributing factors
- Document lessons learned
- Update policies, controls, or configurations to prevent recurrence
- Review whether incident affects any active client engagements

## 5. GDPR Breach Notification

If the incident involves personal data (client contact details, contractor information), the following obligations apply:

### 5.1 Assessment

Determine whether the breach is notifiable:
- **Risk to individuals?** If the breach poses no risk to natural persons → document only, no notification required
- **Risk is likely?** → Notify UODO (Polish DPA) within 72 hours of becoming aware (Art. 33 GDPR)
- **High risk to individuals?** → Notify affected individuals without undue delay (Art. 34 GDPR)

### 5.2 Notification to UODO (Art. 33)

If notification is required, submit to UODO (uodo.gov.pl) within **72 hours** of awareness, including:
- Nature of the breach and data categories affected
- Approximate number of individuals affected
- Likely consequences
- Measures taken or proposed

If full information is unavailable within 72 hours, submit an initial notification and follow up. Document the reason for any delay.

### 5.3 Client Notification

- Notify affected clients of any incident involving their data as soon as practicable
- Communication must be factual, concise, and include: what happened, what data was affected, what action has been taken
- Follow any notification obligations specified in the client's NDA or contract

## 6. Evidence Preservation

Before remediation, preserve:
- Memory dump if system is running and compromise is suspected (using appropriate forensic acquisition tools)
- Disk image of affected system where forensics may be required
- Relevant SIEM / log exports (timestamped, hashed with SHA-256)
- Network captures if active C2 or exfiltration is suspected (using appropriate network capture tools)
- Screenshots of anomalous behaviour, alerts, or attacker artefacts

Evidence is stored in an encrypted, isolated location and not used for normal operations.

## 7. Incident Record

Each incident is recorded in a dedicated log file (or secure note) with the following fields:

```
Incident ID:        INC-YYYY-NNN
Date/Time Detected: 
Date/Time Reported:
Severity:           P1 / P2 / P3 / P4
Summary:            
Systems Affected:   
Data Affected:      (include whether personal data involved)
Detection Source:   
Timeline:           (key actions and timestamps)
Containment Steps:  
Eradication Steps:  
Recovery Steps:     
Root Cause:         
GDPR Notification Required: Yes / No
GDPR Notification Sent:     Date / N/A
Client Notified:    Yes / No / N/A
Lessons Learned:    
Preventive Actions: 
Closed:             Date
```

Incident records are retained for 5 years.

## 8. Emergency Contacts

| Contact | Purpose | Details |
|---|---|---|
| UODO (Polish DPA) | GDPR breach notification | uodo.gov.pl / +48 22 531 03 00 |
| CERT Polska | National CERT, incident reporting | cert.pl / incydent@cert.pl |
| Cloud provider support | Cloud account compromise | Via provider admin portal → Support |
| Client security contact | Incident affecting client systems | Per engagement contact sheet |

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

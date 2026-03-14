# Log Management and Monitoring Policy

**Document ID:** MON-001  
**Version:** 1.0  
**Effective Date:** 2025-01-01  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**ISO 27001 Reference:** A.12.4, A.16.1

---

## 1. Purpose

This policy defines requirements for the collection, storage, integrity, and review of security logs across all business infrastructure. Effective log management supports incident detection, investigation, and evidence preservation.

## 2. Scope

Applies to all systems generating security-relevant events:
- Endpoint devices (MacBook Pro, Mac Mini, MSI/Kali Linux)
- Proxmox hypervisor and hosted VMs (Debian)
- Splunk instance (log aggregation platform)
- OpenVPN server
- Microsoft 365 and Azure services
- Network infrastructure

## 3. Log Sources and Collection

| Source | Log Types | Collection Method | Destination |
|---|---|---|---|
| macOS (MacBook Pro / Mini) | Auth events, sudo, application logs | Splunk Universal Forwarder or syslog | Splunk (Proxmox) |
| Kali Linux (MSI) | Auth, sudo, network tools | Splunk Universal Forwarder or syslog | Splunk (Proxmox) |
| Proxmox host | Auth, VM lifecycle, storage | Syslog / Splunk Forwarder | Splunk (Proxmox) |
| Debian VMs | Auth, service logs, cron | Syslog / Splunk Forwarder | Splunk (Proxmox) |
| OpenVPN | Connection logs, auth events | Syslog | Splunk (Proxmox) |
| Microsoft 365 | Sign-in logs, audit logs, mail | Microsoft Purview / manual export | Retained in M365 (90 days) + periodic export |
| Azure | Activity log, NSG flow logs, sign-ins | Azure Monitor / Log Analytics or export | Retained in Azure + export to Splunk where practical |
| Splunk itself | Internal audit log | Built-in | Local |

## 4. Minimum Log Content

Every log entry must, where technically feasible, contain:
- Timestamp (UTC, with timezone indicator)
- Source system / hostname
- Event type / category
- User or process identifier
- Source IP address (for network events)
- Outcome (success / failure)

## 5. Log Retention

| Source | Retention Period | Storage |
|---|---|---|
| Splunk (all ingest) | 12 months rolling | Proxmox local storage |
| Microsoft 365 audit logs | 90 days (platform default, Business Premium) | M365; export critical logs to Splunk |
| Azure Activity Log | 90 days (platform default) | Azure; export to Splunk where feasible |
| VPN connection logs | 12 months | Splunk |
| Endpoint auth logs | 12 months | Splunk |

After the retention period, logs are securely deleted per the Data Protection and Retention Policy (DPR-001).

## 6. Log Integrity

- Splunk is hosted on Proxmox with restricted access (local network / VPN only)
- Splunk web UI access requires authentication (no anonymous access)
- Log forwarding uses authenticated channels where possible (TLS syslog, Splunk S2S)
- Clocks on all systems are synchronised via NTP to prevent timestamp inconsistencies
- Logs are not modified after ingestion; Splunk index integrity is preserved

## 7. Monitoring and Alerting

The following events trigger review or automated alerting:

| Event | Priority | Action |
|---|---|---|
| Failed authentication (≥5 in 10 min, same source) | High | Review; consider block |
| Successful login outside business hours | Medium | Review |
| Root / admin login | High | Review immediately |
| New SSH key authorised | High | Verify and document |
| OpenVPN connection from unexpected IP/country | Medium | Review |
| Azure sign-in from new location or device | Medium | Review (MFA may already block) |
| Splunk indexing stopped or data gap | High | Investigate infrastructure issue |
| Large outbound data transfer | Medium | Review in context of active engagement |

Alerts are implemented as Splunk saved searches and alerts, reviewed at minimum weekly or upon notification.

## 8. Log Review Schedule

| Review | Frequency |
|---|---|
| Splunk alert queue | Weekly minimum |
| Azure sign-in and audit logs | Weekly |
| Microsoft 365 audit logs | Monthly |
| VPN connection log | Weekly |
| Full log review (manual sampling) | Monthly |

Reviews are documented with a brief note (date, reviewer, findings, action taken).

## 9. Use of Logs in Client Engagements

- Logs generated on client systems during authorised engagements are handled per the engagement scope and client agreement
- Client-system logs are not forwarded to the business Splunk instance unless explicitly agreed in the statement of work
- Engagement-related logs stored locally are subject to the retention schedule in DPR-001

## 10. Clock Synchronisation

All systems (macOS, Linux, Proxmox VMs) must use NTP:
- Preferred NTP server: `pool.pl.ntp.org` or `time.cloudflare.com`
- Maximum allowed clock drift: 1 second
- NTP configuration is verified annually

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

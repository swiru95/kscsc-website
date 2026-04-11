# Log Management and Monitoring Policy

**Document ID:** MON-001  
**Version:** 1.0  
**Effective Date:** 01.03.2023  
**Owner:** Krzysztof Swidrak, Sole Proprietor  
**Review Cycle:** Annual  
**Last Review Date:** 30.04.2026  
**ISO 27001 Reference:** A.12.4, A.16.1

---

## 1. Purpose

This policy defines requirements for the collection, storage, integrity, and review of security logs across all business infrastructure. Effective log management supports incident detection, investigation, and evidence preservation.

## 2. Scope

Applies to all systems generating security-relevant events:
- Endpoint devices
- Server hypervisor and hosted virtual machines
- SIEM platform
- VPN service
- Cloud services (productivity suite, cloud platform)
- Network infrastructure

## 3. Log Sources and Collection

| Source | Log Types | Collection Method | Destination |
|---|---|---|---|
| Primary workstations | Auth events, privileged access, application logs | Log agent | Log broker → Central SIEM |
| Security testing endpoint | Auth, privileged access, network tools | Log agent | Log broker → Central SIEM |
| Hypervisor host | Auth, VM lifecycle, storage | Log agent | Central SIEM |
| Server virtual machines | Auth, service logs, scheduled tasks | Log agent | Central SIEM |
| VPN service | Connection logs, auth events | Native platform mechanisms | Central SIEM |
| Cloud productivity suite | Sign-in logs, audit logs, mail | Native platform mechanisms | Retained in platform (90 days) + export via log broker |
| Cloud platform | Activity log, network flow logs, sign-ins | Native platform mechanisms | Retained in platform + export via log broker to SIEM |
| SIEM platform | Internal audit log | Built-in | Local |

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
| SIEM (all ingest) | 90 days active, then archived for 12 months | On-premise server storage |
| Cloud productivity suite audit logs | 90 days (platform default) | Cloud platform; export critical logs to SIEM |
| Cloud platform activity log | 90 days (platform default) | Cloud platform; export to SIEM where feasible |
| VPN connection logs | 12 months | SIEM |
| Endpoint auth logs | 12 months | SIEM |

After the retention period, logs are securely deleted per the Data Protection and Retention Policy (DPR-001).

## 6. Log Integrity

- The SIEM platform is hosted on-premise with restricted access (local network / VPN only)
- SIEM web interface access requires authentication (no anonymous access)
- Log forwarding uses authenticated and encrypted channels where possible
- Clocks on all systems are synchronised via NTP to prevent timestamp inconsistencies
- Logs are not modified after ingestion; SIEM index integrity is preserved

## 7. Monitoring and Alerting

The following events trigger review or automated alerting:

| Event | Priority | Action |
|---|---|---|
| Failed authentication (≥5 in 10 min, same source) | High | Review; consider block |
| Successful login outside business hours | Medium | Review |
| Root / admin login | High | Review immediately |
| New SSH key authorised | High | Verify and document |
| VPN connection from unexpected IP/country | Medium | Review |
| Cloud sign-in from new location or device | Medium | Review (MFA may already block) |
| SIEM indexing stopped or data gap | High | Investigate infrastructure issue |
| Large outbound data transfer | Medium | Review in context of active engagement |

Alerts are implemented as SIEM saved searches and alerts, reviewed at minimum weekly or upon notification.

## 8. Log Review Schedule

| Review | Frequency |
|---|---|
| SIEM alert queue | Weekly minimum |
| Cloud platform sign-in and audit logs | Weekly |
| Cloud productivity suite audit logs | Monthly |
| VPN connection log | Weekly |
| Full log review (manual sampling) | Monthly |

Reviews are documented with a brief note (date, reviewer, findings, action taken).

## 9. Use of Logs in Client Engagements

- Logs generated on client systems during authorised engagements are handled per the engagement scope and client agreement
- Client-system logs are not forwarded to the business SIEM instance unless explicitly agreed in the statement of work
- Engagement-related logs stored locally are subject to the retention schedule in DPR-001

## 10. Clock Synchronisation

All systems (endpoints, servers, virtual machines) must use NTP:
- A reliable, geographically appropriate NTP pool should be configured
- Maximum allowed clock drift: 1 second
- NTP configuration is verified annually

---

*Approved by:* Krzysztof Swidrak  
*Date:* 01.03.2023

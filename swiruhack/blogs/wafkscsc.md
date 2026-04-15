# KSCSC Well-Architected Framework

**Version 1.0 — April 2026**

---

## Executive Summary

The KSCSC Well-Architected Framework is a unified, opinionated guide for designing, building, and operating cloud and hybrid workloads. It distills the best thinking from the **AWS Well-Architected Framework** (six pillars) and the **Azure Well-Architected Framework** (five pillars), filters it through the **KISS principle** (Keep It Simple, Stupid), and hardens every recommendation with **Zero Trust** and **Defense in Depth** security postures.

KSCSC is structured around **seven pillars** — starting with **Pillar 0: Governance, Risk & Control**, which establishes the organizational foundation of ownership, accountability, and policy required before any technical pillar can function. This pillar explicitly addresses the complex conflict of interests between Business, IT, and Security by defining clear decision rights, escalation paths, and a transparent exception process.

Where the source frameworks offer hundreds of pages of guidance, KSCSC compresses them into a single actionable document. Simplicity is not an afterthought — it is the first design constraint. Every pillar, every practice, every decision must justify its complexity or be removed.

---

## Foundational Philosophies

Three philosophies sit above the pillars. They are not optional add-ons — they are lenses that every pillar must be viewed through.

### 1 — KISS (Keep It Simple, Stupid)

Complexity is the silent killer of reliability, security, and cost efficiency. KSCSC treats simplicity as a first-class architectural requirement.

- **Fewer moving parts.** Prefer managed services over self-hosted equivalents. Prefer a single multi-purpose tool over three single-purpose tools when the trade-off is acceptable.
- **Fewer decision points.** Standardize technology choices across teams. Maintain a curated "approved services catalog" and default to it.
- **Fewer custom abstractions.** Avoid wrapping cloud-native APIs in internal libraries unless the wrapper genuinely reduces cognitive load.
- **Readable over clever.** Infrastructure-as-Code, runbooks, and architecture diagrams should be understandable by any mid-level engineer in under 15 minutes.
- **Simplicity audit.** For every architectural decision, ask: *"Can we achieve 80% of the benefit with 20% of the complexity?"* If yes, take the simpler path.

### 2 — Zero Trust

No network location, identity, or device is inherently trusted. Every request is verified as though it originates from an open, hostile network.

- **Verify explicitly.** Authenticate and authorize every access request using all available signals — identity, location, device health, data classification, anomalies.
- **Least-privilege access.** Grant only the minimum permissions required, scoped by time (just-in-time), scope (just-enough-access), and risk.
- **Assume breach.** Design every layer as though an adjacent layer has already been compromised. Segment blast radius, encrypt in transit and at rest, and monitor continuously.

### 3 — Defense in Depth

Security is layered. No single control is sufficient. If one layer fails, the next must catch the threat.

- **Edge → Network → Identity → Application → Data.** Each boundary has independent controls.
- **Preventive + Detective + Responsive.** Don't just block — detect what slips through, and automate the response.
- **Overlap intentionally.** Redundant controls across layers are a feature, not waste. A WAF at the edge, input validation at the application, and parameterized queries at the data layer all protect against injection — and all three must exist.

---

## The Seven Pillars

KSCSC consolidates both source frameworks into **seven pillars** — starting with Pillar 0, which establishes the governance foundation that all other pillars depend on. The mapping is deliberate: AWS and Azure overlap heavily but use slightly different groupings. KSCSC unifies them, adds an explicit governance layer, and applies the three foundational philosophies to each.

| # | KSCSC Pillar | AWS Equivalent | Azure Equivalent |
|---|---|---|---|
| **0** | **Governance, Risk & Control** | *(cross-cutting)* | *(cross-cutting)* |
| 1 | Security & Compliance | Security | Security |
| 2 | Reliability & Resilience | Reliability | Reliability |
| 3 | Operational Excellence | Operational Excellence | Operational Excellence |
| 4 | Performance Efficiency | Performance Efficiency | Performance Efficiency |
| 5 | Cost Optimization | Cost Optimization | Cost Optimization |
| 6 | Sustainability | Sustainability | *(embedded across pillars)* |

---

### Pillar 0 — Governance, Risk & Control

*Establish clear ownership, accountability, and policy so that Business, IT, and Security can collaborate rather than conflict.*

This is the **prerequisite pillar**. Without governance, the remaining six pillars devolve into tribal knowledge, shadow decisions, and unresolved turf wars between business units pushing for speed, IT teams managing complexity, and security teams managing risk. Pillar 0 exists to make the invisible visible — who decides, who executes, who is accountable, and what happens when interests collide.

**Core Practices:**

**Governance Framework & Charter** — Establish a formal governance body (Cloud Center of Excellence, Architecture Review Board, or equivalent) with a written charter that defines its mandate, membership, decision rights, escalation paths, and meeting cadence. The charter must be signed off by executive sponsors from Business, IT, and Security. Without executive sponsorship, governance is advisory at best and ignored at worst.

**RACI for Every Pillar** — For each of the six operational pillars below, publish a RACI matrix (Responsible, Accountable, Consulted, Informed) that maps roles to key decisions. Examples: *Who approves a new cloud region deployment?* (Business: Consulted, IT: Responsible, Security: Consulted, CTO: Accountable). *Who approves an exception to encryption policy?* (Security: Accountable, IT: Responsible, Business: Informed). RACI matrices must be reviewed semi-annually and updated on any organizational change.

**Policy Hierarchy** — Maintain a three-tier policy structure:

- **Tier 1 — Principles** (approved by executive leadership): High-level statements of intent, e.g., *"All data at rest must be encrypted"* or *"No production system may depend on a single availability zone."* These change rarely and require board-level or C-suite approval.
- **Tier 2 — Standards** (approved by governance body): Specific, measurable requirements that implement principles, e.g., *"Encryption must use AES-256 with customer-managed keys for data classified as Confidential or above."* These are reviewed annually.
- **Tier 3 — Procedures** (owned by engineering teams): Step-by-step implementation guides, e.g., *"How to enable CMK encryption on S3 buckets using Terraform module X."* These evolve continuously and are version-controlled alongside code.

**Risk Management** — Maintain a unified risk register that captures technology, security, and business risks in a single view. Each risk has an owner, a severity rating, a likelihood rating, an agreed treatment (accept, mitigate, transfer, avoid), and a review date. The risk register is reviewed monthly by the governance body. Risks that are accepted must be signed off by the accountable business owner — IT and Security do not accept business risk on behalf of the business.

**Conflict Resolution Between Business, IT & Security** — Conflicts of interest are inevitable and healthy. Business wants speed to market. IT wants stability and maintainability. Security wants risk reduction. KSCSC resolves these through a transparent, documented decision framework:

- **Default stance:** Security and compliance requirements are non-negotiable baselines. Performance and cost are optimized within those constraints. Speed is achieved through automation, not by bypassing controls.
- **Exception process:** When business urgency genuinely requires deviating from a standard, a formal exception request must be submitted. It must state: what standard is being bypassed, why, what compensating controls are in place, who accepts the residual risk, and when the exception expires. Exceptions are time-boxed (maximum 90 days), tracked in the risk register, and reviewed at expiry. Permanent exceptions do not exist — they become policy changes or they are remediated.
- **Escalation path:** If Business, IT, and Security cannot agree, the decision escalates to the governance body. If the governance body cannot agree, it escalates to the CTO/CISO. Decisions are documented with rationale so they can be audited and learned from.

**Regulatory & Compliance Mapping** — Identify all applicable regulations (GDPR, NIS2, DORA, PCI-DSS, SOC 2, ISO 27001, industry-specific requirements) and map them to the policy hierarchy. Each regulatory requirement should trace to at least one Tier 1 principle and one Tier 2 standard. Compliance is not a separate activity — it is the natural output of following the governance framework.

**Continuous Governance** — Governance is not a one-time exercise. Implement:

- **Quarterly pillar reviews** — Assess each pillar's health using the maturity model below.
- **Annual policy review cycle** — Update all Tier 1 and Tier 2 documents.
- **Automated policy enforcement** — Use policy-as-code (AWS Config, Azure Policy, OPA/Gatekeeper) to make non-compliant deployments impossible, not just detectable.
- **Governance dashboard** — A single pane of glass showing: policy compliance percentage, open risk items, exception count and age, audit findings, and pillar maturity scores.

**KISS Check:** Keep the governance structure as flat as possible. One governance body, one risk register, one exception process. If you need a meeting to decide which meeting to escalate to, your governance is too complex.

**Zero Trust Check:** Governance decisions and policy exceptions require authenticated, authorized approval workflows — not email threads or verbal agreements. Audit trails for governance actions are immutable.

**Defense in Depth Check:** Policy enforcement at code review + CI/CD pipeline + runtime + audit layers. A policy violation must be caught by at least two of these independently.

---

### Pillar 1 — Security & Compliance

*Protect information, systems, and assets while meeting regulatory obligations.*

Security is not a pillar among equals in KSCSC — it is the pillar that **permeates all others**. Every design decision in every other pillar must pass through a security lens.

**Core Practices:**

**Identity & Access Management** — Implement strong identity foundations using centralized identity providers (e.g., AWS IAM Identity Center, Azure Entra ID). Enforce MFA everywhere, without exception. Apply least-privilege through role-based access control (RBAC) with time-boxed elevation for administrative actions. Review access quarterly and automate deprovisioning on role change or departure.

**Network Security** — Apply micro-segmentation. Default-deny all traffic. Use private endpoints for service-to-service communication. Deploy Web Application Firewalls at every public-facing boundary. Inspect east-west traffic, not just north-south. DNS filtering and egress controls prevent data exfiltration.

**Data Protection** — Classify data at creation. Encrypt at rest (AES-256 minimum) and in transit (TLS 1.2+). Use customer-managed keys for sensitive workloads. Implement data loss prevention (DLP) controls. Maintain immutable backups with tested restore procedures.

**Detection & Response** — Centralize logs into a SIEM. Enable cloud-native threat detection (AWS GuardDuty, Azure Defender). Define and rehearse incident response playbooks. Automate containment actions (e.g., isolate compromised instance within 60 seconds). Conduct red-team exercises at least annually.

**Compliance as Code** — Codify compliance requirements as policy rules (AWS Config Rules, Azure Policy, OPA). Enforce them in CI/CD pipelines so non-compliant resources cannot be deployed. Maintain an auditable trail of every policy exception.

**KISS Check:** Prefer one centralized identity provider over multiple. Prefer managed security services (cloud-native SIEM, managed WAF) over self-deployed tooling unless regulatory constraints require otherwise.

**Zero Trust Check:** Every access request is verified. No "trusted" VPN or internal network bypasses authentication. Service-to-service calls use mutual TLS or workload identity.

**Defense in Depth Check:** Identity controls + network segmentation + encryption + detection + response — five independent layers, each capable of stopping a threat alone.

---

### Pillar 2 — Reliability & Resilience

*Ensure workloads perform their intended function correctly and consistently, and recover rapidly when they don't.*

**Core Practices:**

**Design for Failure** — Every component will fail. Design architectures that tolerate failure without human intervention. Use multi-AZ deployments as the baseline. For critical workloads, design for multi-region active-active or active-passive failover. Eliminate single points of failure through redundancy at compute, storage, and networking layers.

**Define and Measure Reliability Targets** — Set Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) for every workload based on business impact. Map these to concrete architectural patterns. A 4-hour RTO allows pilot-light DR; a 15-minute RTO demands hot standby. Don't over-engineer — match the pattern to the need.

**Automate Recovery** — Self-healing is the goal. Use health checks, auto-scaling groups, and container orchestration restart policies. Automate failover at the DNS, load balancer, and database layers. Manual recovery steps are acceptable only for unprecedented scenarios.

**Test Reliability** — Conduct chaos engineering experiments regularly. Simulate AZ failures, dependency outages, and data corruption. Game days should involve the on-call team operating under realistic conditions. Untested disaster recovery is not disaster recovery.

**Manage Change Safely** — Use blue-green or canary deployments. Roll back automatically on error-rate thresholds. Avoid big-bang releases. Every change must be reversible.

**KISS Check:** Start with the simplest architecture that meets your RTO/RPO. Single-region multi-AZ covers most workloads. Don't go multi-region unless the business case demands it.

**Zero Trust Check:** Failover paths must enforce the same authentication and authorization as primary paths. Disaster recovery environments are not exempt from security controls.

**Defense in Depth Check:** Redundancy at infrastructure + application + data layers. Health checks at load balancer + container orchestrator + application level.

---

### Pillar 3 — Operational Excellence

*Run and monitor systems to deliver business value and continuously improve processes.*

**Core Practices:**

**Everything as Code** — Infrastructure, configuration, policy, monitoring dashboards, runbooks — all version-controlled, peer-reviewed, and deployed via CI/CD. No manual console changes in production, ever. Drift detection alerts on unauthorized changes.

**Observability Triad** — Implement structured logging, distributed tracing, and metrics collection across all workloads. Correlate them through a unified observability platform. Every request should be traceable from edge to database and back.

**Actionable Alerting** — Every alert must have a clear owner and a runbook. If an alert fires and the response is "ignore it," delete the alert. Reduce noise relentlessly. Target fewer than five actionable alerts per on-call shift.

**Blameless Post-Incident Reviews** — After every significant incident, conduct a post-incident review focused on systemic causes, not individual blame. Publish findings internally. Track remediation items to completion.

**Operational Readiness Reviews** — Before any workload enters production, validate: monitoring is in place, runbooks exist, on-call rotation is staffed, scaling limits are tested, and rollback procedures are verified.

**KISS Check:** Use a single observability stack, not three. Standardize CI/CD pipelines across teams. Keep runbooks short — if a runbook exceeds one page, the process is too complex.

**Zero Trust Check:** CI/CD pipeline credentials use short-lived tokens. Deployment service accounts have least-privilege. Audit logs for operational actions are tamper-proof.

**Defense in Depth Check:** Monitoring at infrastructure + application + business-metric layers. Change control via code review + automated testing + deployment gates.

---

### Pillar 4 — Performance Efficiency

*Use computing resources efficiently to meet requirements, and maintain that efficiency as demand and technology evolve.*

**Core Practices:**

**Right-Size from Day One** — Begin with load testing and sizing experiments, not guesses. Use cloud provider recommendations (AWS Compute Optimizer, Azure Advisor) to match instance types and storage tiers to actual workload profiles. Re-evaluate quarterly.

**Scale Horizontally by Default** — Prefer stateless, horizontally scalable architectures. Use auto-scaling with target-tracking policies. Vertical scaling is acceptable for databases and legacy workloads but should be time-boxed with a migration plan.

**Use Managed and Serverless Services** — Managed databases, serverless compute, and platform services eliminate undifferentiated operational burden and often deliver better performance through provider-level optimization.

**Cache Strategically** — Identify hot data paths and apply caching at the appropriate layer: CDN for static assets, in-memory cache (Redis, ElastiCache) for repeated queries, application-level caching for computed results. Every cache must have an explicit invalidation strategy.

**Benchmark and Iterate** — Establish performance baselines. Run synthetic and real-user monitoring. Set performance budgets (e.g., p99 latency < 200ms). Alert on regression. Treat performance as a feature with its own backlog.

**KISS Check:** Don't introduce caching until you've proven a performance problem exists. Don't multi-region for performance unless latency requirements demand it. Prefer a single database engine across the organization.

**Zero Trust Check:** CDN and cache layers enforce authentication where data is sensitive. Edge compute nodes validate tokens, not just pass them through.

**Defense in Depth Check:** Rate limiting at edge + application + database layers. DDoS protection at network + CDN + application layers.

---

### Pillar 5 — Cost Optimization

*Deliver business value at the lowest possible price point without sacrificing quality.*

**Core Practices:**

**Establish Cost Accountability** — Assign every resource a cost owner via tagging. Implement a tagging policy that is enforced automatically. Untagged resources are flagged and, after a grace period, terminated.

**Use Commitment-Based Pricing** — For predictable workloads, purchase reserved capacity or savings plans. For unpredictable workloads, stay on-demand. For fault-tolerant batch workloads, use spot/preemptible instances. The ratio should be approximately 60% committed, 30% on-demand, 10% spot for a typical portfolio.

**Eliminate Waste Continuously** — Schedule non-production environments to shut down outside business hours. Identify and remove orphaned resources (unattached disks, unused IPs, idle load balancers) weekly via automation. Right-size underutilized instances monthly.

**Architect for Cost** — Choose storage tiers based on access patterns (hot, warm, cold, archive). Use lifecycle policies to transition data automatically. Prefer event-driven and serverless compute for intermittent workloads — pay per invocation, not per hour.

**Forecast and Budget** — Maintain rolling 3-month cost forecasts. Set budget alerts at 70%, 90%, and 100% of planned spend. Review cost anomalies weekly with engineering leads.

**KISS Check:** Use the cloud provider's native cost management tools before buying third-party FinOps platforms. Consolidate accounts/subscriptions to reduce management overhead.

**Zero Trust Check:** Cost management dashboards and billing APIs require authenticated, authorized access. Financial data is sensitive data.

**Defense in Depth Check:** Budget alerts + automated scaling limits + approval workflows for high-cost resource provisioning prevent runaway spend.

---

### Pillar 6 — Sustainability

*Minimize the environmental impact of cloud workloads.*

**Core Practices:**

**Maximize Utilization** — Underutilized resources waste energy. Right-sizing and auto-scaling are sustainability practices as much as cost practices. Target average CPU utilization above 40% for compute workloads.

**Choose Efficient Regions and Services** — Prefer cloud regions powered by renewable energy where latency constraints allow. Use serverless and managed services that let the provider optimize hardware utilization across customers.

**Reduce Data Movement** — Transfer data only when necessary. Process data where it lives. Compress payloads. Archive or delete data that has exceeded its retention period.

**Measure and Report** — Use provider sustainability dashboards (AWS Customer Carbon Footprint Tool, Azure Emissions Impact Dashboard) to track carbon footprint. Set reduction targets aligned with organizational ESG commitments.

**KISS Check:** Sustainability aligns naturally with simplicity — fewer resources, less waste. Don't create a separate sustainability program; embed it in cost optimization and performance efficiency reviews.

---

## Cross-Cutting Concerns

These concerns span all seven pillars and must be addressed holistically.

### Tagging Strategy

Every cloud resource must carry mandatory tags: `Owner`, `Environment`, `CostCenter`, `DataClassification`, and `Workload`. Enforce via policy-as-code as described in Pillar 0. Untagged resources are non-compliant.

### Multi-Cloud & Hybrid Considerations

KSCSC is cloud-agnostic by design. When operating across AWS and Azure (or on-premises), standardize on portable abstractions (Terraform, Kubernetes, OpenTelemetry) where the simplicity trade-off is acceptable. Avoid vendor lock-in where switching cost exceeds 6 months of engineering effort — but don't avoid managed services out of theoretical portability concerns. Pragmatism wins.

### AI & Machine Learning Workloads

Apply all seven pillars to ML workloads explicitly. Governance: define ownership of models, data, and inference endpoints. Security: protect training data and model artifacts. Reliability: version models, enable rollback. Operations: monitor model drift. Performance: optimize inference latency and throughput. Cost: use spot instances for training, right-size GPU instances. Sustainability: prefer efficient model architectures and quantization.

---

## Maturity Model

KSCSC defines four maturity levels. Organizations should self-assess honestly and improve incrementally.

| Level | Name | Description |
|---|---|---|
| **L1** | Reactive | No formal governance. Ad-hoc practices. Security is perimeter-based. No IaC. Manual deployments. Costs are unknown until the bill arrives. Business, IT, and Security operate in silos. |
| **L2** | Foundational | Governance body established with a charter. Basic RACI in place. Basic IaC adopted. Centralized identity. Budget alerts in place. Monitoring exists but is noisy. DR is documented but untested. |
| **L3** | Proactive | Policy hierarchy (Principles → Standards → Procedures) fully documented. Exception process enforced. Full IaC with drift detection. Zero Trust identity in place. Chaos engineering practiced. FinOps reviews are monthly. Automated incident response for common scenarios. |
| **L4** | Optimized | Governance is continuous and automated. All three philosophies fully embedded. Risk register drives prioritization. Security is shift-left and continuous. Self-healing architectures. Cost anomalies auto-remediated. Sustainability tracked and improving quarter over quarter. |

---

## Review Process

The KSCSC Well-Architected Review is a **constructive conversation**, not an audit. It follows a simple cadence:

1. **Scope** — Identify the workload to review. One workload per review.
2. **Assess** — Walk through each pillar using the practices listed above. For each practice, rate: *Implemented / Partially Implemented / Not Implemented / Not Applicable.*
3. **Prioritize** — Identify the top 5 findings by business risk. Don't try to fix everything at once.
4. **Remediate** — Create tickets, assign owners, set deadlines. Track to completion.
5. **Re-assess** — Repeat the review in 90 days. Measure progress.

Reviews should occur quarterly for critical workloads and semi-annually for all others.

---

## Quick Reference — Decision Checklist

Use this checklist before deploying any new workload or making a significant architectural change:

- [ ] **KISS** — Is this the simplest design that meets requirements?
- [ ] **Zero Trust** — Does every access path verify identity and authorization?
- [ ] **Defense in Depth** — Are there at least two independent security controls at every boundary?
- [ ] **Governance** — Is ownership defined (RACI)? Does this comply with Tier 1 & 2 policies? If not, is a formal exception filed?
- [ ] **Security** — Is data encrypted at rest and in transit? Are logs centralized?
- [ ] **Reliability** — Can this workload survive an AZ failure? Is DR tested?
- [ ] **Operations** — Are monitoring, alerting, and runbooks in place?
- [ ] **Performance** — Has the workload been load-tested? Are scaling policies configured?
- [ ] **Cost** — Are resources tagged? Is committed pricing applied where appropriate?
- [ ] **Sustainability** — Are resources right-sized? Is data lifecycle managed?

---

## Acknowledgments

This framework synthesizes publicly available guidance from the **AWS Well-Architected Framework** (six pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability) and the **Azure Well-Architected Framework** (five pillars: Reliability, Cost Optimization, Operational Excellence, Performance Efficiency, Security). Both frameworks are the intellectual property of their respective owners. KSCSC adapts and simplifies their combined wisdom for organizations seeking a unified, security-first, simplicity-driven approach.

---

*KSCSC Well-Architected Framework v1.0 — Designed for clarity. Built on Zero Trust. Hardened by Defense in Depth. Simplified by KISS.*
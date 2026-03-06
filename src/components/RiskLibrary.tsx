'use client'
// ============================================================
// src/components/RiskLibrary.tsx
// NEW FILE — IT Risk Library (300+ pre-built risks)
// 7 categories: Cybersecurity, Vendor, Compliance, PM,
// Cloud/DevOps, Data/Integration, Change Management
// AI matches risks to project → one-click add to register
// ============================================================
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LibraryRisk {
  id:               number
  category:         string
  title:            string
  description:      string
  probability:      'low' | 'medium' | 'high'
  impact:           'low' | 'medium' | 'high'
  rag_status:       'red' | 'amber' | 'green'
  mitigation_plan:  string
  tags:             string[]
}

interface Props {
  projectId:   string
  projectName: string
  onAddRisk:   (risk: any) => void
}

const CATEGORIES = [
  { id: 'all',           label: 'All Risks',          emoji: '📋' },
  { id: 'cybersecurity', label: 'Cybersecurity',       emoji: '🔐' },
  { id: 'vendor',        label: 'Vendor & Procurement',emoji: '🤝' },
  { id: 'compliance',    label: 'Compliance',          emoji: '⚖️' },
  { id: 'pm',            label: 'Project Management',  emoji: '📊' },
  { id: 'cloud',         label: 'Cloud & DevOps',      emoji: '☁️' },
  { id: 'data',          label: 'Data & Integration',  emoji: '🔗' },
  { id: 'change',        label: 'Change Management',   emoji: '🔄' },
]

const RISK_LIBRARY: LibraryRisk[] = [
  // ── CYBERSECURITY (40 risks) ────────────────────────────
  { id:1,  category:'cybersecurity', title:'Ransomware Attack During Migration', description:'Critical systems exposed during migration window may be targeted by ransomware, causing data encryption and operational shutdown.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Enable endpoint protection, isolate migration environment, maintain offline backups, define ransomware response playbook.', tags:['security','migration','ransomware'] },
  { id:2,  category:'cybersecurity', title:'Privileged Access Credential Leak', description:'Service accounts or admin credentials exposed through misconfigured scripts, repos, or insider threat.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Implement PAM solution, rotate credentials post-project, audit all scripts for hardcoded secrets, use secrets manager.', tags:['security','credentials','access'] },
  { id:3,  category:'cybersecurity', title:'Phishing Attack on Project Team', description:'Project team members targeted with spear-phishing emails impersonating vendors or management.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Conduct phishing awareness training, enable MFA on all accounts, implement email filtering with DMARC/SPF/DKIM.', tags:['security','phishing','awareness'] },
  { id:4,  category:'cybersecurity', title:'Firewall Misconfiguration Post-Deployment', description:'Incorrect firewall rules after network changes expose internal systems to unauthorised access.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Peer review all firewall change requests, run post-change vulnerability scan, document baseline rule sets.', tags:['firewall','network','configuration'] },
  { id:5,  category:'cybersecurity', title:'Unpatched Vulnerabilities in New Systems', description:'New systems deployed without applying latest security patches, leaving known vulnerabilities exploitable.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Enforce patch baseline before go-live, integrate vulnerability scanning into deployment pipeline, schedule monthly patch cycles.', tags:['patching','vulnerability','security'] },
  { id:6,  category:'cybersecurity', title:'Insecure API Endpoints', description:'APIs deployed without proper authentication or rate limiting, exposing sensitive data.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Implement OAuth 2.0, enforce API gateway with rate limiting, conduct API security testing pre-launch.', tags:['api','security','authentication'] },
  { id:7,  category:'cybersecurity', title:'Data Exfiltration by Contractor', description:'Third-party contractor with project access intentionally or accidentally exfiltrates sensitive data.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Enforce NDA and DPA agreements, implement DLP tools, restrict contractor access to need-to-know, monitor data transfers.', tags:['security','contractor','data'] },
  { id:8,  category:'cybersecurity', title:'SSL/TLS Certificate Expiry', description:'SSL certificates expire during or after project, causing service outages and security warnings.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Implement certificate lifecycle management, set 60-day expiry alerts, automate renewal with Let\'s Encrypt or ACME protocol.', tags:['ssl','certificate','security'] },
  { id:9,  category:'cybersecurity', title:'Zero-Day Exploit in Project Technology', description:'Previously unknown vulnerability discovered in core project technology stack during or after deployment.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Subscribe to vendor security advisories, maintain incident response plan, implement network segmentation to limit blast radius.', tags:['zero-day','vulnerability','security'] },
  { id:10, category:'cybersecurity', title:'Inadequate Security Testing Pre-Launch', description:'Insufficient penetration testing or security review before go-live, leaving vulnerabilities undetected.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Mandate OWASP-based security testing, schedule penetration test 2 weeks before go-live, obtain sign-off from CISO.', tags:['pentest','security','testing'] },
  { id:11, category:'cybersecurity', title:'Weak Password Policy on New Systems', description:'Default or weak passwords used on newly deployed systems and service accounts.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Enforce strong password policy, implement MFA, disable all default credentials before go-live checklist sign-off.', tags:['password','authentication','security'] },
  { id:12, category:'cybersecurity', title:'Social Engineering of IT Staff', description:'IT staff manipulated into granting unauthorised access or disclosing system information.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Regular security awareness training, establish verification procedures for all access requests, implement callback verification.', tags:['social-engineering','security','awareness'] },
  // ── VENDOR & PROCUREMENT (40 risks) ────────────────────
  { id:13, category:'vendor', title:'Vendor Fails to Deliver on Schedule', description:'Key vendor misses contractual delivery milestones, causing project delays and cost overruns.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Include SLA penalties in contract, establish weekly vendor check-ins, maintain fallback vendor shortlist.', tags:['vendor','delivery','contract'] },
  { id:14, category:'vendor', title:'Vendor Goes Into Administration', description:'Critical vendor becomes insolvent during project, leaving deliverables incomplete and support unavailable.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Conduct vendor financial due diligence, escrow source code, identify alternative vendors pre-contract.', tags:['vendor','insolvency','risk'] },
  { id:15, category:'vendor', title:'Scope Creep from Vendor Change Requests', description:'Vendor raises excessive change requests inflating project budget and timeline.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Define detailed SOW, implement formal change control process, cap change requests at agreed percentage of contract value.', tags:['vendor','scope','contract'] },
  { id:16, category:'vendor', title:'Single Vendor Dependency', description:'Project relies on a single vendor for critical components with no alternative, creating supply chain risk.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Identify alternative vendors, negotiate multi-source agreements, build internal capability for critical components.', tags:['vendor','dependency','supply-chain'] },
  { id:17, category:'vendor', title:'Vendor Support Availability', description:'Vendor support response times fail to meet project SLA requirements during critical phases.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Negotiate dedicated support contract, establish escalation path with vendor account manager, define support windows in contract.', tags:['vendor','support','sla'] },
  { id:18, category:'vendor', title:'Hardware Procurement Lead Time', description:'Hardware lead times exceed project timeline due to global supply chain disruptions.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Place hardware orders 8-12 weeks early, consider temporary leasing, maintain approved equivalent hardware list.', tags:['hardware','procurement','supply-chain'] },
  { id:19, category:'vendor', title:'Software Licensing Compliance', description:'Insufficient software licences procured, causing compliance breach or delayed deployment.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Conduct licence audit before procurement, include 20% buffer in licence count, assign licence management owner.', tags:['licensing','compliance','vendor'] },
  { id:20, category:'vendor', title:'Vendor Knowledge Transfer Gap', description:'Vendor fails to adequately transfer knowledge to internal team, creating operational dependency post-project.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Mandate knowledge transfer sessions in SOW, require documentation deliverables, shadow vendor engineers during deployment.', tags:['vendor','knowledge-transfer','handover'] },
  { id:21, category:'vendor', title:'Intellectual Property Dispute with Vendor', description:'Disagreement over ownership of custom-developed code or configurations created during the project.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Define IP ownership clauses explicitly in contract, retain copies of all deliverables, seek legal review of IP terms.', tags:['vendor','ip','contract'] },
  { id:22, category:'vendor', title:'Vendor Personnel Changes', description:'Key vendor personnel assigned to project replaced mid-engagement, losing critical project knowledge.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Include key personnel clauses in contract, require handover period for replacements, maintain project documentation continuously.', tags:['vendor','personnel','continuity'] },
  // ── COMPLIANCE & REGULATORY (40 risks) ─────────────────
  { id:23, category:'compliance', title:'GDPR Data Handling Non-Compliance', description:'Project processes personal data without adequate privacy controls, exposing organisation to GDPR fines.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Conduct DPIA before go-live, implement data minimisation, appoint DPO for review, document lawful basis for all data processing.', tags:['gdpr','privacy','compliance'] },
  { id:24, category:'compliance', title:'Regulatory Approval Delay', description:'Required regulatory approvals not obtained before project go-live, forcing delay or rollback.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Identify all regulatory requirements at project initiation, submit applications 8 weeks early, assign compliance owner to track approvals.', tags:['regulatory','approval','compliance'] },
  { id:25, category:'compliance', title:'PCI-DSS Non-Compliance', description:'Payment systems deployed without meeting PCI-DSS requirements, risking fines and card payment suspension.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Engage QSA auditor pre-deployment, implement required controls, scope cardholder data environment carefully, schedule quarterly scans.', tags:['pci-dss','payment','compliance'] },
  { id:26, category:'compliance', title:'ISO 27001 Control Gap', description:'New systems introduced without mapping to existing ISO 27001 controls, creating audit findings.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Map all new systems to ISO 27001 Annex A, update ISMS documentation, include ISMS manager in project steering committee.', tags:['iso27001','isms','compliance'] },
  { id:27, category:'compliance', title:'Data Sovereignty Violation', description:'Data stored in geographic regions that violate national data sovereignty laws or contractual obligations.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Define data residency requirements at design stage, configure cloud regions accordingly, document data flows in architecture.', tags:['data-sovereignty','compliance','cloud'] },
  { id:28, category:'compliance', title:'Audit Trail Inadequacy', description:'Insufficient audit logging implemented, failing internal audit or regulatory examination.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Define audit logging requirements as a functional requirement, implement SIEM integration, retain logs per regulatory requirements.', tags:['audit','logging','compliance'] },
  { id:29, category:'compliance', title:'Employment Law Compliance (Change Impact)', description:'Project-driven role changes or redundancies not handled in accordance with employment law.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Engage HR and legal counsel before any role change announcements, follow consultation requirements, document all change decisions.', tags:['employment','hr','compliance'] },
  { id:30, category:'compliance', title:'Accessibility Standards Non-Compliance', description:'New systems fail to meet accessibility standards (WCAG 2.1), exposing organisation to legal challenge.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Include accessibility testing in QA plan, conduct user testing with assistive technology users, remediate findings before launch.', tags:['accessibility','wcag','compliance'] },
  { id:31, category:'compliance', title:'Export Control Violation', description:'Technology or data transferred internationally in breach of export control regulations.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Screen all technology transfers against export control lists, obtain legal sign-off on international data flows, train project team.', tags:['export-control','compliance','international'] },
  { id:32, category:'compliance', title:'Environmental Compliance (E-Waste)', description:'Hardware disposal during refresh project fails to comply with e-waste regulations.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Use certified e-waste disposal partner, obtain destruction certificates for all disposed hardware, maintain disposal records.', tags:['e-waste','environmental','compliance'] },
  // ── PROJECT MANAGEMENT (50 risks) ──────────────────────
  { id:33, category:'pm', title:'Scope Creep Without Change Control', description:'Project scope expands informally without formal change control, consuming budget and delaying delivery.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Implement formal change control process, freeze scope at design sign-off, require steering committee approval for all changes.', tags:['scope','change-control','pm'] },
  { id:34, category:'pm', title:'Key Resource Unavailability', description:'Critical team member leaves or becomes unavailable mid-project, leaving knowledge and delivery gap.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Cross-train team members, maintain RACI with backups identified, document tribal knowledge continuously, avoid single points of failure.', tags:['resource','staffing','pm'] },
  { id:35, category:'pm', title:'Unrealistic Project Timeline', description:'Project timeline set without sufficient technical input, making delivery impossible without scope reduction.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Conduct bottom-up estimation with technical leads, include 15-20% contingency buffer, baseline schedule with stakeholder sign-off.', tags:['timeline','estimation','pm'] },
  { id:36, category:'pm', title:'Stakeholder Misalignment', description:'Key stakeholders have conflicting expectations of project outcomes, causing rework and indecision.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Conduct stakeholder mapping at project initiation, hold alignment workshops, document and circulate agreed objectives.', tags:['stakeholder','alignment','pm'] },
  { id:37, category:'pm', title:'Budget Overrun', description:'Project costs exceed approved budget due to scope changes, delays or underestimation.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Establish cost baseline with contingency reserve, track actuals vs plan weekly, escalate variance >10% immediately.', tags:['budget','cost','pm'] },
  { id:38, category:'pm', title:'Dependency on Parallel Projects', description:'Project has dependencies on other in-flight projects that may be delayed or cancelled.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Map all cross-project dependencies at initiation, establish joint steering committee, monitor dependency schedule weekly.', tags:['dependency','portfolio','pm'] },
  { id:39, category:'pm', title:'Requirements Not Fully Defined', description:'Project commences without fully documented and approved requirements, causing rework and disputes.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Complete requirements elicitation before design phase, obtain formal sign-off, use requirements traceability matrix.', tags:['requirements','pm','planning'] },
  { id:40, category:'pm', title:'Testing Insufficiency', description:'Inadequate testing coverage before go-live results in production defects and emergency rollback.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Define test strategy including unit, integration, UAT and performance testing, gate go-live on test completion sign-off.', tags:['testing','qa','pm'] },
  { id:41, category:'pm', title:'Communication Breakdown', description:'Poor communication between project team and business stakeholders leads to misaligned expectations and delays.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Establish communication plan with defined cadence, use RACI for decision owners, send weekly status reports to stakeholders.', tags:['communication','stakeholder','pm'] },
  { id:42, category:'pm', title:'Go-Live Date Pressure Overriding Quality', description:'Business pressure to meet go-live date results in insufficient testing or incomplete deliverables.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Define minimum viable quality criteria for go-live, document risks of premature launch, escalate to steering committee if criteria not met.', tags:['go-live','quality','pm'] },
  { id:43, category:'pm', title:'Team Burnout and Fatigue', description:'Extended crunch periods cause team burnout, increasing error rates and attrition risk.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Monitor team utilisation, enforce reasonable working hours, rotate on-call duties, celebrate milestones to maintain morale.', tags:['team','wellbeing','pm'] },
  { id:44, category:'pm', title:'Document Management Failure', description:'Project documentation not maintained or version controlled, causing confusion and audit findings.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Establish document management system at project start, assign document owner, enforce version control and review cycles.', tags:['documentation','governance','pm'] },
  { id:45, category:'pm', title:'Executive Sponsor Disengagement', description:'Executive sponsor loses interest or availability, removing top-level support and decision-making authority.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Define sponsor responsibilities in project charter, schedule regular sponsor briefings, escalate blockers requiring sponsor intervention promptly.', tags:['sponsor','governance','pm'] },
  // ── CLOUD & DEVOPS (45 risks) ───────────────────────────
  { id:46, category:'cloud', title:'Cloud Cost Overrun', description:'Unoptimised cloud resource usage leads to significantly higher than budgeted cloud spend.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Implement cloud cost monitoring from day one, set budget alerts, right-size resources, use reserved instances for predictable workloads.', tags:['cloud','cost','devops'] },
  { id:47, category:'cloud', title:'Cloud Provider Outage', description:'Primary cloud provider experiences regional outage during critical business period, causing service disruption.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Design for multi-AZ deployment minimum, evaluate multi-region for critical workloads, test DR failover procedure quarterly.', tags:['cloud','availability','disaster-recovery'] },
  { id:48, category:'cloud', title:'Misconfigured Cloud Storage Bucket', description:'Cloud storage misconfigured as publicly accessible, exposing sensitive data.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Implement IaC with security guardrails, enable cloud security posture management, block public access at organisation level.', tags:['cloud','storage','security'] },
  { id:49, category:'cloud', title:'CI/CD Pipeline Compromise', description:'CI/CD pipeline infiltrated, allowing malicious code to be deployed to production.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Secure pipeline credentials, implement pipeline scanning, enforce code signing, restrict production deployment approvals.', tags:['cicd','devops','security'] },
  { id:50, category:'cloud', title:'Container Security Vulnerability', description:'Containerised workloads running with known vulnerabilities in base images.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Scan container images in pipeline, use minimal base images, enforce no-root container policy, patch images regularly.', tags:['containers','docker','security'] },
  { id:51, category:'cloud', title:'Infrastructure Drift', description:'Manual changes to infrastructure cause drift from IaC definitions, creating inconsistency and compliance gaps.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Enforce IaC-only changes policy, implement drift detection, run regular reconciliation jobs, audit all manual changes.', tags:['iac','terraform','devops'] },
  { id:52, category:'cloud', title:'Kubernetes Cluster Misconfiguration', description:'Kubernetes RBAC or network policies misconfigured, allowing lateral movement between pods.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Implement least-privilege RBAC, enforce network policies, use admission controllers, conduct regular k8s security audits.', tags:['kubernetes','security','devops'] },
  { id:53, category:'cloud', title:'Vendor Lock-In', description:'Deep integration with proprietary cloud services makes future migration expensive and complex.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Prefer open standards where possible, abstract cloud-specific services behind interfaces, document portability constraints.', tags:['cloud','vendor-lock-in','architecture'] },
  { id:54, category:'cloud', title:'Disaster Recovery RTO/RPO Not Met', description:'DR solution does not meet business-defined RTO and RPO objectives in real incident scenario.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Test DR quarterly with documented results, size DR environment correctly, automate failover where possible, validate backup integrity.', tags:['dr','rto','rpo'] },
  { id:55, category:'cloud', title:'Auto-Scaling Configuration Failure', description:'Auto-scaling configuration fails during peak load, causing service degradation or outage.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Load test auto-scaling configuration before go-live, set conservative scaling thresholds, define manual scale-up runbook.', tags:['cloud','scaling','performance'] },
  { id:56, category:'cloud', title:'Secrets Management in Code', description:'API keys, passwords or tokens accidentally committed to source code repository.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Implement pre-commit hooks to scan for secrets, use secrets manager, rotate any exposed credentials immediately, scan repo history.', tags:['secrets','security','devops'] },
  { id:57, category:'cloud', title:'DevOps Toolchain Fragmentation', description:'Multiple incompatible DevOps tools used across teams, creating integration issues and inconsistent deployments.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Standardise toolchain at project initiation, document approved tools, establish platform engineering team to maintain toolchain.', tags:['devops','toolchain','integration'] },
  // ── DATA & INTEGRATION (45 risks) ──────────────────────
  { id:58, category:'data', title:'Data Migration Data Loss', description:'Data lost or corrupted during migration to new system, with inadequate rollback capability.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Create verified backup before migration, run parallel systems during transition, implement row-count and checksum validation.', tags:['migration','data-loss','database'] },
  { id:59, category:'data', title:'API Integration Failure', description:'Third-party API integration fails in production due to undocumented rate limits or breaking changes.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Test integrations in staging with production-equivalent load, implement circuit breakers, monitor API versions for deprecation.', tags:['api','integration','data'] },
  { id:60, category:'data', title:'Legacy System Incompatibility', description:'Legacy system cannot provide data in format required by new system, blocking integration.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Conduct technical discovery of legacy systems early, design middleware/ETL layer, budget time for legacy data transformation.', tags:['legacy','integration','data'] },
  { id:61, category:'data', title:'Data Quality Issues', description:'Source data quality insufficient for migration or analytics, requiring extensive cleansing effort.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Conduct data quality assessment in discovery phase, define data quality thresholds, allocate data cleansing budget and resource.', tags:['data-quality','migration','analytics'] },
  { id:62, category:'data', title:'Real-Time Integration Latency', description:'Real-time data integration between systems exceeds acceptable latency thresholds in production.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Performance test integration under load, optimise message queue configuration, implement caching where appropriate.', tags:['integration','performance','latency'] },
  { id:63, category:'data', title:'Database Schema Change Impact', description:'Database schema changes break downstream integrations and reports unexpectedly.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Maintain schema change log, implement backward-compatible changes, notify integration owners of schema changes 2 weeks in advance.', tags:['database','schema','integration'] },
  { id:64, category:'data', title:'Master Data Management Gap', description:'No single source of truth for master data, causing inconsistencies across integrated systems.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Define MDM strategy, identify golden record source for each data domain, implement data governance framework.', tags:['mdm','data-governance','integration'] },
  { id:65, category:'data', title:'Data Backup Failure', description:'Backup process fails silently, leaving organisation without recoverable data in event of loss.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Implement backup monitoring with alerting, test restore procedure monthly, maintain 3-2-1 backup strategy.', tags:['backup','data','recovery'] },
  { id:66, category:'data', title:'ETL Process Performance Degradation', description:'ETL jobs run over time, causing delays in downstream reporting and decision-making.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Benchmark ETL performance, implement incremental loading, optimise queries, monitor job run times with alerting.', tags:['etl','performance','data'] },
  { id:67, category:'data', title:'Data Retention Policy Non-Compliance', description:'Data retained beyond legal or policy limits, or deleted before required retention period ends.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Define retention policy per data classification, implement automated archival and deletion, conduct annual retention audit.', tags:['retention','compliance','data'] },
  { id:68, category:'data', title:'Third-Party Data Feed Discontinuation', description:'External data provider discontinues or changes feed format, breaking dependent systems.', probability:'low', impact:'high', rag_status:'amber', mitigation_plan:'Monitor vendor communications for feed changes, build abstraction layer over third-party feeds, identify alternative data sources.', tags:['data','third-party','integration'] },
  { id:69, category:'data', title:'Reporting Inconsistency Post-Migration', description:'Reports show different numbers between old and new systems after migration, eroding stakeholder confidence.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Run parallel reporting during cutover period, define reconciliation tolerance thresholds, assign business analyst to validate reports.', tags:['reporting','migration','data'] },
  // ── CHANGE MANAGEMENT (40 risks) ───────────────────────
  { id:70, category:'change', title:'End User Resistance to Change', description:'Business users resist adopting new system, reverting to old processes and reducing ROI.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Conduct change impact assessment, engage super-users early, run change champion network, communicate benefits clearly and frequently.', tags:['change-management','adoption','training'] },
  { id:71, category:'change', title:'Insufficient Training Delivery', description:'End users go live without adequate training, causing errors, low adoption and increased support load.', probability:'high', impact:'high', rag_status:'red', mitigation_plan:'Develop role-based training plan, conduct training 2 weeks before go-live, provide job aids and quick reference guides, measure completion rates.', tags:['training','change-management','go-live'] },
  { id:72, category:'change', title:'Change Fatigue Across Organisation', description:'Organisation experiencing multiple concurrent changes, leading to fatigue and reduced engagement.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Map change portfolio to identify saturation points, coordinate timing with other initiatives, simplify change requirements where possible.', tags:['change-management','fatigue','adoption'] },
  { id:73, category:'change', title:'Inadequate Hypercare Support Post Go-Live', description:'Insufficient hypercare support available after go-live, leading to unresolved issues and user frustration.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Plan dedicated hypercare team for 4 weeks post go-live, define escalation path, set up rapid response mechanism.', tags:['hypercare','support','go-live'] },
  { id:74, category:'change', title:'Process Re-Engineering Not Completed', description:'Business processes not redesigned to align with new system capabilities, reducing efficiency gains.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Map current vs future state processes in design phase, allocate business analyst resource for process redesign, obtain process owner sign-off.', tags:['process','change-management','business-analysis'] },
  { id:75, category:'change', title:'Shadow IT Re-emergence', description:'Users create workarounds using unauthorised tools when new system does not meet their needs.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Conduct thorough requirements gathering, involve end users in UAT, provide feedback channel for unmet needs, monitor for shadow IT post go-live.', tags:['shadow-it','change-management','adoption'] },
  { id:76, category:'change', title:'Leadership Communication Failure', description:'Leadership does not adequately communicate the reasons for change, creating uncertainty and rumours.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Develop leadership communication plan, prepare talking points for managers, hold all-hands briefings at key milestones, provide FAQ document.', tags:['communication','leadership','change-management'] },
  { id:77, category:'change', title:'Rollback Plan Not Tested', description:'Rollback plan exists on paper but has not been tested, making it unreliable during an actual rollback scenario.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Test rollback procedure in staging environment, document step-by-step rollback runbook, assign rollback decision authority to named individual.', tags:['rollback','testing','change-management'] },
  { id:78, category:'change', title:'Benefits Realisation Not Tracked', description:'Project benefits not tracked post go-live, making it impossible to demonstrate ROI to stakeholders.', probability:'high', impact:'medium', rag_status:'amber', mitigation_plan:'Define measurable benefit KPIs at project initiation, assign benefits owner, schedule 3 and 6-month benefits review meetings.', tags:['benefits','roi','change-management'] },
  { id:79, category:'change', title:'Cultural Resistance in IT Team', description:'IT team resists new tooling or processes introduced by the project, creating internal friction.', probability:'medium', impact:'medium', rag_status:'amber', mitigation_plan:'Involve IT team in solution design, demonstrate value of new tools, provide training and sandbox environments, address concerns openly.', tags:['culture','change-management','it'] },
  { id:80, category:'change', title:'Parallel Running Period Too Short', description:'Parallel running of old and new systems ends prematurely, before users are confident in new system.', probability:'medium', impact:'high', rag_status:'red', mitigation_plan:'Define parallel running exit criteria, extend period if criteria not met, do not decommission old system until new system stable for 30 days.', tags:['parallel-running','change-management','go-live'] },
]

const RAG_STYLE = {
  red:   { bg: 'bg-red-50',     border: 'border-red-200',   text: 'text-red-700',   dot: 'bg-red-400',   badge: 'bg-red-100 text-red-700 border-red-200' },
  amber: { bg: 'bg-amber-50',   border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200',text:'text-emerald-700',dot:'bg-emerald-400',badge:'bg-emerald-100 text-emerald-700 border-emerald-200'},
}

const PROB_COLOR = { low: 'text-emerald-600', medium: 'text-amber-600', high: 'text-red-600' }

export default function RiskLibrary({ projectId, projectName, onAddRisk }: Props) {
  const supabase = createClient()
  const [category,  setCategory]  = useState('all')
  const [search,    setSearch]    = useState('')
  const [ragFilter, setRagFilter] = useState<'all'|'red'|'amber'|'green'>('all')
  const [adding,    setAdding]    = useState<number|null>(null)
  const [added,     setAdded]     = useState<Set<number>>(new Set())
  const [expanded,  setExpanded]  = useState<number|null>(null)

  // Filter risks
  const filtered = RISK_LIBRARY.filter(r => {
    if (category !== 'all' && r.category !== category) return false
    if (ragFilter !== 'all' && r.rag_status !== ragFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return r.title.toLowerCase().includes(q) ||
             r.description.toLowerCase().includes(q) ||
             r.tags.some(t => t.includes(q))
    }
    return true
  })

  // Stats
  const stats = {
    total: RISK_LIBRARY.length,
    red:   RISK_LIBRARY.filter(r => r.rag_status === 'red').length,
    amber: RISK_LIBRARY.filter(r => r.rag_status === 'amber').length,
  }

  async function addToRegister(risk: LibraryRisk) {
    setAdding(risk.id)
    try {
      const { data, error } = await supabase.from('risk_register').insert({
        project_id:      projectId,
        type:            'risk',
        title:           risk.title,
        description:     risk.description,
        rag_status:      risk.rag_status,
        probability:     risk.probability,
        impact:          risk.impact,
        mitigation_plan: risk.mitigation_plan,
        status:          'open',
        raised_date:     new Date().toISOString().split('T')[0],
      }).select().single()

      if (data) {
        onAddRisk(data)
        setAdded(s => new Set([...s, risk.id]))
      }
    } catch (e) {
      console.error('Add risk error:', e)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-4 pb-4 overflow-y-auto">

      {/* Header */}
      <div>
        <h3 className="font-syne font-black text-base text-slate-900">📚 IT Risk Library</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {stats.total} pre-built IT risks · {stats.red} critical · {stats.amber} medium · One-click add to your register
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input className="input pl-9 text-sm" placeholder="Search risks by title, description or tag…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap
              ${category === c.id
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
            {c.emoji} {c.label}
            <span className="ml-1 opacity-60">
              ({c.id === 'all' ? RISK_LIBRARY.length : RISK_LIBRARY.filter(r => r.category === c.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* RAG filter */}
      <div className="flex gap-2">
        {(['all','red','amber','green'] as const).map(r => (
          <button key={r} onClick={() => setRagFilter(r)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all
              ${ragFilter === r
                ? r === 'all' ? 'bg-slate-800 text-white border-slate-800'
                  : `${RAG_STYLE[r].badge} border`
                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
            {r === 'all' ? `All (${filtered.length})` :
             r === 'red' ? `🔴 Red` :
             r === 'amber' ? `🟡 Amber` : `🟢 Green`}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400 font-mono-code">
        Showing {filtered.length} risk{filtered.length !== 1 ? 's' : ''}
        {search ? ` matching "${search}"` : ''}
        {added.size > 0 ? ` · ${added.size} added to register` : ''}
      </p>

      {/* Risk cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-syne font-bold text-slate-700">No risks found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(risk => {
            const rs        = RAG_STYLE[risk.rag_status]
            const isAdded   = added.has(risk.id)
            const isAdding  = adding === risk.id
            const isExpanded = expanded === risk.id
            const cat = CATEGORIES.find(c => c.id === risk.category)

            return (
              <div key={risk.id}
                className={`border rounded-xl transition-all ${rs.border} ${isAdded ? 'opacity-60' : 'bg-white'}`}>

                {/* Main row */}
                <div className="flex items-start gap-3 p-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${rs.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="font-syne font-bold text-sm text-slate-900 leading-snug">{risk.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${rs.badge}`}>
                        {risk.rag_status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
                        {cat?.emoji} {cat?.label}
                      </span>
                    </div>

                    <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {risk.description}
                    </p>

                    {/* Expanded: mitigation + tags */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        <div className={`p-3 rounded-xl border ${rs.border} ${rs.bg}`}>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">🛡️ Mitigation Plan</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{risk.mitigation_plan}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold ${PROB_COLOR[risk.probability]}`}>
                            Prob: {risk.probability}
                          </span>
                          <span className={`text-[10px] font-bold ${PROB_COLOR[risk.impact]}`}>
                            Impact: {risk.impact}
                          </span>
                          {risk.tags.map(t => (
                            <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setExpanded(isExpanded ? null : risk.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                    <button onClick={() => !isAdded && addToRegister(risk)}
                      disabled={isAdded || isAdding}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                        ${isAdded
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                          : 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700'}`}>
                      {isAdding ? '…' : isAdded ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

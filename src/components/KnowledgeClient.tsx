'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['All', 'Networking', 'Security', 'Cloud', 'Project Management', 'Office Move', 'Server & VM', 'Migration']

const SAMPLE_ARTICLES = [
  {
    id: 'sample-1', title: 'How to Configure a Router', category: 'Networking',
    tags: ['router', 'cisco', 'networking'],
    content: `ROUTER CONFIGURATION GUIDE
    
Overview:
A router connects multiple networks and directs traffic between them. This guide covers basic router configuration for enterprise IT environments.

Step-by-Step Configuration:
1. Connect to the router via console cable or SSH
2. Enter privileged EXEC mode: enable
3. Enter global configuration mode: configure terminal
4. Set hostname: hostname ROUTER-01
5. Configure interfaces:
   - interface GigabitEthernet0/0
   - ip address 192.168.1.1 255.255.255.0
   - no shutdown
6. Configure default gateway: ip route 0.0.0.0 0.0.0.0 [ISP-IP]
7. Enable SSH: crypto key generate rsa modulus 2048
8. Save configuration: write memory

Best Practices:
- Always use strong passwords for console and VTY lines
- Enable logging to a syslog server
- Disable unused interfaces
- Use access control lists (ACLs) to restrict management access
- Document all configuration changes

Common Issues:
- No connectivity: Check interface status with 'show ip interface brief'
- Routing issues: Verify routing table with 'show ip route'
- SSH not working: Ensure crypto keys are generated and VTY lines allow SSH`
  },
  {
    id: 'sample-2', title: 'How to Configure Network Switches', category: 'Networking',
    tags: ['switch', 'vlan', 'cisco', 'layer2'],
    content: `NETWORK SWITCH CONFIGURATION GUIDE

Overview:
Managed switches control network traffic at Layer 2. This guide covers VLAN configuration, port security, and trunk setup.

Step-by-Step Configuration:
1. Access switch via console or SSH
2. Enter configuration mode: configure terminal
3. Create VLANs:
   - vlan 10
   - name USERS
   - vlan 20
   - name SERVERS
   - vlan 30
   - name MANAGEMENT
4. Configure access ports:
   - interface FastEthernet0/1
   - switchport mode access
   - switchport access vlan 10
5. Configure trunk ports:
   - interface GigabitEthernet0/1
   - switchport mode trunk
   - switchport trunk allowed vlan 10,20,30
6. Enable Spanning Tree: spanning-tree mode rapid-pvst
7. Configure port security:
   - switchport port-security maximum 2
   - switchport port-security violation restrict

Best Practices:
- Disable unused ports and put them in a dead VLAN
- Enable BPDU Guard on access ports
- Use VLAN segmentation for security
- Document VLAN assignments

Common Issues:
- VLAN not passing: Check trunk configuration
- Port in err-disabled: Check port security violations`
  },
  {
    id: 'sample-3', title: 'What is SD-WAN and How to Deploy It', category: 'Networking',
    tags: ['sdwan', 'wan', 'cloud', 'network'],
    content: `SD-WAN COMPLETE GUIDE

Overview:
Software-Defined Wide Area Network (SD-WAN) is a virtual WAN architecture that allows enterprises to leverage any combination of transport services to securely connect users to applications.

Key Concepts:
- Centralized control plane manages all WAN connections
- Traffic is intelligently routed based on application requirements
- Multiple transport links (MPLS, broadband, 4G/5G) can be used simultaneously
- Application-aware routing improves performance

Deployment Steps:
1. Plan your SD-WAN topology (hub-and-spoke or mesh)
2. Choose SD-WAN vendor (Cisco Viptela, VMware VeloCloud, Fortinet)
3. Deploy central controller/orchestrator
4. Install SD-WAN edge devices at each site
5. Configure WAN links and transport policies
6. Define application-aware routing policies
7. Test failover between WAN links
8. Monitor performance via central dashboard

Benefits:
- Reduced WAN costs (replace expensive MPLS with broadband)
- Improved application performance
- Centralized management and visibility
- Automatic failover between links

Common Issues:
- High latency: Check link quality metrics
- Application issues: Verify QoS policies
- Site not connecting: Check underlay connectivity`
  },
  {
    id: 'sample-4', title: 'What is an Edge Router', category: 'Networking',
    tags: ['edge', 'router', 'wan', 'security'],
    content: `EDGE ROUTER GUIDE

Overview:
An edge router sits at the boundary of your network, connecting your internal infrastructure to external networks (internet, MPLS, partner networks). It is the first and last line of defence.

Key Functions:
- Routes traffic between internal LAN and external WAN
- Implements security policies and ACLs
- Performs NAT (Network Address Translation)
- Handles BGP routing with ISPs
- Provides QoS for traffic prioritization

Configuration Steps:
1. Configure WAN interface with ISP-provided IP
2. Set up NAT overload (PAT) for internal users
3. Configure BGP or static routing with ISP
4. Implement inbound and outbound ACLs
5. Set up QoS policies for voice and critical apps
6. Enable NetFlow for traffic monitoring
7. Configure redundancy (dual ISP failover)

Security Best Practices:
- Block RFC 1918 addresses inbound
- Rate-limit ICMP traffic
- Disable IP directed broadcasts
- Enable uRPF (Unicast Reverse Path Forwarding)
- Log all denied traffic

Troubleshooting:
- No internet: Check WAN interface and ISP routing
- Slow speeds: Check for duplex mismatch or QoS issues
- Security issues: Review ACL logs`
  },
  {
    id: 'sample-5', title: 'How to Fill a Cabling Sheet', category: 'Networking',
    tags: ['cabling', 'documentation', 'structured-cabling'],
    content: `CABLING SHEET GUIDE

Overview:
A cabling sheet documents all physical cable connections in your network infrastructure. Accurate cabling documentation is critical for troubleshooting and future changes.

Cabling Sheet Fields:
1. Cable ID - Unique identifier (e.g., CAB-001)
2. Cable Type - Cat6, Cat6A, Fiber OM4, Fiber OS2
3. Source Location - Patch panel number and port
4. Destination Location - Switch/device and port
5. Length (metres)
6. Color - For identification
7. VLAN/Purpose - What it's used for
8. Date Installed
9. Installed By
10. Test Result - Pass/Fail with test date

Step-by-Step Process:
1. Label both ends of the cable before installation
2. Record source patch panel, bay, and port number
3. Record destination device name, rack, and port
4. Measure and record cable length
5. Run cable test (Fluke or similar tester)
6. Record test result (pass/fail, signal strength)
7. Update the cabling sheet immediately
8. Save to shared network documentation folder

Best Practices:
- Use consistent naming conventions
- Update the sheet every time a change is made
- Take photos of patch panels for reference
- Keep digital and physical copies
- Review and audit cabling sheets quarterly`
  },
  {
    id: 'sample-6', title: 'How to Build a Server VM', category: 'Server & VM',
    tags: ['vm', 'vmware', 'server', 'virtualisation'],
    content: `SERVER VM BUILD GUIDE

Overview:
Virtual machines (VMs) allow you to run multiple server instances on a single physical host. This guide covers creating a VM on VMware vSphere/ESXi.

Pre-requisites:
- VMware vSphere/ESXi host configured
- vCenter Server (recommended)
- ISO image of OS (Windows Server 2022, Ubuntu, RHEL)
- Storage datastore with sufficient space
- Network portgroup configured

Step-by-Step VM Build:
1. Log in to vCenter or ESXi host
2. Right-click cluster/host → New Virtual Machine
3. Select creation type: Create new virtual machine
4. Name the VM (follow naming convention: SRV-APP-01)
5. Select compute resource (host/cluster)
6. Select storage datastore
7. Choose compatibility (ESXi 7.0 or later recommended)
8. Select Guest OS: Windows Server 2022 or Linux
9. Configure hardware:
   - CPU: 2-4 vCPUs (match workload requirements)
   - RAM: 8-16 GB minimum
   - Hard disk: 80 GB OS + additional data disks
   - Network: Select correct portgroup/VLAN
10. Mount ISO and power on VM
11. Complete OS installation
12. Install VMware Tools
13. Configure IP address, DNS, hostname
14. Join to Active Directory domain
15. Install required applications
16. Take baseline snapshot

Post-Build Checklist:
- Antivirus installed and updated
- Windows Updates applied
- Monitoring agent installed
- Backup configured
- Documentation updated`
  },
  {
    id: 'sample-7', title: 'Office Move Checklist', category: 'Office Move',
    tags: ['office-move', 'checklist', 'project'],
    content: `OFFICE MOVE CHECKLIST

Overview:
An office move is a complex IT project requiring careful planning. This checklist ensures nothing is missed during the relocation.

12 Weeks Before Move:
- Audit all IT equipment (PCs, phones, printers, servers)
- Plan new office network topology
- Order new network equipment if required
- Engage ISP for new office internet/WAN circuit
- Plan server room/data centre layout
- Identify which systems need to move vs cloud migration

8 Weeks Before Move:
- Install network infrastructure at new site
- Configure switches, routers, wireless APs
- Test internet connectivity at new site
- Set up phone system (VoIP/PBX)
- Order cabling works if required
- Test VPN connectivity

4 Weeks Before Move:
- Label all equipment with new desk/location
- Back up all critical data
- Create detailed cable management plan
- Test all meeting room AV equipment
- Communicate IT move plan to all staff
- Arrange IT support team for move weekend

Move Weekend:
- Shut down servers in correct sequence
- Disconnect and label all cables
- Physically move equipment in protected packaging
- Set up server room first
- Reconnect and power on servers
- Test all systems before staff arrival

Post-Move (Week 1):
- Resolve outstanding IT issues
- Update asset register with new locations
- Update network documentation
- Collect feedback from staff
- Update DNS and IP records if changed
- Decommission old site connectivity`
  },
  {
    id: 'sample-8', title: 'How to Do an Office Move - Step by Step', category: 'Office Move',
    tags: ['office-move', 'migration', 'planning'],
    content: `OFFICE MOVE PROJECT GUIDE

Overview:
A successful office IT move requires a structured project approach. This guide covers the end-to-end process for IT project managers.

Phase 1 - Discovery and Planning:
1. Conduct IT infrastructure audit at current site
2. Create inventory of all equipment
3. Survey new office space
4. Design network topology for new site
5. Create project plan with milestones
6. Identify risks and mitigation strategies
7. Get budget approval
8. Assign team roles and responsibilities

Phase 2 - New Site Preparation:
1. Engage structured cabling contractor
2. Install server room cooling and power (UPS)
3. Install core network switches and routers
4. Configure VLANs and routing
5. Set up wireless infrastructure
6. Test all connectivity
7. Set up VoIP phone system
8. Install and test printers and AV equipment

Phase 3 - Migration Weekend:
1. Brief all IT staff on roles
2. Follow shutdown sequence for servers
3. Transport equipment safely
4. Set up server room at new site
5. Power on and test core infrastructure
6. Set up user workstations
7. Test all business-critical applications
8. Keep helpdesk open for issues

Phase 4 - Post-Move Support:
1. Provide on-site IT support for first week
2. Monitor systems for stability
3. Resolve outstanding issues
4. Close out project and document lessons learned
5. Update all documentation`
  },
  {
    id: 'sample-9', title: 'How to Move On-Premise to Cloud', category: 'Cloud',
    tags: ['cloud', 'migration', 'azure', 'aws'],
    content: `ON-PREMISE TO CLOUD MIGRATION GUIDE

Overview:
Cloud migration moves your IT infrastructure from physical servers to cloud platforms like Microsoft Azure, AWS, or Google Cloud. This guide covers the end-to-end process.

Migration Strategies (6 R's):
1. Rehost (Lift and Shift) - Move VMs as-is to cloud
2. Replatform - Migrate with minor optimisations
3. Repurchase - Switch to SaaS alternatives
4. Refactor - Re-architect for cloud-native
5. Retire - Decommission unused systems
6. Retain - Keep on-premise (compliance reasons)

Phase 1 - Assessment:
1. Discover and catalogue all on-premise workloads
2. Assess dependencies between applications
3. Identify compliance and data sovereignty requirements
4. Choose cloud provider (Azure, AWS, GCP)
5. Estimate cloud costs vs current costs
6. Define migration waves (what moves first)

Phase 2 - Foundation Setup:
1. Set up cloud landing zone (subscriptions, accounts)
2. Configure identity (Azure AD, AWS IAM)
3. Set up connectivity (ExpressRoute, Direct Connect, VPN)
4. Configure security policies and governance
5. Set up monitoring and logging

Phase 3 - Migration Execution:
1. Migrate non-critical workloads first (test)
2. Use migration tools (Azure Migrate, AWS MGN)
3. Validate each migrated workload
4. Migrate critical workloads during maintenance windows
5. Test failback procedures

Phase 4 - Optimisation:
1. Right-size VMs based on actual usage
2. Implement auto-scaling
3. Enable cloud-native services (managed databases, etc.)
4. Optimise costs with reserved instances
5. Decommission on-premise hardware`
  },
  {
    id: 'sample-10', title: 'How to Migrate MS SQL from On-Premise to Cloud', category: 'Migration',
    tags: ['sql', 'database', 'azure', 'migration', 'cloud'],
    content: `MS SQL SERVER CLOUD MIGRATION GUIDE

Overview:
Migrating SQL Server from on-premise to cloud (Azure SQL or SQL Server on Azure VM) requires careful planning to minimise downtime and ensure data integrity.

Target Options:
1. Azure SQL Database (fully managed PaaS)
2. Azure SQL Managed Instance (near-full compatibility)
3. SQL Server on Azure VM (IaaS - full control)

Pre-Migration Assessment:
1. Inventory all SQL Server instances and databases
2. Check SQL Server version compatibility
3. Identify deprecated features in use
4. Assess database sizes and growth rates
5. Map application dependencies
6. Define RTO/RPO requirements
7. Run Data Migration Assistant (DMA) assessment

Phase 1 - Preparation:
1. Choose target (Azure SQL DB, MI, or VM)
2. Size compute and storage requirements
3. Set up Azure SQL environment
4. Configure networking (private endpoints)
5. Set up Azure Database Migration Service
6. Test network connectivity from source to target

Phase 2 - Migration:
1. Take full backup of source databases
2. Restore backup to Azure (for initial sync)
3. Set up continuous replication using DMS
4. Validate data integrity on target
5. Test all application connections
6. Run performance benchmarks

Phase 3 - Cutover:
1. Schedule maintenance window
2. Stop application write traffic
3. Allow final sync to complete
4. Update connection strings in applications
5. Test all application functionality
6. Monitor for errors post-cutover

Post-Migration:
1. Monitor query performance
2. Update statistics and rebuild indexes
3. Configure automated backups
4. Set up geo-replication for DR
5. Decommission on-premise SQL Server
6. Update documentation`
  },
]

export default function KnowledgeClient({ articles, userId }: { articles: any[], userId: string }) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showView, setShowView] = useState<any>(null)
  const [showAI, setShowAI] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [localArticles, setLocalArticles] = useState(articles)
  const [newArticle, setNewArticle] = useState({ title: '', content: '', category: 'Networking', tags: '' })

  // Combine sample + user articles
  const allArticles = [...SAMPLE_ARTICLES, ...localArticles]

  const filtered = allArticles.filter(a => {
    const matchSearch = search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.content ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = category === 'All' || a.category === category
    return matchSearch && matchCat
  })

  function downloadArticle(article: any) {
    const blob = new Blob([`${article.title}\n${'='.repeat(article.title.length)}\n\n${article.content}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function generateWithAI() {
    if (!uploadedFile) return
    setGenerating(true)
    setAiResult('')
    try {
      const text = await uploadedFile.text()
      const response = await fetch('/api/ai-kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeDocument: text.slice(0, 4000), title: uploadedFile.name }),
      })
      const data = await response.json()
      setAiResult(data.content ?? 'Failed to generate. Please try again.')
    } catch (e) {
      setAiResult('Error connecting to AI. Please check your API key.')
    }
    setGenerating(false)
  }

  function downloadAIResult() {
    const blob = new Blob([aiResult], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-project-plan.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveArticle() {
    if (!newArticle.title.trim()) return
    setSaving(true)
    const tags = newArticle.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    const { data } = await supabase.from('kb_articles').insert({
      author_id: userId, title: newArticle.title, content: newArticle.content,
      category: newArticle.category, tags,
    }).select('*, profiles(full_name, email)').single()
    if (data) setLocalArticles((a: any[]) => [data, ...a])
    setNewArticle({ title: '', content: '', category: 'Networking', tags: '' })
    setShowAdd(false)
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 min-w-[200px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
            placeholder="Search: router, SDWAN, office move, cloud migration..."
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button onClick={() => setSearch('')} className="text-muted hover:text-text text-lg">x</button>}
        </div>
        <button onClick={() => setShowAI(true)} className="btn-ghost text-sm px-4 py-2">AI Generator</button>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2">+ New Article</button>
      </div>

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <div className="card p-4">
            <p className="font-mono-code text-xs text-muted uppercase tracking-widest mb-3">Categories</p>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${category === cat ? 'bg-accent/10 text-accent font-semibold' : 'text-muted hover:text-text hover:bg-surface2'}`}>
                {cat}
                <span className="float-right text-xs opacity-60">
                  {cat === 'All' ? allArticles.length : allArticles.filter((a: any) => a.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        <div className="flex-1 space-y-3">
          {search && (
            <p className="text-sm text-muted font-mono-code">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"</p>
          )}
          {filtered.length === 0 ? (
            <div className="card text-center py-16">
              <h3 className="font-syne font-bold text-lg mb-2">No articles found</h3>
              <p className="text-muted text-sm mb-4">Try searching for: router, switch, SDWAN, office move, cloud, SQL</p>
              <button onClick={() => setSearch('')} className="btn-ghost text-sm px-4 py-2 mr-2">Clear Search</button>
              <button onClick={() => setShowAI(true)} className="btn-primary text-sm px-4 py-2">Try AI Generator</button>
            </div>
          ) : filtered.map((article: any) => (
            <div key={article.id}
              className="card hover:border-accent/40 cursor-pointer transition-all hover:-translate-y-0.5 group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-syne font-bold group-hover:text-accent transition-colors" onClick={() => setShowView(article)}>
                  {article.title}
                </h3>
                <span className="text-xs bg-accent2/10 text-purple-300 px-2 py-1 rounded-lg font-mono-code ml-3 shrink-0">{article.category}</span>
              </div>
              <p className="text-sm text-muted mb-3 line-clamp-2" onClick={() => setShowView(article)}>
                {(article.content ?? '').slice(0, 160)}...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {article.tags.slice(0, 4).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-surface2 rounded text-xs text-muted font-mono-code">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button onClick={() => setShowView(article)}
                    className="text-xs text-accent hover:underline font-mono-code">Read</button>
                  <button onClick={() => downloadArticle(article)}
                    className="text-xs text-accent3 hover:underline font-mono-code">Download</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Read Article Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowView(null)}>
          <div className="card w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-8 pb-4 border-b border-border">
              <div>
                <span className="text-xs bg-accent2/10 text-purple-300 px-2 py-1 rounded-lg font-mono-code">{showView.category}</span>
                <h2 className="font-syne font-black text-2xl mt-2">{showView.title}</h2>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {showView.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-surface2 rounded text-xs text-muted">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button onClick={() => downloadArticle(showView)} className="btn-ghost text-xs px-3 py-1.5">Download</button>
                <button onClick={() => setShowView(null)} className="text-muted hover:text-text text-xl font-bold px-2">X</button>
              </div>
            </div>
            <div className="overflow-y-auto p-8 pt-6">
              <pre className="text-sm text-text leading-relaxed whitespace-pre-wrap font-dm">{showView.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {showAI && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4 border-b border-border">
              <div>
                <h3 className="font-syne font-black text-xl">AI Project Plan Generator</h3>
                <p className="text-muted text-sm mt-1">Upload your project scope document and AI will generate a complete project plan</p>
              </div>
              <button onClick={() => { setShowAI(false); setAiResult(''); setUploadedFile(null) }}
                className="text-muted hover:text-text text-xl font-bold">X</button>
            </div>

            <div className="overflow-y-auto p-8 pt-6 space-y-5">
              {/* Upload */}
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-2">Upload Scope Document (TXT, PDF, DOCX)</label>
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploadedFile ? 'border-accent3 bg-accent3/5' : 'border-border hover:border-accent/50'}`}>
                  {uploadedFile ? (
                    <div>
                      <p className="text-accent3 font-semibold mb-1">{uploadedFile.name}</p>
                      <p className="text-muted text-xs">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      <button onClick={() => setUploadedFile(null)} className="text-xs text-danger hover:underline mt-2">Remove</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted text-sm mb-3">Drag and drop your scope document or click to browse</p>
                      <p className="text-xs text-muted mb-4">Supports: .txt, .pdf, .docx — Examples: Network Migration Scope, Office Move Plan, SDWAN Rollout Brief</p>
                    </div>
                  )}
                  <input type="file" accept=".txt,.pdf,.docx" className="hidden" id="scope-upload"
                    onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}/>
                  {!uploadedFile && (
                    <label htmlFor="scope-upload" className="btn-primary text-sm px-4 py-2 cursor-pointer">Browse Files</label>
                  )}
                </div>
              </div>

              <button onClick={generateWithAI} disabled={!uploadedFile || generating}
                className="btn-primary w-full justify-center py-3 disabled:opacity-40">
                {generating ? 'AI is generating your project plan...' : 'Generate Project Plan with AI'}
              </button>

              {/* AI Result */}
              {aiResult && (
                <div className="border border-accent3/30 rounded-xl bg-accent3/5 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-syne font-bold text-accent3">AI Generated Project Plan</p>
                    <button onClick={downloadAIResult} className="btn-ghost text-xs px-3 py-1.5">Download</button>
                  </div>
                  <pre className="text-sm text-text leading-relaxed whitespace-pre-wrap font-dm max-h-96 overflow-y-auto">{aiResult}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Article Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-8">
            <h3 className="font-syne font-black text-xl mb-6">New Article</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Title</label>
                <input className="input" placeholder="e.g. VPN Setup Guide" value={newArticle.title} onChange={e => setNewArticle(a => ({...a, title: e.target.value}))} autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Category</label>
                  <select className="select" value={newArticle.category} onChange={e => setNewArticle(a => ({...a, category: e.target.value}))}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Tags (comma separated)</label>
                  <input className="input" placeholder="vpn, cisco, network" value={newArticle.tags} onChange={e => setNewArticle(a => ({...a, tags: e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Content</label>
                <textarea className="input min-h-[200px] resize-y" placeholder="Write your article..." value={newArticle.content} onChange={e => setNewArticle(a => ({...a, content: e.target.value}))}/>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
              <button onClick={saveArticle} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Article'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

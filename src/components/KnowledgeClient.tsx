'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { name: 'All', icon: '🔍' },
  { name: 'Networking', icon: '🌐' },
  { name: 'Security', icon: '🔐' },
  { name: 'Cloud', icon: '☁️' },
  { name: 'Server & VM', icon: '🖥️' },
  { name: 'Project Management', icon: '📋' },
  { name: 'Office Move', icon: '🏢' },
  { name: 'Migration', icon: '🚀' },
  { name: 'Runbooks', icon: '📖' },
  { name: 'Wireless', icon: '📡' },
  { name: 'Storage', icon: '💾' },
  { name: 'General', icon: '💡' },
]

const SUGGESTED_TOPICS = [
  'How to configure BGP routing',
  'SDWAN deployment guide',
  'Zero Trust Network Architecture',
  'Office 365 migration steps',
  'Cisco switch VLAN setup',
  'Azure Virtual Network setup',
  'Windows Server 2022 hardening',
  'Disaster Recovery planning',
  'Network segmentation best practices',
  'AWS EC2 instance setup',
  'Firewall policy best practices',
  'Active Directory setup guide',
  'VMware vSphere cluster setup',
  'Office move IT checklist',
  'SQL Server migration to Azure',
  'WiFi 6 deployment guide',
  'SAN storage configuration',
  'DevOps pipeline setup',
  'IT Change Management process',
  'Network monitoring with SNMP',
]

const STATIC_ARTICLES = [
  { id: 's1', title: 'How to Configure a Router', category: 'Networking', tags: ['router','cisco','networking'], is_ai_generated: false, created_at: new Date().toISOString(),
    content: `OVERVIEW\nA router connects multiple networks and directs traffic. This guide covers enterprise router configuration.\n\nSTEP-BY-STEP GUIDE\n1. Connect via console cable or SSH\n2. Enter privileged EXEC: enable\n3. Global config: configure terminal\n4. Set hostname: hostname ROUTER-01\n5. Configure interface:\n   interface GigabitEthernet0/0\n   ip address 192.168.1.1 255.255.255.0\n   no shutdown\n6. Default route: ip route 0.0.0.0 0.0.0.0 [ISP-IP]\n7. Enable SSH: crypto key generate rsa modulus 2048\n8. Save: write memory\n\nBEST PRACTICES\n- Use strong passwords on console and VTY lines\n- Enable logging to syslog server\n- Disable unused interfaces\n- Use ACLs to restrict management access\n- Document all changes\n\nTROUBLESHOOTING\n- No connectivity: show ip interface brief\n- Routing issues: show ip route\n- SSH not working: verify crypto keys generated` },
  { id: 's2', title: 'How to Configure Network Switches', category: 'Networking', tags: ['switch','vlan','cisco'], is_ai_generated: false, created_at: new Date().toISOString(),
    content: `OVERVIEW\nManaged switches control Layer 2 traffic. This guide covers VLAN, trunking, and port security.\n\nSTEP-BY-STEP GUIDE\n1. Access switch console/SSH\n2. Create VLANs:\n   vlan 10 / name USERS\n   vlan 20 / name SERVERS\n3. Configure access port:\n   interface Fa0/1\n   switchport mode access\n   switchport access vlan 10\n4. Configure trunk:\n   interface Gi0/1\n   switchport mode trunk\n   switchport trunk allowed vlan 10,20\n5. Enable Rapid STP: spanning-tree mode rapid-pvst\n\nBEST PRACTICES\n- Disable unused ports in dead VLAN\n- Enable BPDU Guard on access ports\n- Segment VLANs for security\n- Document VLAN assignments\n\nTROUBLESHOOTING\n- VLAN not passing: check trunk config\n- Port err-disabled: check port security logs` },
  { id: 's3', title: 'What is SD-WAN', category: 'Networking', tags: ['sdwan','wan','cloud'], is_ai_generated: false, created_at: new Date().toISOString(),
    content: `OVERVIEW\nSD-WAN is a virtual WAN architecture leveraging any transport (MPLS, broadband, 4G/5G) with centralised management.\n\nKEY CONCEPTS\n- Centralised control plane\n- Application-aware routing\n- Multiple transport links\n- Zero-touch provisioning\n\nSTEP-BY-STEP DEPLOYMENT\n1. Plan topology (hub-and-spoke or mesh)\n2. Choose vendor (Cisco Viptela, VMware VeloCloud, Fortinet)\n3. Deploy controller/orchestrator\n4. Install edge devices at each site\n5. Configure WAN links and policies\n6. Define application routing policies\n7. Test failover between links\n\nBEST PRACTICES\n- Start with non-critical sites\n- Test failover thoroughly\n- Monitor link quality metrics\n- Define clear QoS policies\n\nTROUBLESHOOTING\n- High latency: check link quality\n- Site not connecting: verify underlay` },
  { id: 's4', title: 'Office Move IT Checklist', category: 'Office Move', tags: ['office-move','checklist'], is_ai_generated: false, created_at: new Date().toISOString(),
    content: `OVERVIEW\nIT office moves require careful planning. This checklist ensures nothing is missed.\n\n12 WEEKS BEFORE\n- Audit all IT equipment\n- Plan new network topology\n- Order network equipment\n- Engage ISP for new circuits\n\n8 WEEKS BEFORE\n- Install network infrastructure at new site\n- Configure switches, routers, APs\n- Test internet connectivity\n- Set up VoIP system\n\n4 WEEKS BEFORE\n- Label all equipment\n- Back up all critical data\n- Test AV equipment\n- Communicate plan to staff\n\nMOVE WEEKEND\n- Shut down servers in sequence\n- Disconnect and label cables\n- Move equipment safely\n- Test all systems before staff arrive\n\nPOST-MOVE\n- Resolve outstanding issues\n- Update asset register\n- Update network documentation` },
  { id: 's5', title: 'How to Migrate SQL Server to Azure', category: 'Migration', tags: ['sql','azure','migration'], is_ai_generated: false, created_at: new Date().toISOString(),
    content: `OVERVIEW\nMigrating SQL Server to Azure requires careful planning to minimise downtime and ensure data integrity.\n\nTARGET OPTIONS\n1. Azure SQL Database (PaaS - fully managed)\n2. Azure SQL Managed Instance (near-full compatibility)\n3. SQL Server on Azure VM (IaaS - full control)\n\nPRE-MIGRATION\n1. Run Data Migration Assistant (DMA)\n2. Identify deprecated features\n3. Assess database sizes\n4. Map application dependencies\n5. Define RTO/RPO\n\nMIGRATION STEPS\n1. Take full backup\n2. Restore to Azure\n3. Set up continuous replication via DMS\n4. Validate data integrity\n5. Test application connections\n6. Schedule cutover window\n\nPOST-MIGRATION\n- Monitor query performance\n- Rebuild indexes\n- Configure automated backups\n- Set up geo-replication\n- Decommission on-premise server` },
  { id: 's6', title: 'How to Build a Server VM', category: 'Server & VM', tags: ['vm','vmware','virtualisation'], is_ai_generated: false, created_at: new Date().toISOString(),
    content: `OVERVIEW\nVirtual machines allow multiple server instances on a single physical host using VMware vSphere/ESXi.\n\nPRE-REQUISITES\n- VMware ESXi host configured\n- vCenter Server\n- OS ISO image\n- Storage datastore\n- Network portgroup\n\nSTEP-BY-STEP BUILD\n1. Log in to vCenter\n2. New Virtual Machine wizard\n3. Name VM: SRV-APP-01\n4. Select compute resource\n5. Select datastore\n6. Configure hardware:\n   - CPU: 2-4 vCPUs\n   - RAM: 8-16 GB\n   - Disk: 80 GB OS + data disks\n   - Network: correct VLAN portgroup\n7. Mount ISO and install OS\n8. Install VMware Tools\n9. Configure IP, DNS, hostname\n10. Join Active Directory\n11. Take baseline snapshot\n\nPOST-BUILD CHECKLIST\n- Antivirus installed\n- Windows Updates applied\n- Monitoring agent installed\n- Backup configured` },
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
  const [aiTitle, setAiTitle] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [aiMode, setAiMode] = useState<'search' | 'scope'>('search')
  const [aiQuery, setAiQuery] = useState('')
  const [aiCategory, setAiCategory] = useState('Networking')
  const [savedToKB, setSavedToKB] = useState(false)
  const [localArticles, setLocalArticles] = useState(articles)
  const [newArticle, setNewArticle] = useState({ title: '', content: '', category: 'Networking', tags: '' })
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const allArticles = [...STATIC_ARTICLES, ...localArticles]

  const filtered = allArticles.filter(a => {
    const matchSearch = search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.content ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (a.tags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = category === 'All' || a.category === category
    return matchSearch && matchCat
  })

  // Live search suggestions
  useEffect(() => {
    if (search.length > 1) {
      const suggestions = SUGGESTED_TOPICS.filter(t =>
        t.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
      setSearchSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0 && filtered.length === 0)
    } else {
      setShowSuggestions(false)
    }
  }, [search, filtered.length])

  function downloadArticle(article: any) {
    const text = `${article.title}\n${'='.repeat(60)}\nCategory: ${article.category}\n\n${article.content}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function generateAI() {
    if (aiMode === 'scope' && !uploadedFile) return
    if (aiMode === 'search' && !aiQuery.trim()) return

    setGenerating(true)
    setAiResult('')
    setSavedToKB(false)

    try {
      let scopeText = ''
      if (aiMode === 'scope' && uploadedFile) {
        scopeText = await uploadedFile.text()
      }

      const response = await fetch('/api/ai-kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiMode === 'search' ? aiQuery : '',
          category: aiCategory,
          scopeDocument: scopeText,
          title: aiMode === 'scope' ? uploadedFile?.name : aiQuery,
          saveToKB: aiMode === 'search',
          userId,
        }),
      })

      const data = await response.json()
      setAiResult(data.content ?? 'Failed to generate.')
      setAiTitle(aiMode === 'search' ? aiQuery : (uploadedFile?.name ?? 'Project Plan'))

      if (data.saved) {
        setSavedToKB(true)
        // Add to local articles list
        setLocalArticles((prev: any[]) => [{
          id: data.articleId,
          title: aiQuery,
          content: data.content,
          category: aiCategory,
          tags: [aiCategory.toLowerCase(), 'ai-generated'],
          is_ai_generated: true,
          created_at: new Date().toISOString(),
        }, ...prev])
      }
    } catch (e) {
      setAiResult('Error connecting to AI. Please add ANTHROPIC_API_KEY to Vercel environment variables.')
    }
    setGenerating(false)
  }

  function downloadAIResult() {
    const blob = new Blob([`${aiTitle}\n${'='.repeat(60)}\n\n${aiResult}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${aiTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveManualArticle() {
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
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
            placeholder="Search anything: BGP, SDWAN, office move, Azure migration, firewall..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim() && filtered.length === 0) {
                setAiQuery(search)
                setShowAI(true)
                setShowSuggestions(false)
              }
            }}/>
          {search && (
            <button onClick={() => { setSearch(''); setShowSuggestions(false) }} className="text-muted hover:text-text">✕</button>
          )}
          {search && filtered.length === 0 && (
            <button onClick={() => { setAiQuery(search); setShowAI(true); setShowSuggestions(false) }}
              className="btn-primary text-xs px-3 py-1.5 shrink-0 whitespace-nowrap">
              Generate with AI
            </button>
          )}
        </div>

        {/* Search suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-20 overflow-hidden">
            <p className="px-4 py-2 text-xs text-muted font-mono-code border-b border-border">Suggested topics</p>
            {searchSuggestions.map(s => (
              <button key={s} onClick={() => { setSearch(s); setShowSuggestions(false) }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface2 transition-colors flex items-center gap-2">
                <span className="text-accent text-xs">→</span> {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No results — prompt AI */}
      {search && filtered.length === 0 && (
        <div className="card border-accent/30 bg-accent/5 text-center py-10">
          <p className="text-lg mb-1">No articles found for <span className="text-accent font-semibold">"{search}"</span></p>
          <p className="text-muted text-sm mb-4">Let AI generate a professional IT article on this topic and save it to your knowledge base</p>
          <button onClick={() => { setAiQuery(search); setAiMode('search'); setShowAI(true) }}
            className="btn-primary px-6 py-2.5">
            Generate AI Article for "{search}"
          </button>
        </div>
      )}

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-52 shrink-0 space-y-3">
          <div className="card p-3">
            <p className="font-mono-code text-xs text-muted uppercase tracking-widest mb-2 px-1">Categories</p>
            {CATEGORIES.map(cat => {
              const count = cat.name === 'All' ? allArticles.length : allArticles.filter((a: any) => a.category === cat.name).length
              return (
                <button key={cat.name} onClick={() => setCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors flex items-center gap-2 ${
                    category === cat.name ? 'bg-accent/10 text-accent font-semibold' : 'text-muted hover:text-text hover:bg-surface2'
                  }`}>
                  <span>{cat.icon}</span>
                  <span className="flex-1">{cat.name}</span>
                  <span className="text-xs opacity-50">{count}</span>
                </button>
              )
            })}
          </div>

          {/* AI Actions */}
          <div className="card p-3 space-y-2">
            <p className="font-mono-code text-xs text-muted uppercase tracking-widest mb-2 px-1">AI Tools</p>
            <button onClick={() => { setAiMode('search'); setShowAI(true) }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-semibold">
              Ask AI Anything
            </button>
            <button onClick={() => { setAiMode('scope'); setShowAI(true) }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-accent2/10 text-purple-300 hover:bg-accent2/20 transition-colors font-semibold">
              Upload Scope Doc
            </button>
            <button onClick={() => setShowAdd(true)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-surface2 transition-colors text-muted">
              + Write Article
            </button>
          </div>
        </div>

        {/* Articles grid */}
        <div className="flex-1 space-y-3">
          {/* Stats bar */}
          <div className="flex items-center justify-between text-xs text-muted font-mono-code">
            <span>{filtered.length} article{filtered.length !== 1 ? 's' : ''} {category !== 'All' ? `in ${category}` : ''}</span>
            <span>{allArticles.filter((a: any) => a.is_ai_generated).length} AI-generated</span>
          </div>

          {filtered.length > 0 && filtered.map((article: any) => (
            <div key={article.id}
              className="card hover:border-accent/40 cursor-pointer transition-all hover:-translate-y-0.5 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="font-syne font-bold group-hover:text-accent transition-colors truncate"
                    onClick={() => setShowView(article)}>
                    {article.title}
                  </h3>
                  {article.is_ai_generated && (
                    <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono-code shrink-0">AI</span>
                  )}
                </div>
                <span className="text-xs bg-accent2/10 text-purple-300 px-2 py-1 rounded-lg font-mono-code ml-3 shrink-0">
                  {article.category}
                </span>
              </div>
              <p className="text-sm text-muted mb-3 line-clamp-2" onClick={() => setShowView(article)}>
                {(article.content ?? '').replace(/\n/g, ' ').slice(0, 180)}...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {(article.tags ?? []).slice(0, 4).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-surface2 rounded text-xs text-muted font-mono-code">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-3 ml-3 shrink-0">
                  <button onClick={() => setShowView(article)} className="text-xs text-accent hover:underline font-mono-code">Read</button>
                  <button onClick={() => downloadArticle(article)} className="text-xs text-accent3 hover:underline font-mono-code">Download</button>
                </div>
              </div>
            </div>
          ))}

          {/* Suggested topics when empty */}
          {!search && filtered.length <= 6 && (
            <div className="card border-dashed">
              <p className="font-syne font-bold mb-3 text-sm">Popular IT Topics — Click to Generate</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.slice(0, 12).map(topic => (
                  <button key={topic}
                    onClick={() => { setAiQuery(topic); setAiMode('search'); setShowAI(true) }}
                    className="text-xs px-3 py-1.5 bg-surface2 hover:bg-accent/10 hover:text-accent border border-border hover:border-accent/30 rounded-lg transition-all font-mono-code">
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Read Article Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowView(null)}>
          <div className="card w-full max-w-3xl max-h-[88vh] flex flex-col" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-8 pb-4 border-b border-border shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-accent2/10 text-purple-300 px-2 py-1 rounded-lg font-mono-code">{showView.category}</span>
                  {showView.is_ai_generated && <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-lg font-mono-code">AI Generated</span>}
                </div>
                <h2 className="font-syne font-black text-2xl mt-1">{showView.title}</h2>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button onClick={() => downloadArticle(showView)} className="btn-ghost text-xs px-3 py-1.5">Download</button>
                <button onClick={() => setShowView(null)} className="text-muted hover:text-text text-xl px-2">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto p-8 pt-5">
              <pre className="text-sm text-text leading-relaxed whitespace-pre-wrap font-sans">{showView.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {showAI && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-3xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-5 border-b border-border shrink-0">
              <div>
                <h3 className="font-syne font-black text-xl">AI Knowledge Generator</h3>
                <p className="text-muted text-sm mt-1">Generate professional IT documentation instantly</p>
              </div>
              <button onClick={() => { setShowAI(false); setAiResult(''); setUploadedFile(null); setSavedToKB(false) }}
                className="text-muted hover:text-text text-xl">✕</button>
            </div>

            <div className="overflow-y-auto p-8 pt-5 space-y-5 flex-1">
              {/* Mode tabs */}
              <div className="flex gap-2 p-1 bg-surface2 rounded-xl">
                <button onClick={() => setAiMode('search')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${aiMode === 'search' ? 'bg-accent text-black' : 'text-muted hover:text-text'}`}>
                  Ask About Any IT Topic
                </button>
                <button onClick={() => setAiMode('scope')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${aiMode === 'scope' ? 'bg-accent2 text-white' : 'text-muted hover:text-text'}`}>
                  Upload Scope Document
                </button>
              </div>

              {aiMode === 'search' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-2">What do you want to know?</label>
                    <input className="input text-base" placeholder="e.g. How to configure BGP between two Cisco routers"
                      value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && generateAI()}
                      autoFocus/>
                  </div>
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-2">Category</label>
                    <select className="select" value={aiCategory} onChange={e => setAiCategory(e.target.value)}>
                      {CATEGORIES.filter(c => c.name !== 'All').map(c => <option key={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <p className="text-xs text-muted">Article will be automatically saved to your Knowledge Base for future searches.</p>

                  {/* Quick suggestions */}
                  <div>
                    <p className="text-xs text-muted mb-2">Quick topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_TOPICS.slice(0, 8).map(t => (
                        <button key={t} onClick={() => setAiQuery(t)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-mono-code ${aiQuery === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-accent/50'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-syne font-semibold text-muted mb-2">Upload Project Scope Document</label>
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploadedFile ? 'border-accent3 bg-accent3/5' : 'border-border hover:border-accent/50'}`}>
                      {uploadedFile ? (
                        <div>
                          <p className="text-accent3 font-semibold">{uploadedFile.name}</p>
                          <p className="text-muted text-xs mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                          <button onClick={() => setUploadedFile(null)} className="text-xs text-danger hover:underline mt-2 block mx-auto">Remove</button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-muted text-sm mb-2">Drop your scope document here</p>
                          <p className="text-xs text-muted mb-4">Supports .txt, .pdf, .docx — Network scope, office move plan, SDWAN brief etc.</p>
                          <label htmlFor="scope-upload" className="btn-primary text-sm px-4 py-2 cursor-pointer">Browse Files</label>
                          <input type="file" accept=".txt,.pdf,.docx" className="hidden" id="scope-upload"
                            onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}/>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted">AI will generate a complete project plan with phases, steps, risks, and success criteria.</p>
                </div>
              )}

              <button onClick={generateAI}
                disabled={generating || (aiMode === 'search' ? !aiQuery.trim() : !uploadedFile)}
                className="btn-primary w-full py-3 text-base justify-center disabled:opacity-40">
                {generating ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                    Generating... this may take 10-20 seconds
                  </span>
                ) : aiMode === 'search' ? 'Generate IT Article' : 'Generate Project Plan'}
              </button>

              {/* AI Result */}
              {aiResult && (
                <div className="border border-accent3/30 rounded-xl bg-surface overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent3/5">
                    <div className="flex items-center gap-2">
                      <span className="text-accent3 font-syne font-bold text-sm">{aiTitle}</span>
                      {savedToKB && <span className="text-xs bg-accent3/10 text-accent3 px-2 py-0.5 rounded font-mono-code">Saved to KB</span>}
                    </div>
                    <button onClick={downloadAIResult} className="btn-ghost text-xs px-3 py-1.5">Download</button>
                  </div>
                  <div className="p-5 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-text leading-relaxed whitespace-pre-wrap font-sans">{aiResult}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-8">
            <h3 className="font-syne font-black text-xl mb-6">Write New Article</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Title</label>
                <input className="input" placeholder="Article title" value={newArticle.title} onChange={e => setNewArticle(a => ({...a, title: e.target.value}))} autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Category</label>
                  <select className="select" value={newArticle.category} onChange={e => setNewArticle(a => ({...a, category: e.target.value}))}>
                    {CATEGORIES.filter(c => c.name !== 'All').map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Tags (comma separated)</label>
                  <input className="input" placeholder="cisco, routing, layer3" value={newArticle.tags} onChange={e => setNewArticle(a => ({...a, tags: e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Content</label>
                <textarea className="input min-h-[200px] resize-y" placeholder="Write your article..." value={newArticle.content} onChange={e => setNewArticle(a => ({...a, content: e.target.value}))}/>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
              <button onClick={saveManualArticle} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Article'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

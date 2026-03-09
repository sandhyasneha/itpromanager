'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────
interface NetworkNode {
  id: string
  type: 'router' | 'switch' | 'firewall' | 'server' | 'cloud' | 'pc' | 'ap' | 'load_balancer' | 'internet'
  label: string
  ip?: string
  location?: string
  x: number
  y: number
  isNew?: boolean
}

interface NetworkLink {
  id: string
  from: string
  to: string
  label?: string
  type: 'ethernet' | 'fiber' | 'wireless' | 'wan'
}

interface Diagram {
  nodes: NetworkNode[]
  links: NetworkLink[]
  title: string
  description: string
}

// ── Device icons ─────────────────────────────────────────────────
const DEVICE_ICONS: Record<string, string> = {
  router:        '🔀',
  switch:        '🔲',
  firewall:      '🛡️',
  server:        '🖥️',
  cloud:         '☁️',
  pc:            '💻',
  ap:            '📡',
  load_balancer: '⚖️',
  internet:      '🌐',
}

const DEVICE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  router:        { bg: '#00d4ff15', border: '#00d4ff60', text: '#00d4ff' },
  switch:        { bg: '#7c3aed15', border: '#7c3aed60', text: '#a78bfa' },
  firewall:      { bg: '#ef444415', border: '#ef444460', text: '#f87171' },
  server:        { bg: '#22d3a515', border: '#22d3a560', text: '#22d3a5' },
  cloud:         { bg: '#06b6d415', border: '#06b6d460', text: '#22d3ee' },
  pc:            { bg: '#f59e0b15', border: '#f59e0b60', text: '#fbbf24' },
  ap:            { bg: '#10b98115', border: '#10b98160', text: '#34d399' },
  load_balancer: { bg: '#8b5cf615', border: '#8b5cf660', text: '#a78bfa' },
  internet:      { bg: '#6b728015', border: '#6b728060', text: '#9ca3af' },
}

const LINK_COLORS: Record<string, string> = {
  ethernet: '#00d4ff80',
  fiber:    '#22d3a580',
  wireless: '#f59e0b80',
  wan:      '#ef444480',
}

// ── Prompt builder ───────────────────────────────────────────────
const PROMPT_FIELDS = [
  { key: 'change_type',    label: 'Change Type',       placeholder: 'e.g. Add new switch, Replace router, New VLAN' },
  { key: 'location',       label: 'Location / Site',   placeholder: 'e.g. Singapore HQ, Floor 3 Server Room' },
  { key: 'new_device',     label: 'New Device',        placeholder: 'e.g. Cisco Catalyst 9300, Palo Alto PA-220' },
  { key: 'new_ip',         label: 'New IP / Subnet',   placeholder: 'e.g. 192.168.10.0/24, 10.0.5.50' },
  { key: 'existing_devices', label: 'Existing Devices', placeholder: 'e.g. Core router 10.0.0.1, Firewall 10.0.0.254' },
  { key: 'connections',    label: 'Connections',       placeholder: 'e.g. Connect to core switch via fiber uplink' },
  { key: 'vlan',           label: 'VLAN / Segment',    placeholder: 'e.g. VLAN 100 - Management, VLAN 200 - Users' },
  { key: 'notes',          label: 'Additional Notes',  placeholder: 'e.g. Redundant uplink required, HA pair' },
]

// ── Main component ───────────────────────────────────────────────
export default function NetworkDiagramPage() {
  const [mode, setMode]             = useState<'prompt' | 'diagram'>('prompt')
  const [promptFields, setPromptFields] = useState<Record<string, string>>({})
  const [freeText, setFreeText]     = useState('')
  const [generating, setGenerating] = useState(false)
  const [diagram, setDiagram]       = useState<Diagram | null>(null)
  const [error, setError]           = useState('')
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [dragging, setDragging]     = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [editingNode, setEditingNode] = useState<NetworkNode | null>(null)
  const [addingNode, setAddingNode] = useState(false)
  const [newNodeForm, setNewNodeForm] = useState({ type: 'switch', label: '', ip: '', location: '' })
  const [zoom, setZoom]             = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)

  const setField = (k: string, v: string) => setPromptFields(f => ({ ...f, [k]: v }))

  // ── Generate diagram via Claude API ─────────────────────────
  async function generateDiagram() {
    setGenerating(true); setError('')

    try {
      const res = await fetch('/api/generate-network-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freeText, promptFields }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDiagram(data.diagram)
      setMode('diagram')
    } catch (e: any) {
      setError('Failed to generate diagram. Please try again.')
    }
    setGenerating(false)
  }

  // ── Drag nodes ───────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent, nodeId: string) {
    e.preventDefault()
    const node = diagram?.nodes.find(n => n.id === nodeId)
    if (!node || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setDragging(nodeId)
    setDragOffset({ x: e.clientX / zoom - rect.left / zoom - node.x, y: e.clientY / zoom - rect.top / zoom - node.y })
    setSelectedNode(node)
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !diagram || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(60, Math.min(740, e.clientX / zoom - rect.left / zoom - dragOffset.x))
    const y = Math.max(40, Math.min(540, e.clientY / zoom - rect.top / zoom - dragOffset.y))
    setDiagram(d => d ? { ...d, nodes: d.nodes.map(n => n.id === dragging ? { ...n, x, y } : n) } : d)
  }, [dragging, dragOffset, zoom])

  const onMouseUp = useCallback(() => setDragging(null), [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [onMouseMove, onMouseUp])

  // ── Save node edit ───────────────────────────────────────────
  function saveNodeEdit() {
    if (!editingNode || !diagram) return
    setDiagram(d => d ? { ...d, nodes: d.nodes.map(n => n.id === editingNode.id ? editingNode : n) } : d)
    setEditingNode(null)
    setSelectedNode(editingNode)
  }

  function deleteNode(id: string) {
    setDiagram(d => d ? {
      ...d,
      nodes: d.nodes.filter(n => n.id !== id),
      links: d.links.filter(l => l.from !== id && l.to !== id),
    } : d)
    setSelectedNode(null)
    setEditingNode(null)
  }

  function addNode() {
    if (!diagram || !newNodeForm.label) return
    const newNode: NetworkNode = {
      id: `n${Date.now()}`,
      type: newNodeForm.type as NetworkNode['type'],
      label: newNodeForm.label,
      ip: newNodeForm.ip || undefined,
      location: newNodeForm.location || undefined,
      x: 300 + Math.random() * 200,
      y: 300 + Math.random() * 100,
      isNew: true,
    }
    setDiagram(d => d ? { ...d, nodes: [...d.nodes, newNode] } : d)
    setNewNodeForm({ type: 'switch', label: '', ip: '', location: '' })
    setAddingNode(false)
  }

  // ── SVG link path ────────────────────────────────────────────
  function getLinkPath(link: NetworkLink) {
    if (!diagram) return ''
    const from = diagram.nodes.find(n => n.id === link.from)
    const to   = diagram.nodes.find(n => n.id === link.to)
    if (!from || !to) return ''
    const mx = (from.x + to.x) / 2
    const my = (from.y + to.y) / 2
    return `M ${from.x} ${from.y} Q ${mx} ${my - 20} ${to.x} ${to.y}`
  }

  function getLinkMidpoint(link: NetworkLink) {
    if (!diagram) return { x: 0, y: 0 }
    const from = diagram.nodes.find(n => n.id === link.from)
    const to   = diagram.nodes.find(n => n.id === link.to)
    if (!from || !to) return { x: 0, y: 0 }
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 15 }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono-code text-xs text-accent uppercase tracking-widest mb-1">// AI-Powered</p>
          <h1 className="font-syne font-black text-3xl">Network Diagram Generator</h1>
          <p className="text-muted text-sm mt-1">Describe your network change — AI generates an editable diagram instantly.</p>
        </div>
        {mode === 'diagram' && (
          <div className="flex gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="btn-ghost text-sm px-3 py-2">−</button>
            <span className="text-xs text-muted self-center font-mono-code">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="btn-ghost text-sm px-3 py-2">+</button>
            <button onClick={() => { setMode('prompt'); setSelectedNode(null) }} className="btn-ghost text-sm px-4 py-2">← Edit Prompt</button>
            <button onClick={() => setAddingNode(true)} className="btn-primary text-sm px-4 py-2">+ Add Device</button>
          </div>
        )}
      </div>

      {mode === 'prompt' ? (
        /* ── PROMPT MODE ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — structured fields */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <p className="font-syne font-bold text-sm mb-4 text-accent">📝 Describe Your Network Change</p>
              <div className="mb-4">
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Free-text description (optional)</label>
                <textarea className="input resize-none h-20 text-sm w-full"
                  placeholder="e.g. I want to install a new Cisco Catalyst 9300 switch on Floor 3 of Singapore HQ. The existing core router is at 10.0.0.1 and I need to connect the new switch via a 10G fiber uplink on VLAN 100..."
                  value={freeText} onChange={e => setFreeText(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PROMPT_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-syne font-semibold text-muted mb-1.5">{f.label}</label>
                    <input className="input text-sm w-full" placeholder={f.placeholder}
                      value={promptFields[f.key] ?? ''}
                      onChange={e => setField(f.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">{error}</div>
            )}

            <button onClick={generateDiagram} disabled={generating || (!freeText && !Object.values(promptFields).some(v => v))}
              className="btn-primary w-full py-4 text-base disabled:opacity-40">
              {generating
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>Generating diagram…</span>
                : '🤖 Generate Network Diagram →'}
            </button>
          </div>

          {/* Right — tips + examples */}
          <div className="space-y-4">
            <div className="card p-5">
              <p className="font-syne font-bold text-sm mb-3 text-accent3">💡 Tips for best results</p>
              <div className="space-y-2.5 text-xs text-muted">
                {[
                  'Mention device model and vendor (e.g. Cisco Catalyst 9300)',
                  'Include existing IP ranges so AI places new devices correctly',
                  'Specify the connection type — fiber, copper, wireless',
                  'Name the location (floor, building, data centre)',
                  'Mention VLANs if network segmentation is involved',
                  'List existing devices the new one connects to',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-accent mt-0.5 shrink-0">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <p className="font-syne font-bold text-sm mb-3 text-accent2">📋 Example scenarios</p>
              <div className="space-y-2">
                {[
                  'Add access switch to Floor 3, connect to distribution switch via fiber',
                  'Install Palo Alto firewall between internet and core router',
                  'Add Wi-Fi access points across office, connect to existing switch',
                  'New server in DMZ, connected to firewall on VLAN 50',
                ].map((ex, i) => (
                  <button key={i} onClick={() => setFreeText(ex)}
                    className="w-full text-left text-xs text-muted bg-surface2 border border-border rounded-xl px-3 py-2 hover:border-accent/40 hover:text-text transition-all">
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <p className="font-syne font-bold text-sm mb-3">🔗 Link Types</p>
              <div className="space-y-2">
                {Object.entries(LINK_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-0.5 rounded-full" style={{ background: color.replace('80', '') }}/>
                    <span className="text-muted capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      ) : diagram ? (
        /* ── DIAGRAM MODE ── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3">
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-surface2 border-b border-border">
                <div>
                  <p className="font-syne font-bold text-sm">{diagram.title}</p>
                  <p className="text-xs text-muted">{diagram.description}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent3"/>New device</span>
                  <span>{diagram.nodes.length} devices · {diagram.links.length} links</span>
                </div>
              </div>

              <div className="overflow-auto bg-surface" style={{ height: '560px' }}>
                <div ref={canvasRef} style={{ width: 800, height: 580, transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'relative', cursor: dragging ? 'grabbing' : 'default' }}>
                  {/* SVG for links */}
                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <defs>
                      {Object.entries(LINK_COLORS).map(([type, color]) => (
                        <marker key={type} id={`arrow-${type}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L6,3 z" fill={color} />
                        </marker>
                      ))}
                    </defs>
                    {diagram.links.map(link => {
                      const mid = getLinkMidpoint(link)
                      return (
                        <g key={link.id}>
                          <path d={getLinkPath(link)} fill="none"
                            stroke={LINK_COLORS[link.type]} strokeWidth="2"
                            strokeDasharray={link.type === 'wireless' ? '6,4' : link.type === 'wan' ? '10,5' : 'none'}
                            markerEnd={`url(#arrow-${link.type})`} />
                          {link.label && (
                            <text x={mid.x} y={mid.y} textAnchor="middle" fontSize="9"
                              fill="#6b7280" fontFamily="monospace">
                              {link.label}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </svg>

                  {/* Nodes */}
                  {diagram.nodes.map(node => {
                    const colors = DEVICE_COLORS[node.type]
                    const isSelected = selectedNode?.id === node.id
                    return (
                      <div key={node.id}
                        onMouseDown={e => onMouseDown(e, node.id)}
                        onClick={() => setSelectedNode(node)}
                        style={{
                          position: 'absolute',
                          left: node.x - 48,
                          top: node.y - 40,
                          width: 96,
                          cursor: 'grab',
                          userSelect: 'none',
                        }}>
                        <div style={{
                          background: colors.bg,
                          border: `2px solid ${isSelected ? colors.text : node.isNew ? '#22d3a5' : colors.border}`,
                          borderRadius: 12,
                          padding: '8px 6px',
                          textAlign: 'center',
                          boxShadow: isSelected ? `0 0 0 3px ${colors.text}30` : node.isNew ? '0 0 0 3px #22d3a530' : 'none',
                          transition: 'all 0.15s',
                        }}>
                          {node.isNew && (
                            <div style={{ position: 'absolute', top: -8, right: -8, background: '#22d3a5', color: 'black', fontSize: 8, fontWeight: 'bold', padding: '2px 5px', borderRadius: 999 }}>NEW</div>
                          )}
                          <div style={{ fontSize: 22, lineHeight: 1 }}>{DEVICE_ICONS[node.type]}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: colors.text, marginTop: 4, lineHeight: 1.2, wordBreak: 'break-word' }}>{node.label}</div>
                          {node.ip && <div style={{ fontSize: 8, color: '#6b7280', marginTop: 2, fontFamily: 'monospace' }}>{node.ip}</div>}
                          {node.location && <div style={{ fontSize: 7, color: '#4b5563', marginTop: 1 }}>{node.location}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted">
              {Object.entries(DEVICE_ICONS).map(([type, icon]) => (
                <span key={type} className="flex items-center gap-1">
                  <span>{icon}</span>
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right panel — node details */}
          <div className="space-y-4">
            {selectedNode && !editingNode ? (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-syne font-bold text-sm">Device Details</p>
                  <button onClick={() => setSelectedNode(null)} className="text-muted hover:text-text text-lg">✕</button>
                </div>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{DEVICE_ICONS[selectedNode.type]}</div>
                  <p className="font-syne font-bold">{selectedNode.label}</p>
                  {selectedNode.isNew && <span className="text-[10px] bg-accent3/20 text-accent3 px-2 py-0.5 rounded-full font-semibold">NEW DEVICE</span>}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted">Type</span>
                    <span className="capitalize font-semibold">{selectedNode.type.replace('_',' ')}</span>
                  </div>
                  {selectedNode.ip && (
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted">IP Address</span>
                      <span className="font-mono-code text-accent">{selectedNode.ip}</span>
                    </div>
                  )}
                  {selectedNode.location && (
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted">Location</span>
                      <span>{selectedNode.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setEditingNode({ ...selectedNode })}
                    className="flex-1 btn-ghost text-xs py-2">✏️ Edit</button>
                  <button onClick={() => deleteNode(selectedNode.id)}
                    className="flex-1 text-xs py-2 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-colors">🗑️ Delete</button>
                </div>
              </div>
            ) : editingNode ? (
              <div className="card p-5">
                <p className="font-syne font-bold text-sm mb-4">Edit Device</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Label</label>
                    <input className="input text-sm w-full" value={editingNode.label}
                      onChange={e => setEditingNode(n => n ? { ...n, label: e.target.value } : n)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Type</label>
                    <select className="select text-sm w-full" value={editingNode.type}
                      onChange={e => setEditingNode(n => n ? { ...n, type: e.target.value as NetworkNode['type'] } : n)}>
                      {Object.keys(DEVICE_ICONS).map(t => <option key={t} value={t}>{DEVICE_ICONS[t]} {t.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">IP Address</label>
                    <input className="input text-sm w-full font-mono-code" placeholder="e.g. 10.0.1.1"
                      value={editingNode.ip ?? ''}
                      onChange={e => setEditingNode(n => n ? { ...n, ip: e.target.value } : n)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Location</label>
                    <input className="input text-sm w-full" placeholder="e.g. Server Room A"
                      value={editingNode.location ?? ''}
                      onChange={e => setEditingNode(n => n ? { ...n, location: e.target.value } : n)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveNodeEdit} className="flex-1 btn-primary text-xs py-2">Save</button>
                    <button onClick={() => setEditingNode(null)} className="flex-1 btn-ghost text-xs py-2">Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-5 text-center">
                <p className="text-3xl mb-2">👆</p>
                <p className="font-syne font-bold text-sm mb-1">Click a device</p>
                <p className="text-xs text-muted">Select any device to view details, edit or delete it. Drag devices to reposition them.</p>
              </div>
            )}

            {/* Device list */}
            <div className="card p-4">
              <p className="font-syne font-bold text-xs text-muted uppercase tracking-widest mb-3">All Devices ({diagram.nodes.length})</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {diagram.nodes.map(node => (
                  <button key={node.id} onClick={() => setSelectedNode(node)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all
                      ${selectedNode?.id === node.id ? 'bg-accent/10 border border-accent/30' : 'bg-surface2 border border-transparent hover:border-border'}`}>
                    <span>{DEVICE_ICONS[node.type]}</span>
                    <span className="flex-1 text-left font-semibold truncate">{node.label}</span>
                    {node.isNew && <span className="text-accent3 font-bold text-[9px]">NEW</span>}
                    {node.ip && <span className="text-muted font-mono-code text-[9px]">{node.ip}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Device Modal */}
      {addingNode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setAddingNode(false)}>
          <div className="card w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-syne font-black text-lg">Add Device</p>
              <button onClick={() => setAddingNode(false)} className="text-muted hover:text-text text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Device Type</label>
                <select className="select text-sm w-full" value={newNodeForm.type}
                  onChange={e => setNewNodeForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(DEVICE_ICONS).map(([t, icon]) => (
                    <option key={t} value={t}>{icon} {t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Label *</label>
                <input className="input text-sm w-full" placeholder="e.g. New Access Switch"
                  value={newNodeForm.label} onChange={e => setNewNodeForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">IP Address</label>
                <input className="input text-sm w-full font-mono-code" placeholder="e.g. 192.168.10.1"
                  value={newNodeForm.ip} onChange={e => setNewNodeForm(f => ({ ...f, ip: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Location</label>
                <input className="input text-sm w-full" placeholder="e.g. Floor 3, Server Room"
                  value={newNodeForm.location} onChange={e => setNewNodeForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <button onClick={addNode} disabled={!newNodeForm.label}
                className="btn-primary w-full py-3 text-sm disabled:opacity-40">
                Add to Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

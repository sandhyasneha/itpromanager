'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const STEPS = [
  { id:'welcome', title:'Welcome to NexPlan', subtitle:'AI-Powered IT Project Management', description:'The only PM tool built for IT teams — Network Engineers, IT PMs and Infrastructure Teams.', duration:3000, screen:'landing' },
  { id:'ai-generator', title:'AI Project Plan Generator', subtitle:'🤖 Describe it. AI builds it.', description:'Type your project in plain English. AI generates a complete task plan in under 10 seconds.', duration:5000, screen:'ai-gen' },
  { id:'kanban', title:'Kanban Board', subtitle:'📋 Visual task management', description:'Full project on one board. Drag tasks across Backlog to In Progress to Review to Done.', duration:4000, screen:'kanban' },
  { id:'gantt', title:'Gantt Timeline', subtitle:'📅 See the full picture', description:'Switch to Timeline for a Gantt chart with critical path highlighted in red.', duration:4000, screen:'gantt' },
  { id:'status', title:'AI Status Reports', subtitle:'📊 One click. Stakeholders informed.', description:'AI writes a professional status report with RAG, achievements, risks and next steps. Emails to stakeholders instantly.', duration:4500, screen:'status' },
  { id:'pcr', title:'PCR Workflow', subtitle:'📝 Manage scope changes professionally', description:'Create change requests, get AI-generated PCR documents in PRINCE2 format, track approvals and build your audit trail.', duration:4000, screen:'pcr' },
  { id:'mytasks', title:'Team Member My Tasks', subtitle:'✅ Team members see only their work', description:'Team members log in and see only tasks assigned to them. They update status — PM sees it instantly.', duration:4000, screen:'mytasks' },
  { id:'notify', title:'Smart Notifications', subtitle:'🔔 AI-written follow-up emails', description:'AI writes personalised follow-up emails for team members the day before tasks are due.', duration:4000, screen:'notify' },
  { id:'resource', title:'Resource Utilization', subtitle:'👥 Stop burnout before it happens', description:'Track team workload using 80/85% threshold model. See who is overallocated and rebalance instantly.', duration:4500, screen:'resource' },
  { id:'stakeholder', title:'Stakeholder Analysis', subtitle:'🤝 Know your audience', description:'Map every stakeholder by influence and interest. Capture communication preferences and track engagement so no one falls through the cracks.', duration:4500, screen:'stakeholder' },
  { id:'change_freeze', title:'Change Freeze', subtitle:'🧊 Lock critical periods', description:'Define freeze windows to protect go-lives and BAU periods. Block unapproved changes and auto-alert the team on any breach.', duration:4000, screen:'change_freeze' },
  { id:'budget', title:'Budget Tracker', subtitle:'💰 Stay on top of project spend', description:'Log costs against tasks, monitor budget vs actual in real time and get early warnings before you go over budget.', duration:4500, screen:'budget' },
  { id:'cta', title:'Ready to get started?', subtitle:'100% Free · No credit card · Sign in with Google', description:'Join IT PMs and Network Engineers already using NexPlan.', duration:5000, screen:'cta' },
]

function Screen({ id }: { id: string }) {
  const s = 'bg-surface2 border border-border rounded-xl p-2 text-[10px]'
  if (id === 'landing') return (
    <div className='h-full flex flex-col items-center justify-center gap-5 p-8 text-center'>
      <div className='font-syne font-black text-4xl'>Nex<span className='text-accent'>Plan</span></div>
      <p className='text-muted text-sm max-w-xs leading-relaxed'>AI-Powered IT Project Management for Network Engineers and IT Teams</p>
      <div className='grid grid-cols-3 gap-3 w-full max-w-sm'>
        {['🤖 AI Generator','📋 Kanban','📅 Gantt','🛡️ Risk Register','📊 Status Reports','👥 My Tasks'].map(f => (
          <div key={f} className='bg-surface2 border border-border rounded-xl p-2.5 text-[10px] text-muted font-semibold text-center'>{f}</div>
        ))}
      </div>
      <div className='text-xs text-accent3 bg-accent3/10 border border-accent3/30 rounded-full px-4 py-2'>100% Free · No credit card needed</div>
    </div>
  )
  if (id === 'ai-gen') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-accent uppercase tracking-widest'>🤖 AI Project Generator</p>
      <div className='bg-surface2 border border-accent/30 rounded-xl p-3'>
        <p className='text-[10px] text-muted mb-1'>Describe your project:</p>
        <p className='text-[10px] text-text font-mono-code leading-relaxed'>SDWAN deployment across 5 offices in Singapore, Malaysia and Indonesia. 3 month timeline, team of 4 engineers...</p>
      </div>
      <div className='flex items-center gap-2 text-xs text-accent'><span className='w-2 h-2 rounded-full bg-accent animate-pulse'/>Claude AI generating plan...</div>
      <div className='space-y-1.5 flex-1 overflow-hidden'>
        {[['Phase 1','Site survey and network assessment','high'],['Phase 1','Hardware procurement and staging','critical'],['Phase 2','SD-WAN controller configuration','critical'],['Phase 2','Branch CPE deployment Singapore','high'],['Phase 2','Branch CPE deployment Malaysia','high'],['Phase 3','Policy and QoS configuration','medium'],['Phase 3','User acceptance testing','high']].map(([ph,task,pri],i) => (
          <div key={i} className='flex items-center gap-2 p-2 bg-surface2 border border-border rounded-lg text-[10px]'>
            <span className='text-muted shrink-0 w-12'>{ph}</span>
            <span className='flex-1 font-medium truncate'>{task}</span>
            <span className={`shrink-0 px-1.5 py-0.5 rounded font-semibold ${pri==='critical'?'bg-danger/20 text-danger':pri==='high'?'bg-warn/20 text-warn':'bg-accent/20 text-accent'}`}>{pri}</span>
          </div>
        ))}
      </div>
    </div>
  )
  if (id === 'kanban') return (
    <div className='h-full flex flex-col gap-2 p-3'>
      <div className='flex items-center gap-2 mb-1'><span className='w-2 h-2 rounded-full bg-accent'/><p className='text-xs font-semibold'>SDWAN Rollout Singapore</p><span className='ml-auto text-[10px] text-muted'>5 tasks</span></div>
      <div className='grid grid-cols-4 gap-2 flex-1 overflow-hidden'>
        {[{col:'Backlog',tasks:[{t:'Firewall migration',p:'medium'},{t:'UAT',p:'high'}]},{col:'In Progress',tasks:[{t:'Configure BGP',p:'high'}]},{col:'Review',tasks:[{t:'SDWAN policy',p:'critical'}]},{col:'Done',tasks:[{t:'Monitoring setup',p:'medium'}]}].map(col => (
          <div key={col.col} className='bg-surface2 rounded-xl p-2 border border-border flex flex-col gap-1.5'>
            <p className='font-syne font-bold text-muted uppercase tracking-wider text-[9px] mb-1'>{col.col}</p>
            {col.tasks.map((t,i) => (
              <div key={i} className='p-2 rounded-lg border border-border bg-surface text-[9px]'>
                <p className='font-semibold leading-tight mb-1'>{t.t}</p>
                <span className={`px-1 py-0.5 rounded font-bold ${t.p==='critical'?'bg-danger/20 text-danger':t.p==='high'?'bg-warn/20 text-warn':'bg-surface2 text-muted'}`}>{t.p}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
  if (id === 'gantt') return (
    <div className='h-full flex flex-col gap-2 p-3'>
      <p className='text-xs font-syne font-bold text-accent uppercase tracking-widest'>📅 Gantt Timeline</p>
      <div className='flex gap-1 text-[9px] text-muted mb-1'>
        {['Mar 1','Mar 8','Mar 15','Mar 22','Mar 29'].map(d => <div key={d} className='flex-1 text-center border-l border-border pl-1'>{d}</div>)}
      </div>
      <div className='space-y-2 flex-1'>
        {[[0,10,'#00d4ff',false,'Network Assessment'],[8,18,'#7c3aed',false,'Hardware Procurement'],[20,14,'#ef4444',true,'Controller Config'],[26,10,'#ef4444',true,'Branch Deploy SG'],[30,10,'#f59e0b',false,'Branch Deploy MY'],[38,14,'#22d3a5',false,'UAT and Sign-off']].map(([s,d,c,cr,t],i) => (
          <div key={i} className='flex items-center gap-2'>
            <p className='text-[9px] text-muted w-28 shrink-0 truncate'>{cr&&<span className='text-danger mr-1'>⚠</span>}{t as string}</p>
            <div className='flex-1 relative h-5 bg-surface2 rounded overflow-hidden'>
              <div className='absolute h-full rounded' style={{left:`${(s as number)*1.9}%`,width:`${(d as number)*1.9}%`,background:c as string,opacity:0.85}}/>
            </div>
          </div>
        ))}
        <div className='flex items-center gap-3 text-[9px] mt-1'>
          <span className='flex items-center gap-1'><span className='w-2 h-2 rounded-sm bg-danger'/>Critical Path</span>
          <span className='flex items-center gap-1'><span className='w-2 h-2 rounded-sm bg-accent'/>Normal</span>
        </div>
      </div>
    </div>
  )
  if (id === 'status') return (
    <div className='h-full flex flex-col gap-3 p-4 overflow-hidden'>
      <p className='text-xs font-syne font-bold text-accent uppercase tracking-widest'>📊 AI Status Report</p>
      <div className='flex items-center gap-3'><div className='w-8 h-8 rounded-lg bg-warn/20 border border-warn/40 flex items-center justify-center'>🟡</div><div><p className='text-xs font-bold'>SDWAN Rollout Week 6</p><p className='text-[10px] text-warn'>Amber — Needs Attention</p></div><span className='ml-auto text-xs font-mono-code text-accent'>47%</span></div>
      <div className='space-y-2 flex-1 overflow-hidden'>
        {[{l:'✅ Achievements',t:'Network assessment complete. Hardware staged. Controller configured and tested.',c:'border-accent3/30 bg-accent3/5'},{l:'⚠️ Risks',t:'Branch deployment delayed 3 days due to customs clearance.',c:'border-warn/30 bg-warn/5'},{l:'📋 Next Steps',t:'Singapore branch by Mar 15. Malaysia Mar 18. UAT planning in progress.',c:'border-accent/30 bg-accent/5'}].map(s => (
          <div key={s.l} className={`p-2.5 rounded-xl border text-[10px] ${s.c}`}><p className='font-bold mb-1'>{s.l}</p><p className='text-muted leading-relaxed'>{s.t}</p></div>
        ))}
      </div>
      <div className='flex items-center gap-2 p-2 bg-surface2 rounded-xl border border-border text-[10px]'><span className='text-muted'>To:</span><span className='text-accent'>sponsor@company.com</span><button className='ml-auto bg-accent text-black px-2.5 py-1 rounded-lg font-bold'>Send →</button></div>
    </div>
  )
  if (id === 'pcr') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-accent uppercase tracking-widest'>📝 PCR Workflow</p>
      <div className='bg-surface2 border border-border rounded-xl p-3 space-y-2'>
        <div className='flex items-center justify-between'><p className='text-xs font-bold'>PCR-003: Add Indonesia Site</p><span className='text-[10px] px-2 py-0.5 bg-warn/10 text-warn border border-warn/30 rounded-full'>Pending</span></div>
        <p className='text-[10px] text-muted'>Scope change to include Jakarta. Additional 2 weeks and $15,000 budget impact.</p>
        <div className='grid grid-cols-3 gap-2 text-[10px]'>
          <div className='bg-surface rounded-lg p-2'><p className='text-muted'>Timeline</p><p className='font-bold text-warn'>+2 weeks</p></div>
          <div className='bg-surface rounded-lg p-2'><p className='text-muted'>Budget</p><p className='font-bold text-danger'>+$15,000</p></div>
          <div className='bg-surface rounded-lg p-2'><p className='text-muted'>Priority</p><p className='font-bold'>High</p></div>
        </div>
      </div>
      <div className='bg-accent/5 border border-accent/20 rounded-xl p-3 flex-1'>
        <p className='text-[10px] font-bold text-accent mb-2'>🤖 AI Generated PCR Document</p>
        <p className='text-[10px] text-muted leading-relaxed'>PROJECT CHANGE REQUEST — PCR-003&#10;Requested by: James Tan, IT PM&#10;&#10;1. Change Description: Extension of SDWAN rollout to Jakarta Indonesia...&#10;2. Business Justification: Jakarta processes 23% of regional transactions...&#10;3. Impact: Schedule +14 days, Budget +$15,000 USD...</p>
      </div>
      <div className='flex gap-2'>
        <button className='flex-1 text-[10px] py-2 bg-accent3/10 border border-accent3/30 text-accent3 rounded-xl font-bold'>✅ Approve</button>
        <button className='flex-1 text-[10px] py-2 bg-danger/10 border border-danger/30 text-danger rounded-xl font-bold'>❌ Reject</button>
      </div>
    </div>
  )
  if (id === 'mytasks') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-accent uppercase tracking-widest'>✅ My Tasks — Team Member View</p>
      <div className='flex items-center gap-2 p-2.5 bg-surface2 rounded-xl border border-border'>
        <div className='w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold'>JS</div>
        <div><p className='text-xs font-semibold'>John Smith</p><p className='text-[10px] text-muted'>Network Engineer · 3 active tasks</p></div>
      </div>
      <div className='grid grid-cols-3 gap-2 text-[10px]'>
        {[{l:'🚨 Overdue',n:1,c:'text-danger bg-danger/10 border-danger/30'},{l:'📅 Due Today',n:1,c:'text-warn bg-warn/10 border-warn/30'},{l:'⚡ Active',n:2,c:'text-accent bg-accent/10 border-accent/30'}].map(s => (
          <div key={s.l} className={`p-2 rounded-xl border text-center ${s.c}`}><p className='font-black text-xl'>{s.n}</p><p className='font-semibold'>{s.l}</p></div>
        ))}
      </div>
      <div className='space-y-2 flex-1'>
        {[{t:'Configure BGP on edge router',p:'SDWAN Rollout',d:'3 Mar',b:'bg-danger/10 text-danger border-danger/30',bl:'🚨 Overdue'},{t:'Firewall rule migration',p:'DC Migration',d:'5 Mar',b:'bg-warn/10 text-warn border-warn/30',bl:'📅 Due Today'},{t:'Network monitoring setup',p:'SDWAN Rollout',d:'10 Mar',b:'bg-accent/10 text-accent border-accent/30',bl:'⚡ Active'}].map((t,i) => (
          <div key={i} className='p-3 bg-surface2 rounded-xl border border-border text-[10px]'>
            <div className='flex items-start justify-between gap-2 mb-1.5'><p className='font-semibold leading-tight'>{t.t}</p><span className={`shrink-0 px-1.5 py-0.5 rounded-full border font-semibold ${t.b}`}>{t.bl}</span></div>
            <div className='flex items-center justify-between text-muted'><span>{t.p}</span><span>Due {t.d}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
  if (id === 'notify') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-accent uppercase tracking-widest'>🔔 Smart Notifications</p>
      <div className='space-y-2.5 flex-1'>
        {[{type:'Task Assignment',icon:'📧',c:'border-accent/30 bg-accent/5',to:'john.smith@company.com',sub:'New Task: Configure BGP on edge router',body:'Hi John, you have been assigned Configure BGP on edge router. Priority: High. Due: 15 March 2026.'},{type:'AI Follow-Up',icon:'🤖',c:'border-warn/30 bg-warn/5',to:'sarah.lee@company.com',sub:'⚠️ Task Due Tomorrow: SDWAN policy deployment',body:'Hi Sarah, your task SDWAN policy deployment is due tomorrow. The team is counting on this.'},{type:'Status Report',icon:'📊',c:'border-accent3/30 bg-accent3/5',to:'sponsor@company.com',sub:'📊 SDWAN Rollout — Week 6 Status Report',body:'Project: 🟡 Amber. 47% complete. Key achievements this week...'}].map(n => (
          <div key={n.type} className={`p-3 rounded-xl border ${n.c}`}>
            <div className='flex items-center gap-2 mb-1.5'><span>{n.icon}</span><p className='text-[10px] font-bold'>{n.type}</p><span className='ml-auto text-[9px] text-accent3 bg-accent3/10 border border-accent3/30 px-1.5 py-0.5 rounded-full'>Sent ✓</span></div>
            <p className='text-[9px] text-muted mb-0.5'>To: {n.to}</p>
            <p className='text-[10px] font-semibold mb-1'>{n.sub}</p>
            <p className='text-[9px] text-muted leading-relaxed'>{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
  if (id === 'resource') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-accent uppercase tracking-widest'>👥 Resource Utilization</p>
      <div className='grid grid-cols-3 gap-2 text-[10px]'>
        {[{l:'🔴 Overallocated',n:1,c:'text-danger bg-danger/10 border-danger/30'},{l:'🟡 At Risk',n:1,c:'text-warn bg-warn/10 border-warn/30'},{l:'🟢 Healthy',n:2,c:'text-accent3 bg-accent3/10 border-accent3/30'}].map(s => (
          <div key={s.l} className={`p-2 rounded-xl border text-center ${s.c}`}><p className='font-black text-2xl'>{s.n}</p><p className='font-semibold'>{s.l}</p></div>
        ))}
      </div>
      <div className='space-y-2 flex-1'>
        {[{n:'John Smith',a:38,av:40,p:95,s:'over'},{n:'Sarah Lee',a:33,av:40,p:82,s:'risk'},{n:'Mike Chen',a:24,av:40,p:60,s:'ok'},{n:'Priya Nair',a:16,av:40,p:40,s:'ok'}].map(r => {
          const col = r.s==='over'?'#ef4444':r.s==='risk'?'#f59e0b':'#22d3a5'
          return (
            <div key={r.n} className={`p-2.5 rounded-xl border ${r.s==='over'?'border-danger/30 bg-danger/5':r.s==='risk'?'border-warn/30 bg-warn/5':'border-border'}`}>
              <div className='flex items-center justify-between mb-1.5'>
                <div className='flex items-center gap-2'><div className='w-6 h-6 rounded-full bg-surface2 border border-border flex items-center justify-center text-[9px] font-bold'>{r.n.split(' ').map((x:string)=>x[0]).join('')}</div><p className='text-[10px] font-semibold'>{r.n}</p></div>
                <span className='text-[10px] font-mono-code font-black' style={{color:col}}>{r.p}%</span>
              </div>
              <div className='w-full h-3 bg-surface2 rounded-full overflow-hidden mb-1'><div className='h-full rounded-full' style={{width:`${Math.min(r.p,100)}%`,background:col}}/></div>
              <p className='text-[9px] text-muted'>{r.a}h / {r.av}h per week</p>
            </div>
          )
        })}
      </div>
    </div>
  )
  if (id === 'cta') return (
    <div className='h-full flex flex-col items-center justify-center gap-5 p-8 text-center'>
      <div className='font-syne font-black text-3xl'>Nex<span className='text-accent'>Plan</span></div>
      <p className='text-muted text-sm max-w-xs leading-relaxed'>Join IT PMs and Network Engineers managing projects with NexPlan.</p>
      <div className='flex flex-col gap-2 w-full max-w-xs'>
        {['🤖 AI Project Generator','📋 Kanban Board','📅 Gantt Timeline','📊 AI Status Reports','📝 PCR Workflow','👥 Resource Utilization','✅ Team My Tasks','🔔 Smart Notifications','🤝 Stakeholder Analysis','🧊 Change Freeze','💰 Budget Tracker'].map(f => (
          <div key={f} className='flex items-center gap-2 text-xs text-left'><span className='text-accent3'>✓</span><span className='text-muted'>{f}</span></div>
        ))}
      </div>
      <div className='text-accent3 text-sm font-bold'>All free. Forever. 🎉</div>
    </div>
  )
  if (id === 'stakeholder') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-warn uppercase tracking-widest'>🤝 Stakeholder Analysis</p>
      <div className='space-y-2 flex-1 overflow-hidden'>
        {[
          { name:'Sarah Chen', role:'Project Sponsor', influence:'High', interest:'High', status:'Engaged', color:'bg-accent3/20 text-accent3' },
          { name:'Mark Davies', role:'Network Lead', influence:'High', interest:'Medium', status:'Informed', color:'bg-accent/20 text-accent' },
          { name:'Ops Team', role:'End Users', influence:'Low', interest:'High', status:'Monitor', color:'bg-warn/20 text-warn' },
          { name:'IT Security', role:'Reviewer', influence:'Medium', interest:'Low', status:'Consult', color:'bg-accent2/20 text-accent2' },
        ].map((s,i) => (
          <div key={i} className='flex items-center gap-2 p-2.5 bg-surface2 border border-border rounded-xl text-[10px]'>
            <div className='w-6 h-6 rounded-full bg-surface flex items-center justify-center font-bold text-[9px] border border-border shrink-0'>{s.name[0]}</div>
            <div className='flex-1 min-w-0'>
              <p className='font-semibold truncate'>{s.name}</p>
              <p className='text-muted truncate'>{s.role}</p>
            </div>
            <span className='text-muted shrink-0'>⬆ {s.influence}</span>
            <span className={`shrink-0 px-1.5 py-0.5 rounded font-semibold ${s.color}`}>{s.status}</span>
          </div>
        ))}
      </div>
      <div className='p-2 bg-warn/5 border border-warn/20 rounded-xl text-[10px] text-muted'>✨ AI suggests: Schedule weekly update with Sarah Chen</div>
    </div>
  )
  if (id === 'change_freeze') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-danger uppercase tracking-widest'>🧊 Change Freeze</p>
      <div className='p-3 bg-danger/10 border border-danger/30 rounded-xl text-[10px]'>
        <p className='font-bold text-danger mb-1'>🔴 Active Freeze Window</p>
        <p className='text-muted'>Go-Live Freeze: Mar 10 – Mar 17, 2025</p>
        <p className='text-muted mt-0.5'>Reason: Production cutover — no changes permitted</p>
      </div>
      <div className='space-y-1.5 flex-1 overflow-hidden'>
        {[
          { task:'Update BGP config', user:'Mark D.', status:'Blocked', c:'bg-danger/20 text-danger' },
          { task:'Patch firewall rules', user:'Priya S.', status:'Blocked', c:'bg-danger/20 text-danger' },
          { task:'New VLAN request', user:'Tom K.', status:'Pending Approval', c:'bg-warn/20 text-warn' },
        ].map((r,i) => (
          <div key={i} className='flex items-center gap-2 p-2 bg-surface2 border border-border rounded-lg text-[10px]'>
            <span className='flex-1 font-medium truncate'>{r.task}</span>
            <span className='text-muted shrink-0'>{r.user}</span>
            <span className={`shrink-0 px-1.5 py-0.5 rounded font-semibold ${r.c}`}>{r.status}</span>
          </div>
        ))}
      </div>
      <div className='p-2 bg-surface2 border border-border rounded-xl text-[10px] text-muted'>🔔 3 team members notified of freeze breach attempt</div>
    </div>
  )
  if (id === 'budget') return (
    <div className='h-full flex flex-col gap-3 p-4'>
      <p className='text-xs font-syne font-bold text-accent3 uppercase tracking-widest'>💰 Budget Tracker</p>
      <div className='grid grid-cols-3 gap-2 text-center'>
        {[['Total Budget','$48,000','text-text'],['Spent','$31,200','text-warn'],['Remaining','$16,800','text-accent3']].map(([l,v,c]) => (
          <div key={l} className='bg-surface2 border border-border rounded-xl p-2'>
            <p className={`font-syne font-black text-sm ${c}`}>{v}</p>
            <p className='text-[9px] text-muted mt-0.5'>{l}</p>
          </div>
        ))}
      </div>
      <div className='bg-surface2 border border-border rounded-xl p-2.5'>
        <div className='flex justify-between text-[10px] mb-1'><span className='text-muted'>Burn rate</span><span className='text-warn font-bold'>65% used · Week 6 of 12</span></div>
        <div className='w-full h-2 bg-surface rounded-full overflow-hidden'><div className='h-full rounded-full bg-warn' style={{width:'65%'}}/></div>
      </div>
      <div className='space-y-1.5 flex-1 overflow-hidden'>
        {[['Hardware procurement','$18,000','$17,400'],['Engineer labour','$22,000','$11,200'],['Software licences','$5,000','$2,600'],['Contingency','$3,000','$0']].map(([cat,bud,spent],i) => (
          <div key={i} className='flex items-center gap-2 p-2 bg-surface2 border border-border rounded-lg text-[10px]'>
            <span className='flex-1 truncate text-muted'>{cat}</span>
            <span className='text-muted shrink-0'>Budget: {bud}</span>
            <span className='font-bold shrink-0 text-accent3'>Spent: {spent}</span>
          </div>
        ))}
      </div>
    </div>
  )
  return null
}

export default function DemoClient() {
  const [cur, setCur] = useState(0)
  const [pct, setPct] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<NodeJS.Timeout>()
  const step = STEPS[cur]

  useEffect(() => {
    if (paused) return
    const dur = step.duration
    const tick = 50
    let elapsed = 0
    timer.current = setInterval(() => {
      elapsed += tick
      setPct(Math.min((elapsed / dur) * 100, 100))
      if (elapsed >= dur) {
        clearInterval(timer.current)
        setCur(c => (c + 1) % STEPS.length)
        setPct(0)
      }
    }, tick)
    return () => clearInterval(timer.current)
  }, [cur, paused])

  function goTo(i: number) { setCur(i); setPct(0) }

  return (
    <div className='min-h-screen bg-bg text-text'>
      <div className='border-b border-border bg-surface'>
        <div className='max-w-6xl mx-auto px-6 py-4 flex items-center justify-between'>
          <Link href='/' className='font-syne font-black text-xl'>Nex<span className='text-accent'>Plan</span></Link>
          <div className='flex items-center gap-3'>
            <Link href='/docs' className='text-sm text-muted hover:text-text transition-colors'>How It Works</Link>
            <Link href='/login' className='btn-primary text-sm px-4 py-2'>Get Started Free →</Link>
          </div>
        </div>
      </div>
      <div className='max-w-6xl mx-auto px-6 py-12'>
        <div className='text-center mb-10'>
          <p className='font-mono-code text-xs text-accent uppercase tracking-widest mb-3'>// Interactive Demo</p>
          <h1 className='font-syne font-black text-4xl mb-3'>See NexPlan in Action</h1>
          <p className='text-muted max-w-xl mx-auto'>Watch how IT teams use NexPlan to plan, manage and deliver projects — from AI generation to stakeholder reports.</p>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-8 items-start'>
          <div className='lg:col-span-2 space-y-1'>
            {STEPS.map((s, i) => (
              <button key={s.id} onClick={() => goTo(i)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${cur===i?'bg-accent/10 border-accent/40 text-text':i<cur?'bg-surface2 border-border text-muted opacity-60':'bg-surface2 border-border text-muted hover:border-accent/20 hover:text-text'}`}>
                <div className='flex items-center gap-3'>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${cur===i?'bg-accent border-accent text-black':i<cur?'bg-accent3 border-accent3 text-black':'border-border'}`}>{i<cur?'✓':i+1}</div>
                  <div className='min-w-0'><p className='text-xs font-semibold truncate'>{s.title}</p><p className='text-[10px] text-muted truncate'>{s.subtitle}</p></div>
                </div>
                {cur===i&&<div className='mt-2 w-full h-1 bg-border rounded-full overflow-hidden'><div className='h-full bg-accent rounded-full transition-all duration-50' style={{width:`${pct}%`}}/></div>}
              </button>
            ))}
          </div>
          <div className='lg:col-span-3 sticky top-6'>
            <div className='bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl'>
              <div className='flex items-center gap-2 px-4 py-3 bg-surface2 border-b border-border'>
                <div className='flex gap-1.5'><div className='w-3 h-3 rounded-full bg-danger/60'/><div className='w-3 h-3 rounded-full bg-warn/60'/><div className='w-3 h-3 rounded-full bg-accent3/60'/></div>
                <div className='flex-1 bg-surface rounded-lg px-3 py-1 text-[10px] text-muted text-center'>nexplan.io/{step.screen}</div>
              </div>
              <div className='h-96 overflow-hidden'><Screen id={step.screen}/></div>
              <div className='px-5 py-4 border-t border-border bg-surface2'>
                <p className='font-syne font-bold text-sm mb-0.5'>{step.title}</p>
                <p className='text-xs text-muted leading-relaxed'>{step.description}</p>
              </div>
            </div>
            <div className='flex items-center justify-between mt-4'>
              <button onClick={()=>goTo(Math.max(0,cur-1))} disabled={cur===0} className='btn-ghost text-sm px-4 py-2 disabled:opacity-30'>← Prev</button>
              <button onClick={()=>setPaused(p=>!p)} className='text-xs text-muted hover:text-text px-3 py-1.5 bg-surface2 border border-border rounded-lg'>{paused?'▶ Resume':'⏸ Pause'}</button>
              <button onClick={()=>goTo(Math.min(STEPS.length-1,cur+1))} disabled={cur===STEPS.length-1} className='btn-ghost text-sm px-4 py-2 disabled:opacity-30'>Next →</button>
            </div>
            <div className='mt-6 p-5 bg-accent/5 border border-accent/20 rounded-2xl text-center'>
              <p className='font-syne font-bold mb-1'>Ready to try it yourself?</p>
              <p className='text-xs text-muted mb-3'>Free forever · No credit card · Sign in with Google</p>
              <Link href='/login' className='btn-primary px-6 py-2.5 text-sm'>Get Started Free →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
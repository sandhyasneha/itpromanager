/**
 * NexPlan — Bulk KB Article Generator
 * 
 * Usage:
 *   node scripts/generate-kb-articles.mjs
 * 
 * Requirements:
 *   Set these in your terminal before running:
 *   Windows:  set ANTHROPIC_API_KEY=sk-ant-xxxx
 *             set SUPABASE_URL=https://rcpwzbgkjrrnvjuzzkkr.supabase.co
 *             set SUPABASE_SERVICE_KEY=your-service-role-key
 * 
 *   Mac/Linux: export ANTHROPIC_API_KEY=sk-ant-xxxx
 *              export SUPABASE_URL=https://rcpwzbgkjrrnvjuzzkkr.supabase.co
 *              export SUPABASE_SERVICE_KEY=your-service-role-key
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rcpwzbgkjrrnvjuzzkkr.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

// ─── All 40 Articles to Generate ───────────────────────────────────────────

const ARTICLES = [
  // Server & Infrastructure
  { title: 'How to Build and Rack Mount a Server',                     category: 'Server & VM' },
  { title: 'How to Configure a Dell or HP Server from Scratch',        category: 'Server & VM' },
  { title: 'What is a Server Farm and How to Design One',              category: 'Server & VM' },
  { title: 'What is a Farm Switch and How to Configure It',            category: 'Server & VM' },
  { title: 'How to Set Up VMware vSphere Hypervisor',                  category: 'Server & VM' },
  { title: 'How to Set Up Microsoft Hyper-V from Scratch',             category: 'Server & VM' },
  { title: 'How to Configure SAN Storage for Enterprise',              category: 'Server & VM' },
  { title: 'How to Design and Cable a Server Rack',                    category: 'Server & VM' },

  // Networking
  { title: 'How to Configure a Cisco Switch Step by Step',             category: 'Networking' },
  { title: 'How to Configure VLANs on Cisco Switches',                 category: 'Networking' },
  { title: 'How to Set Up BGP Routing for Enterprise Networks',        category: 'Networking' },
  { title: 'How to Configure OSPF Routing Protocol',                   category: 'Networking' },
  { title: 'How to Configure SD-WAN with Cisco Viptela',               category: 'Networking' },
  { title: 'How to Set Up MPLS for Enterprise WAN',                    category: 'Networking' },
  { title: 'How to Configure Palo Alto Firewall from Scratch',         category: 'Security' },
  { title: 'How to Configure Cisco ASA Firewall',                      category: 'Security' },
  { title: 'Enterprise Wireless Network Design Best Practices',        category: 'Networking' },
  { title: 'How to Configure QoS for VoIP and Video Traffic',         category: 'Networking' },
  { title: 'How to Set Up Network Monitoring with SNMP',               category: 'Networking' },

  // Cloud & Migration
  { title: 'On-Premise to AWS Migration — Complete Step by Step Guide', category: 'Cloud' },
  { title: 'On-Premise to Azure Migration — Complete Step by Step Guide', category: 'Cloud' },
  { title: 'On-Premise to Google Cloud Migration Guide',               category: 'Cloud' },
  { title: 'Data Centre Migration — Full Project Checklist',           category: 'Migration' },
  { title: 'How to Migrate SQL Server to Azure SQL',                   category: 'Cloud' },
  { title: 'How to Migrate Active Directory to Azure AD',              category: 'Cloud' },
  { title: 'Lift and Shift vs Re-Architect vs Re-Platform — When to Use Each', category: 'Cloud' },
  { title: 'Cloud Cost Optimisation Strategies for Enterprise',        category: 'Cloud' },
  { title: 'How to Set Up Azure Landing Zone',                         category: 'Cloud' },

  // Project Management
  { title: 'IT Project Kickoff Meeting — Complete Checklist',          category: 'Project Management' },
  { title: 'How to Write an IT Project Scope Document',                category: 'Project Management' },
  { title: 'Risk Management Framework for IT Infrastructure Projects', category: 'Project Management' },
  { title: 'How to Run a Change Advisory Board (CAB)',                 category: 'Project Management' },
  { title: 'Post Implementation Review Template for IT Projects',      category: 'Project Management' },
  { title: 'IT Project Lessons Learned Template and Best Practices',   category: 'Project Management' },
  { title: 'Stakeholder Communication Plan for IT Projects',           category: 'Project Management' },

  // Security
  { title: 'Network Security Hardening Checklist',                     category: 'Security' },
  { title: 'How to Implement Zero Trust Network Architecture',         category: 'Security' },
  { title: 'IT Security Audit Checklist for Enterprise',               category: 'Security' },

  // Operations
  { title: 'IT Disaster Recovery Planning — Complete Guide',           category: 'Operations' },
  { title: 'How to Write a Technical Runbook',                         category: 'Operations' },
  { title: 'Data Centre Decommission Checklist',                       category: 'Operations' },
  { title: 'ITIL Incident Management Process Guide',                   category: 'Operations' },
]

// ─── Helper: delay between requests to avoid rate limiting ─────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Generate article via Anthropic API ────────────────────────────────────
async function generateArticle(title, category) {
  const prompt = `You are a senior IT expert writing for an enterprise IT knowledge base used by IT Project Managers and Network Engineers worldwide.

Write a comprehensive professional article about: "${title}"
Category: ${category}

Structure your response EXACTLY as follows:

OVERVIEW
(2-3 sentence professional introduction explaining what this is and why it matters)

KEY CONCEPTS
(bullet list of the most important concepts to understand before starting)

STEP-BY-STEP GUIDE
(numbered detailed steps with real commands, IP examples, tool names, config snippets where relevant)

BEST PRACTICES
(5-7 industry best practices from real enterprise experience)

COMMON ISSUES & TROUBLESHOOTING
(3-5 most common problems with exact solutions)

TOOLS & RESOURCES
(recommended tools, vendors, certifications, official documentation links)

Be specific, practical and detailed. Write as if explaining to an experienced IT PM or Network Engineer.
Include real examples, commands, and configurations. Minimum 600 words.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text
}

// ─── Save article to Supabase ───────────────────────────────────────────────
async function saveToSupabase(title, content, category) {
  const tags = [
    category.toLowerCase().replace(/\s+/g, '-'),
    'ai-generated',
    'bulk-generated',
  ]

  const response = await fetch(`${SUPABASE_URL}/rest/v1/kb_articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      title,
      content,
      category,
      tags,
      author_id: null,  // system generated
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Supabase error ${response.status}: ${err}`)
  }

  return await response.json()
}

// ─── Check if article already exists ───────────────────────────────────────
async function articleExists(title) {
  const encoded = encodeURIComponent(title)
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/kb_articles?title=eq.${encoded}&select=id`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )
  const data = await response.json()
  return Array.isArray(data) && data.length > 0
}

// ─── Main runner ────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  NexPlan — Bulk KB Article Generator')
  console.log('═══════════════════════════════════════════════════\n')

  // Validate env vars
  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY not set')
    console.error('   Run: set ANTHROPIC_API_KEY=sk-ant-...')
    process.exit(1)
  }
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ ERROR: SUPABASE_SERVICE_KEY not set')
    console.error('   Run: set SUPABASE_SERVICE_KEY=eyJ...')
    process.exit(1)
  }

  console.log(`📚 Total articles to generate: ${ARTICLES.length}`)
  console.log(`🌐 Supabase: ${SUPABASE_URL}`)
  console.log(`🤖 Model: claude-haiku (cost-efficient)\n`)

  let generated = 0
  let skipped = 0
  let failed = 0
  const errors = []

  for (let i = 0; i < ARTICLES.length; i++) {
    const { title, category } = ARTICLES[i]
    const num = `[${String(i + 1).padStart(2, '0')}/${ARTICLES.length}]`

    process.stdout.write(`${num} ${title.substring(0, 55).padEnd(55)} `)

    try {
      // Check if already exists
      const exists = await articleExists(title)
      if (exists) {
        console.log('⏭  SKIPPED (already exists)')
        skipped++
        continue
      }

      // Generate content
      process.stdout.write('🤖 Generating...')
      const content = await generateArticle(title, category)

      if (!content) throw new Error('Empty content returned')

      // Save to Supabase
      process.stdout.write(' 💾 Saving...')
      await saveToSupabase(title, content, category)

      console.log(' ✅ DONE')
      generated++

      // Wait 2 seconds between requests to avoid rate limiting
      if (i < ARTICLES.length - 1) await sleep(2000)

    } catch (err) {
      console.log(` ❌ FAILED: ${err.message}`)
      failed++
      errors.push({ title, error: err.message })

      // Wait longer if rate limited
      if (err.message.includes('429') || err.message.includes('rate')) {
        console.log('    ⏳ Rate limited — waiting 30 seconds...')
        await sleep(30000)
      }
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════')
  console.log('  COMPLETE')
  console.log('═══════════════════════════════════════════════════')
  console.log(`✅ Generated: ${generated}`)
  console.log(`⏭  Skipped:   ${skipped} (already existed)`)
  console.log(`❌ Failed:    ${failed}`)
  console.log(`📊 Total in KB: ${generated + skipped}`)

  if (errors.length > 0) {
    console.log('\nFailed articles:')
    errors.forEach(e => console.log(`  - ${e.title}: ${e.error}`))
    console.log('\nRe-run the script to retry failed articles.')
  }

  console.log('\n🎉 Your NexPlan Knowledge Base is ready!')
  console.log('   Visit nexplan.io/knowledge to see all articles.\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

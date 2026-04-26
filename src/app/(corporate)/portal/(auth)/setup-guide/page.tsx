/**
 * src/app/(corporate)/portal/(auth)/setup-guide/page.tsx
 *
 * Quick install reference inside the portal — same content as README.md
 * but rendered with a code-copying UX.
 */

import { cookies }              from 'next/headers'
import { findWorkspaceByEmail } from '@/lib/corporate/whitelist'
import { CodeBlock }            from '@/components/corporate/CodeBlock'

export default async function SetupGuidePage() {
  const cookieStore = await cookies()
  const email       = cookieStore.get('corp_email')?.value
  const workspace   = findWorkspaceByEmail(email)!

  return (
    <div className="max-w-[900px] mx-auto space-y-7">

      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400 mb-1">
          Setup Guide
        </p>
        <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
          Install NexPlan in your data centre
        </h1>
        <p className="text-[13px] text-slate-500 mt-1.5">
          Pre-configured for <strong>{workspace.company_name}</strong> · {workspace.domain} · 15 minutes start to finish
        </p>
      </div>

      {/* Prerequisites */}
      <Section
        n="0"
        title="Prerequisites"
        body="Before you start, confirm you have:"
      >
        <ul className="text-[13px] text-slate-700 leading-relaxed list-disc pl-5 space-y-1">
          <li>A Linux server (Ubuntu 22.04+ recommended) with 4 GB RAM, 10 GB disk</li>
          <li>Docker Engine 24+ and Docker Compose v2 (<code className="bg-slate-100 px-1 rounded">docker compose version</code>)</li>
          <li>The domain <code className="bg-slate-100 px-1 rounded">{workspace.domain}</code> resolves to your server</li>
          <li>Outbound HTTPS to <code className="bg-slate-100 px-1 rounded">nexplan.io</code> for licence validation (or use air-gap mode)</li>
        </ul>
      </Section>

      {/* Step 1 */}
      <Section
        n="1"
        title="Generate your licence key"
        body="From the Overview tab, click 'Generate New Key' and copy the value. You'll paste it into the .env file in step 3."
      />

      {/* Step 2 */}
      <Section
        n="2"
        title="Download deployment files"
        body="From the Overview tab → Deployment Assets section, click 'Download All'. Place all four files in /opt/nexplan/ on your server."
      >
        <CodeBlock language="bash" code={`# On your server
sudo mkdir -p /opt/nexplan
sudo chown $USER:$USER /opt/nexplan
cd /opt/nexplan
# (transfer the 4 files: Dockerfile, docker-compose.yml, .env.template, README.md)`} />
      </Section>

      {/* Step 3 */}
      <Section
        n="3"
        title="Configure your environment"
        body="Copy the template, paste your licence key, and pick a strong database password."
      >
        <CodeBlock language="bash" code={`cd /opt/nexplan
cp .env.template .env

# Open in your editor:
nano .env

# Required values:
#   NEXPLAN_LICENCE_KEY  ← paste from corporate portal
#   POSTGRES_PASSWORD    ← generate one: openssl rand -base64 32
#   NEXT_PUBLIC_APP_URL  ← already set to https://${workspace.domain}`} />
      </Section>

      {/* Step 4 */}
      <Section
        n="4"
        title="Start NexPlan"
        body="Pull the image and bring up the stack."
      >
        <CodeBlock language="bash" code={`docker compose pull
docker compose up -d

# Watch the licence verification on first start:
docker compose logs -f nexplan-app`} />
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
          <p className="text-[12px] text-emerald-800 leading-relaxed">
            ✅ <strong>You should see:</strong> <code>Licence valid — {workspace.company_name}</code> followed by NexPlan starting on port 8080.
          </p>
        </div>
      </Section>

      {/* Step 5 */}
      <Section
        n="5"
        title="Front it with HTTPS (recommended)"
        body="Use nginx, Traefik, or your existing load balancer to add TLS. Example for nginx:"
      >
        <CodeBlock language="nginx" code={`server {
    listen 443 ssl http2;
    server_name ${workspace.domain};

    ssl_certificate     /etc/ssl/certs/${workspace.domain}.crt;
    ssl_certificate_key /etc/ssl/private/${workspace.domain}.key;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`} />
      </Section>

      {/* Step 6 */}
      <Section
        n="6"
        title="Day-2 operations"
        body="Common commands:"
      >
        <CodeBlock language="bash" code={`# Update to latest version
docker compose pull && docker compose up -d

# Backup database
docker compose exec nexplan-db pg_dump -U nexplan nexplan > backup-$(date +%Y%m%d).sql

# View logs
docker compose logs -f --tail 100

# Restart after changing .env
docker compose up -d`} />
      </Section>

      {/* Air-gap */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-700">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900 mb-1">Air-gap deployments</h3>
            <p className="text-[12px] text-slate-600 leading-relaxed mb-3">
              For environments without internet access, set <code className="bg-white px-1 rounded">NEXPLAN_AIR_GAP=true</code> in <code className="bg-white px-1 rounded">.env</code>.
              The container will use its bundled public key to verify the licence offline.
            </p>
            <CodeBlock language="bash" code={`# On a machine with internet:
docker pull ghcr.io/sandhyasneha/nexplan:latest
docker save ghcr.io/sandhyasneha/nexplan:latest > nexplan.tar

# Transfer nexplan.tar to the air-gapped server, then:
docker load < nexplan.tar`} />
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="text-center pt-4">
        <p className="text-[12px] text-slate-500">
          Need help? Email{' '}
          <a href="mailto:corporate@nexplan.io" className="text-indigo-600 hover:underline font-medium">
            corporate@nexplan.io
          </a>
        </p>
      </div>
    </div>
  )
}

function Section({
  n,
  title,
  body,
  children,
}: {
  n:        string
  title:    string
  body:     string
  children?: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <span className="text-[12px] font-bold text-indigo-700">{n}</span>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{body}</p>
        </div>
      </div>
      {children && <div className="ml-10">{children}</div>}
    </section>
  )
}

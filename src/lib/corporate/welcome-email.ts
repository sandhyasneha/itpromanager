/**
 * src/lib/corporate/welcome-email.ts
 *
 * Sends a welcome email to corporate IT admins when their domain is whitelisted.
 * Uses Resend (which the rest of the app already uses).
 */

import type { CorporateWorkspace } from './whitelist'

interface SendArgs {
  to:        string             // e.g. "admin@citibank.com"
  workspace: CorporateWorkspace
  inviter?:  string             // your email so they know who added them
}

export async function sendCorporateWelcomeEmail({ to, workspace, inviter }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[Corporate Welcome] RESEND_API_KEY not set — skipping email')
    return { ok: false, reason: 'No Resend API key configured' }
  }

  const html = renderEmailHtml({ workspace, to, inviter })
  const text = renderEmailText({ workspace, to, inviter })

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'NexPlan Corporate <corporate@nexplan.io>',
        to:      [to],
        subject: `You're invited: ${workspace.company_name} workspace on NexPlan`,
        html,
        text,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Corporate Welcome] Resend error:', err)
      return { ok: false, reason: err }
    }

    const data = await res.json()
    return { ok: true, id: data.id }
  } catch (err: any) {
    console.error('[Corporate Welcome] Send failed:', err)
    return { ok: false, reason: err.message }
  }
}

// ── HTML template ──────────────────────────────────────────────────────────

function renderEmailHtml({
  workspace, to, inviter,
}: { workspace: CorporateWorkspace; to: string; inviter?: string }): string {

  const portalUrl   = 'https://corporate.nexplan.io'
  const planLabel   = workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)
  const seatsLabel  = workspace.seats === -1 ? 'Unlimited' : `${workspace.seats} seats`
  const renewalDate = new Date(workspace.renewal_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Welcome to NexPlan Corporate</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFB;padding:32px 16px;">
  <tr><td align="center">

    <!-- Card -->
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

      <!-- Header band -->
      <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:28px 32px;color:#ffffff;">
        <div style="display:inline-block;padding:4px 10px;background:rgba(255,255,255,0.18);border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:14px;">
          Corporate Access Granted
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;line-height:1.2;letter-spacing:-0.01em;">
          Welcome to NexPlan, ${workspace.company_name}
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:#e0e7ff;line-height:1.5;">
          Your workspace is ready. Sign in to generate your licence key and download the deployment files.
        </p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:28px 32px;">

        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#334155;">
          ${inviter
            ? `${inviter} has granted your domain <strong>${workspace.domain}</strong> access to NexPlan Corporate.`
            : `Your domain <strong>${workspace.domain}</strong> has been added to NexPlan Corporate.`}
          You can now self-serve everything you need to deploy NexPlan inside your data centre.
        </p>

        <!-- Workspace details -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
          <tr><td style="padding:14px 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;width:35%;">Plan</td>
                <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${planLabel}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Seats</td>
                <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${seatsLabel}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Domain</td>
                <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;font-family:Consolas,Monaco,monospace;">${workspace.domain}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Renewal</td>
                <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${renewalDate}</td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- 3 step list -->
        <h2 style="margin:0 0 14px;font-size:16px;font-weight:600;color:#0f172a;">
          Get NexPlan running in 3 steps
        </h2>

        ${[
          { n: '1', t: 'Sign in & generate your licence',     d: 'One click in the portal — your licence is locked to your domain and instantly active.' },
          { n: '2', t: 'Download deployment files',           d: 'Dockerfile, docker-compose.yml, .env.template, README.md — pre-configured for you.' },
          { n: '3', t: 'Run docker compose up -d',            d: 'On your Linux server. NexPlan validates the licence on startup and is live on port 8080.' },
        ].map(s => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td style="width:32px;vertical-align:top;padding-top:2px;">
                <div style="width:24px;height:24px;border-radius:999px;background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:700;text-align:center;line-height:24px;">
                  ${s.n}
                </div>
              </td>
              <td style="vertical-align:top;padding-bottom:6px;">
                <div style="font-size:13px;font-weight:600;color:#0f172a;line-height:1.4;">${s.t}</div>
                <div style="font-size:12px;color:#64748b;line-height:1.5;margin-top:2px;">${s.d}</div>
              </td>
            </tr>
          </table>
        `).join('')}

        <!-- CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr><td align="center">
            <a href="${portalUrl}/login" style="display:inline-block;padding:11px 22px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
              Open Corporate Portal →
            </a>
          </td></tr>
          <tr><td align="center" style="padding-top:8px;">
            <a href="${portalUrl}/login" style="font-size:11px;color:#64748b;font-family:Consolas,Monaco,monospace;text-decoration:none;">
              ${portalUrl}/login
            </a>
          </td></tr>
        </table>

        <p style="margin:28px 0 0;font-size:12px;color:#64748b;line-height:1.6;">
          Sign in with any <strong>@${workspace.domain}</strong> email address.
          Need help? Reply to this email or contact
          <a href="mailto:corporate@nexplan.io" style="color:#4f46e5;text-decoration:none;font-weight:500;">corporate@nexplan.io</a>.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
          NexPlan Corporate · ${portalUrl} · This email was sent to ${to}<br>
          You're receiving this because your domain was authorised for NexPlan enterprise deployment.
        </p>
      </td></tr>

    </table>

  </td></tr>
</table>

</body>
</html>`
}

// ── Plaintext fallback ──────────────────────────────────────────────────────

function renderEmailText({
  workspace, to, inviter,
}: { workspace: CorporateWorkspace; to: string; inviter?: string }): string {

  const portalUrl = 'https://corporate.nexplan.io'

  return `Welcome to NexPlan Corporate

${workspace.company_name} workspace is ready.

${inviter
  ? `${inviter} has granted your domain ${workspace.domain} access.`
  : `Your domain ${workspace.domain} has been authorised.`}

WORKSPACE DETAILS
─────────────────
Plan:    ${workspace.plan}
Seats:   ${workspace.seats === -1 ? 'Unlimited' : workspace.seats}
Domain:  ${workspace.domain}
Renewal: ${workspace.renewal_at}

GET STARTED IN 3 STEPS
──────────────────────

1. Sign in & generate your licence
   One click in the portal — locked to your domain.

2. Download deployment files
   Dockerfile, docker-compose.yml, .env.template, README.md.

3. Run docker compose up -d
   NexPlan validates the licence and is live on port 8080.

Open the portal:
${portalUrl}/login

Sign in with any @${workspace.domain} email address.

Need help? Email corporate@nexplan.io
`
}

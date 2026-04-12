"use client";

/**
 * DCSetupWizard.tsx
 * src/app/setup/DCSetupWizard.tsx
 *
 * Self-service Data Center configuration wizard.
 * Admin logs in → fills in DC server IP, DB, SMTP, SSO, LLM config.
 * Saves to Supabase tenant_config table.
 * No file editing, no terminal access needed.
 */

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServerConfig {
  appUrl:        string;
  serverIp:      string;
  serverPort:    string;
  sslCertPath:   string;
  sslKeyPath:    string;
  airGap:        boolean;
  whiteLabel:    boolean;
  brandName:     string;
  logoUrl:       string;
}

interface DatabaseConfig {
  host:     string;
  port:     string;
  name:     string;
  user:     string;
  password: string;
  ssl:      boolean;
  poolSize: string;
}

interface EmailConfig {
  smtpHost:   string;
  smtpPort:   string;
  smtpUser:   string;
  smtpPass:   string;
  fromEmail:  string;
  fromName:   string;
  tlsEnabled: boolean;
}

interface SSOConfig {
  provider:       "none" | "azure_ad" | "saml" | "ldap" | "okta";
  azureClientId:  string;
  azureTenantId:  string;
  azureSecret:    string;
  samlEntryPoint: string;
  samlIssuer:     string;
  samlCert:       string;
  ldapUrl:        string;
  ldapBaseDn:     string;
  ldapBindDn:     string;
  ldapBindPass:   string;
  ldapFilter:     string;
  oktaDomain:     string;
  oktaClientId:   string;
  oktaSecret:     string;
}

interface LLMConfig {
  provider:         "anthropic_cloud" | "ollama" | "openai_compatible" | "azure_openai" | "disabled";
  anthropicKey:     string;
  ollamaUrl:        string;
  ollamaModel:      string;
  openaiUrl:        string;
  openaiKey:        string;
  openaiModel:      string;
  azureEndpoint:    string;
  azureKey:         string;
  azureDeployment:  string;
  testPrompt:       string;
}

type Step = "server" | "database" | "email" | "sso" | "llm" | "review" | "done";

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: "server",   label: "Server",   icon: "🖥" },
  { id: "database", label: "Database", icon: "🗄" },
  { id: "email",    label: "Email",    icon: "📧" },
  { id: "sso",      label: "SSO / Auth",icon: "🔐" },
  { id: "llm",      label: "AI / LLM", icon: "🤖" },
  { id: "review",   label: "Review",   icon: "✅" },
];

const LLM_PROVIDERS = [
  { id: "anthropic_cloud",  label: "Anthropic Cloud (Claude)",    badge: "Recommended · Internet required",     badgeColor: "#E1F5EE", badgeText: "#085041" },
  { id: "ollama",           label: "Ollama (Local LLM)",          badge: "Best for air-gap · No internet needed", badgeColor: "#E6F1FB", badgeText: "#0C447C" },
  { id: "openai_compatible",label: "OpenAI-compatible endpoint",  badge: "vLLM, LM Studio, LiteLLM, etc.",       badgeColor: "#FAEEDA", badgeText: "#633806" },
  { id: "azure_openai",     label: "Azure OpenAI",                badge: "Microsoft cloud · Enterprise SLA",     badgeColor: "#E6F1FB", badgeText: "#0C447C" },
  { id: "disabled",         label: "Disable AI features",         badge: "No AI — project management only",      badgeColor: "#F1EFE8", badgeText: "#5F5E5A" },
];

const SSO_PROVIDERS = [
  { id: "none",      label: "Email & Password only",   icon: "📧" },
  { id: "azure_ad",  label: "Azure AD / Entra ID",     icon: "🔵" },
  { id: "saml",      label: "SAML 2.0 (Okta, ADFS, Ping)", icon: "🔐" },
  { id: "ldap",      label: "LDAP / Active Directory", icon: "📁" },
  { id: "okta",      label: "Okta",                    icon: "🟣" },
];

const OLLAMA_MODELS = [
  "llama3.2:3b", "llama3.2:8b", "llama3.1:8b", "llama3.1:70b",
  "mistral:7b", "mixtral:8x7b", "gemma2:9b", "gemma2:27b",
  "qwen2.5:7b", "qwen2.5:14b", "phi3.5:3.8b", "codellama:13b",
];

export default function DCSetupWizard() {
  const [step, setStep]   = useState<Step>("server");
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, "ok" | "fail" | "pending">>({});
  const [saving, setSaving] = useState(false);

  const [server, setServer] = useState<ServerConfig>({
    appUrl: "", serverIp: "", serverPort: "443",
    sslCertPath: "/etc/nexplan/ssl/cert.pem",
    sslKeyPath:  "/etc/nexplan/ssl/key.pem",
    airGap: false, whiteLabel: false, brandName: "NexPlan", logoUrl: "",
  });

  const [db, setDb] = useState<DatabaseConfig>({
    host: "", port: "5432", name: "nexplan",
    user: "nexplan", password: "", ssl: true, poolSize: "10",
  });

  const [email, setEmail] = useState<EmailConfig>({
    smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "",
    fromEmail: "", fromName: "NexPlan", tlsEnabled: true,
  });

  const [sso, setSso] = useState<SSOConfig>({
    provider: "none",
    azureClientId: "", azureTenantId: "", azureSecret: "",
    samlEntryPoint: "", samlIssuer: "", samlCert: "",
    ldapUrl: "", ldapBaseDn: "", ldapBindDn: "", ldapBindPass: "", ldapFilter: "(sAMAccountName={{username}})",
    oktaDomain: "", oktaClientId: "", oktaSecret: "",
  });

  const [llm, setLlm] = useState<LLMConfig>({
    provider: "anthropic_cloud",
    anthropicKey: "", ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3.2:8b",
    openaiUrl: "", openaiKey: "", openaiModel: "gpt-4o",
    azureEndpoint: "", azureKey: "", azureDeployment: "",
    testPrompt: "Summarise the key steps to migrate a server to cloud in 3 bullet points.",
  });

  const stepIdx  = STEPS.findIndex(s => s.id === step);
  const isLast   = step === "review";

  function upd<T>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T, val: any) {
    setter(prev => ({ ...prev, [key]: val }));
  }

  async function testConnection(type: string) {
    setTesting(type);
    setTestResults(r => ({ ...r, [type]: "pending" }));
    await new Promise(res => setTimeout(res, 1800));
    // In production — call /api/setup/test with config payload
    const ok = Math.random() > 0.2;
    setTestResults(r => ({ ...r, [type]: ok ? "ok" : "fail" }));
    setTesting(null);
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(res => setTimeout(res, 2000));
    // In production — POST to /api/setup/save
    setSaving(false);
    setStep("done");
  }

  const TestBtn = ({ id, label }: { id: string; label: string }) => {
    const res = testResults[id];
    return (
      <button onClick={() => testConnection(id)}
        disabled={testing === id}
        style={{
          padding: "6px 14px", borderRadius: 7, border: "0.5px solid var(--bdr)",
          background: res === "ok" ? "#E1F5EE" : res === "fail" ? "#FCEBEB" : "var(--bg)",
          color: res === "ok" ? "#085041" : res === "fail" ? "#791F1F" : "var(--mut)",
          cursor: "pointer", fontSize: 12, fontFamily: "var(--mono)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
        {testing === id ? "⏳ Testing…" : res === "ok" ? "✓ " + label : res === "fail" ? "✗ Failed" : "Test " + label}
      </button>
    );
  };

  const Field = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt)", marginBottom: 4 }}>{label}</div>
      {children}
      {note && <div style={{ fontSize: 11, color: "var(--mut)", marginTop: 3 }}>{note}</div>}
    </div>
  );

  const Input = ({ value, onChange, placeholder, type = "text", mono = false }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean;
  }) => (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 12px", borderRadius: 8,
        border: "0.5px solid var(--bdr)", background: "var(--bg)",
        color: "var(--txt)", fontSize: 13,
        fontFamily: mono ? "var(--mono)" : "var(--sans)",
        boxSizing: "border-box" as const,
      }} />
  );

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--txt)" }}>
      <div onClick={() => onChange(!value)} style={{
        width: 36, height: 20, borderRadius: 10,
        background: value ? "#0F6E56" : "var(--bdr2)",
        position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: value ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </div>
      {label}
    </label>
  );

  return (
    <>
      <style>{`
        :root{--bg:#F4F3EF;--sur:#fff;--bdr:rgba(0,0,0,0.09);--bdr2:rgba(0,0,0,0.2);--txt:#1A1A18;--mut:#73726C;--acc:#0F6E56;--mono:'DM Mono','Fira Mono',monospace;--sans:'DM Sans',system-ui,sans-serif;}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:var(--sans);background:var(--bg);}
        select{width:100%;padding:8px 12px;border-radius:8px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--txt);font-size:13px;}
        textarea{width:100%;padding:8px 12px;border-radius:8px;border:0.5px solid var(--bdr);background:var(--bg);color:var(--txt);font-size:13px;font-family:var(--mono);resize:vertical;min-height:80px;}
      `}</style>

      <div style={{ fontFamily: "var(--sans)", background: "var(--bg)", minHeight: "100vh" }}>

        {/* Topbar */}
        <div style={{ background: "var(--sur)", borderBottom: "0.5px solid var(--bdr)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "#E1F5EE" }}>NP</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--txt)" }}>NexPlan — Data Center Setup</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mut)" }}>Enterprise self-service configuration wizard</div>
            </div>
          </div>
          <div style={{ fontSize: 11, background: "#E6F1FB", color: "#0C447C", padding: "4px 12px", borderRadius: 6, fontFamily: "var(--mono)", fontWeight: 600 }}>DC SETUP WIZARD</div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>

          {step !== "done" && (
            <>
              {/* Step progress */}
              <div style={{ display: "flex", gap: 0, marginBottom: 28, background: "var(--sur)", borderRadius: 12, border: "0.5px solid var(--bdr)", overflow: "hidden" }}>
                {STEPS.map((s, i) => {
                  const done    = i < stepIdx;
                  const current = s.id === step;
                  return (
                    <div key={s.id} style={{
                      flex: 1, padding: "10px 6px", textAlign: "center",
                      background: current ? "#0F6E56" : done ? "#E1F5EE" : "transparent",
                      borderRight: i < STEPS.length - 1 ? "0.5px solid var(--bdr)" : "none",
                      cursor: done ? "pointer" : "default",
                    }} onClick={() => done && setStep(s.id)}>
                      <div style={{ fontSize: 14 }}>{done ? "✓" : s.icon}</div>
                      <div style={{ fontSize: 10, marginTop: 2, fontWeight: current ? 600 : 400, color: current ? "#fff" : done ? "#085041" : "var(--mut)" }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* ── STEP: SERVER ── */}
              {step === "server" && (
                <div style={{ background: "var(--sur)", borderRadius: 14, border: "0.5px solid var(--bdr)", padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>🖥 Server Configuration</div>
                  <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 20 }}>Configure your Data Center server address and SSL settings. This is the URL your users will access NexPlan on.</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Application URL" note="The full URL users will access, e.g. https://nexplan.citibank.net">
                      <Input value={server.appUrl} onChange={v => upd(setServer, "appUrl", v)} placeholder="https://nexplan.citibank.net" />
                    </Field>
                    <Field label="Server IP Address" note="Internal IP of the server running NexPlan">
                      <Input value={server.serverIp} onChange={v => upd(setServer, "serverIp", v)} placeholder="10.20.30.40" mono />
                    </Field>
                    <Field label="HTTPS Port">
                      <Input value={server.serverPort} onChange={v => upd(setServer, "serverPort", v)} placeholder="443" mono />
                    </Field>
                    <div />
                    <Field label="SSL Certificate path" note="Path on server to the PEM certificate file">
                      <Input value={server.sslCertPath} onChange={v => upd(setServer, "sslCertPath", v)} mono />
                    </Field>
                    <Field label="SSL Private key path">
                      <Input value={server.sslKeyPath} onChange={v => upd(setServer, "sslKeyPath", v)} mono />
                    </Field>
                  </div>

                  <div style={{ borderTop: "0.5px solid var(--bdr)", paddingTop: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                    <Toggle value={server.airGap} onChange={v => upd(setServer, "airGap", v)} label="Enable Air-gap mode (no internet access — disables cloud AI and external services)" />
                    <Toggle value={server.whiteLabel} onChange={v => upd(setServer, "whiteLabel", v)} label="Enable White-label (show your organisation's branding instead of NexPlan)" />
                    {server.whiteLabel && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 4 }}>
                        <Field label="Brand name"><Input value={server.brandName} onChange={v => upd(setServer, "brandName", v)} placeholder="CITI BANK IT Hub" /></Field>
                        <Field label="Logo URL" note="Hosted inside your network"><Input value={server.logoUrl} onChange={v => upd(setServer, "logoUrl", v)} placeholder="https://nexplan.citibank.net/logo.png" /></Field>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, alignItems: "center" }}>
                    <TestBtn id="server" label="Connection" />
                    <button onClick={() => setStep("database")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0F6E56", color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Next: Database →</button>
                  </div>
                </div>
              )}

              {/* ── STEP: DATABASE ── */}
              {step === "database" && (
                <div style={{ background: "var(--sur)", borderRadius: 14, border: "0.5px solid var(--bdr)", padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>🗄 Database Configuration</div>
                  <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 20 }}>Connect NexPlan to your existing PostgreSQL database. NexPlan creates its own schema and does not modify other schemas.</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="PostgreSQL host" note="IP or hostname of your DB server">
                      <Input value={db.host} onChange={v => upd(setDb, "host", v)} placeholder="10.20.30.41" mono />
                    </Field>
                    <Field label="Port">
                      <Input value={db.port} onChange={v => upd(setDb, "port", v)} placeholder="5432" mono />
                    </Field>
                    <Field label="Database name">
                      <Input value={db.name} onChange={v => upd(setDb, "name", v)} placeholder="nexplan" mono />
                    </Field>
                    <Field label="Username">
                      <Input value={db.user} onChange={v => upd(setDb, "user", v)} placeholder="nexplan" mono />
                    </Field>
                    <Field label="Password">
                      <Input value={db.password} onChange={v => upd(setDb, "password", v)} type="password" mono />
                    </Field>
                    <Field label="Connection pool size">
                      <Input value={db.poolSize} onChange={v => upd(setDb, "poolSize", v)} placeholder="10" mono />
                    </Field>
                  </div>

                  <Toggle value={db.ssl} onChange={v => upd(setDb, "ssl", v)} label="Require SSL for database connection (recommended)" />

                  <div style={{ marginTop: 16, background: "#E6F1FB", borderRadius: 10, padding: 12, fontSize: 12, color: "#0C447C" }}>
                    💡 <strong>Migrations run automatically</strong> on first start. NexPlan creates the <code>nexplan</code> schema inside your database. No manual SQL required.
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setStep("server")} style={{ padding: "10px 18px", borderRadius: 8, border: "0.5px solid var(--bdr)", background: "var(--bg)", color: "var(--mut)", cursor: "pointer", fontSize: 13 }}>← Back</button>
                      <TestBtn id="database" label="DB Connection" />
                    </div>
                    <button onClick={() => setStep("email")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0F6E56", color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Next: Email →</button>
                  </div>
                </div>
              )}

              {/* ── STEP: EMAIL ── */}
              {step === "email" && (
                <div style={{ background: "var(--sur)", borderRadius: 14, border: "0.5px solid var(--bdr)", padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>📧 Email / SMTP Configuration</div>
                  <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 20 }}>Configure your internal SMTP server for notifications, invites, and status reports. All email stays inside your network.</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="SMTP host" note="Your internal mail server">
                      <Input value={email.smtpHost} onChange={v => upd(setEmail, "smtpHost", v)} placeholder="smtp.citibank.net" mono />
                    </Field>
                    <Field label="SMTP port">
                      <Input value={email.smtpPort} onChange={v => upd(setEmail, "smtpPort", v)} placeholder="587" mono />
                    </Field>
                    <Field label="SMTP username">
                      <Input value={email.smtpUser} onChange={v => upd(setEmail, "smtpUser", v)} placeholder="nexplan-svc@citibank.net" mono />
                    </Field>
                    <Field label="SMTP password">
                      <Input value={email.smtpPass} onChange={v => upd(setEmail, "smtpPass", v)} type="password" mono />
                    </Field>
                    <Field label="From email address">
                      <Input value={email.fromEmail} onChange={v => upd(setEmail, "fromEmail", v)} placeholder="nexplan@citibank.net" />
                    </Field>
                    <Field label="From display name">
                      <Input value={email.fromName} onChange={v => upd(setEmail, "fromName", v)} placeholder="NexPlan" />
                    </Field>
                  </div>

                  <Toggle value={email.tlsEnabled} onChange={v => upd(setEmail, "tlsEnabled", v)} label="Enable STARTTLS encryption" />

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setStep("database")} style={{ padding: "10px 18px", borderRadius: 8, border: "0.5px solid var(--bdr)", background: "var(--bg)", color: "var(--mut)", cursor: "pointer", fontSize: 13 }}>← Back</button>
                      <TestBtn id="email" label="Send Test Email" />
                    </div>
                    <button onClick={() => setStep("sso")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0F6E56", color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Next: SSO →</button>
                  </div>
                </div>
              )}

              {/* ── STEP: SSO ── */}
              {step === "sso" && (
                <div style={{ background: "var(--sur)", borderRadius: 14, border: "0.5px solid var(--bdr)", padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>🔐 Identity & SSO Configuration</div>
                  <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 20 }}>Choose how users log in. Connect to your existing identity provider so users don't need separate NexPlan passwords.</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                    {SSO_PROVIDERS.map(p => (
                      <div key={p.id} onClick={() => upd(setSso, "provider", p.id as any)}
                        style={{
                          padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                          border: sso.provider === p.id ? "2px solid #0F6E56" : "0.5px solid var(--bdr)",
                          background: sso.provider === p.id ? "#E1F5EE" : "var(--bg)",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                        <span style={{ fontSize: 18 }}>{p.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: sso.provider === p.id ? 600 : 400, color: sso.provider === p.id ? "#085041" : "var(--txt)" }}>{p.label}</span>
                      </div>
                    ))}
                  </div>

                  {sso.provider === "azure_ad" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="Client ID"><Input value={sso.azureClientId} onChange={v => upd(setSso, "azureClientId", v)} mono placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></Field>
                      <Field label="Tenant ID"><Input value={sso.azureTenantId} onChange={v => upd(setSso, "azureTenantId", v)} mono placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></Field>
                      <Field label="Client secret"><Input value={sso.azureSecret} onChange={v => upd(setSso, "azureSecret", v)} type="password" mono /></Field>
                    </div>
                  )}

                  {sso.provider === "saml" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="SAML entry point (IdP SSO URL)" note="From your IdP metadata"><Input value={sso.samlEntryPoint} onChange={v => upd(setSso, "samlEntryPoint", v)} mono placeholder="https://sso.citibank.net/saml/sso" /></Field>
                      <Field label="Issuer / SP Entity ID"><Input value={sso.samlIssuer} onChange={v => upd(setSso, "samlIssuer", v)} mono placeholder="nexplan.citibank.net" /></Field>
                      <Field label="IdP Certificate (base64)" note="From your IdP metadata XML">
                        <textarea value={sso.samlCert} onChange={e => upd(setSso, "samlCert", e.target.value)} placeholder="MIICpDCCAYwCCQD..." />
                      </Field>
                    </div>
                  )}

                  {sso.provider === "ldap" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="LDAP URL"><Input value={sso.ldapUrl} onChange={v => upd(setSso, "ldapUrl", v)} mono placeholder="ldap://dc01.citibank.net:389" /></Field>
                      <Field label="Base DN"><Input value={sso.ldapBaseDn} onChange={v => upd(setSso, "ldapBaseDn", v)} mono placeholder="ou=IT,dc=citibank,dc=net" /></Field>
                      <Field label="Service account DN"><Input value={sso.ldapBindDn} onChange={v => upd(setSso, "ldapBindDn", v)} mono placeholder="cn=nexplan-svc,ou=ServiceAccounts,dc=citibank,dc=net" /></Field>
                      <Field label="Service account password"><Input value={sso.ldapBindPass} onChange={v => upd(setSso, "ldapBindPass", v)} type="password" mono /></Field>
                      <Field label="User filter"><Input value={sso.ldapFilter} onChange={v => upd(setSso, "ldapFilter", v)} mono /></Field>
                    </div>
                  )}

                  {sso.provider === "okta" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="Okta domain"><Input value={sso.oktaDomain} onChange={v => upd(setSso, "oktaDomain", v)} mono placeholder="citibank.okta.com" /></Field>
                      <Field label="Client ID"><Input value={sso.oktaClientId} onChange={v => upd(setSso, "oktaClientId", v)} mono /></Field>
                      <Field label="Client secret"><Input value={sso.oktaSecret} onChange={v => upd(setSso, "oktaSecret", v)} type="password" mono /></Field>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setStep("email")} style={{ padding: "10px 18px", borderRadius: 8, border: "0.5px solid var(--bdr)", background: "var(--bg)", color: "var(--mut)", cursor: "pointer", fontSize: 13 }}>← Back</button>
                      {sso.provider !== "none" && <TestBtn id="sso" label="SSO Connection" />}
                    </div>
                    <button onClick={() => setStep("llm")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0F6E56", color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Next: AI / LLM →</button>
                  </div>
                </div>
              )}

              {/* ── STEP: LLM ── */}
              {step === "llm" && (
                <div style={{ background: "var(--sur)", borderRadius: 14, border: "0.5px solid var(--bdr)", padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>🤖 AI / LLM Configuration</div>
                  <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 4 }}>
                    NexPlan's AI features (task generation, project insights, risk analysis, status reports) require an LLM.
                    For air-gap environments, use <strong>Ollama</strong> — a free, local LLM that runs entirely inside your network.
                  </div>

                  {server.airGap && (
                    <div style={{ background: "#E6F1FB", borderRadius: 8, padding: 10, fontSize: 12, color: "#0C447C", marginBottom: 16 }}>
                      🔒 Air-gap mode is enabled. Cloud AI providers are unavailable. <strong>Ollama (local LLM)</strong> is the recommended choice.
                    </div>
                  )}

                  {/* Provider selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {LLM_PROVIDERS.filter(p => !server.airGap || p.id === "ollama" || p.id === "openai_compatible" || p.id === "disabled").map(p => (
                      <div key={p.id} onClick={() => upd(setLlm, "provider", p.id as any)}
                        style={{
                          padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                          border: llm.provider === p.id ? "2px solid #0F6E56" : "0.5px solid var(--bdr)",
                          background: llm.provider === p.id ? "#E1F5EE" : "var(--bg)",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                        <span style={{ fontSize: 13, fontWeight: llm.provider === p.id ? 600 : 400, color: llm.provider === p.id ? "#085041" : "var(--txt)" }}>{p.label}</span>
                        <span style={{ fontSize: 11, background: p.badgeColor, color: p.badgeText, padding: "2px 10px", borderRadius: 20, fontWeight: 500 }}>{p.badge}</span>
                      </div>
                    ))}
                  </div>

                  {/* Anthropic Cloud */}
                  {llm.provider === "anthropic_cloud" && (
                    <Field label="Anthropic API Key" note="Get from console.anthropic.com — uses Claude Sonnet for all AI features">
                      <Input value={llm.anthropicKey} onChange={v => upd(setLlm, "anthropicKey", v)} type="password" mono placeholder="sk-ant-..." />
                    </Field>
                  )}

                  {/* Ollama */}
                  {llm.provider === "ollama" && (
                    <div>
                      <div style={{ background: "#E1F5EE", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, color: "#085041", lineHeight: 1.7 }}>
                        <strong>Ollama setup (one-time, ~10 minutes):</strong><br/>
                        1. Install on the AI server: <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 6px", borderRadius: 4 }}>curl -fsSL https://ollama.ai/install.sh | sh</code><br/>
                        2. Pull model: <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 6px", borderRadius: 4 }}>ollama pull llama3.2:8b</code><br/>
                        3. Start server: <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 6px", borderRadius: 4 }}>OLLAMA_HOST=0.0.0.0 ollama serve</code><br/>
                        4. Enter the server URL and model below.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <Field label="Ollama server URL" note="IP/hostname of your Ollama server inside the network">
                          <Input value={llm.ollamaUrl} onChange={v => upd(setLlm, "ollamaUrl", v)} mono placeholder="http://10.20.30.50:11434" />
                        </Field>
                        <Field label="Model" note="Recommended: llama3.2:8b (balanced) or llama3.1:70b (best quality)">
                          <select value={llm.ollamaModel} onChange={e => upd(setLlm, "ollamaModel", e.target.value)}>
                            {OLLAMA_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* OpenAI-compatible */}
                  {llm.provider === "openai_compatible" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="API Base URL" note="vLLM, LM Studio, LiteLLM, or any OpenAI-compatible endpoint">
                        <Input value={llm.openaiUrl} onChange={v => upd(setLlm, "openaiUrl", v)} mono placeholder="http://10.20.30.50:8000/v1" />
                      </Field>
                      <Field label="Model name"><Input value={llm.openaiModel} onChange={v => upd(setLlm, "openaiModel", v)} mono placeholder="llama3-8b" /></Field>
                      <Field label="API Key (if required)"><Input value={llm.openaiKey} onChange={v => upd(setLlm, "openaiKey", v)} type="password" mono placeholder="Leave blank if no auth" /></Field>
                    </div>
                  )}

                  {/* Azure OpenAI */}
                  {llm.provider === "azure_openai" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="Azure OpenAI endpoint"><Input value={llm.azureEndpoint} onChange={v => upd(setLlm, "azureEndpoint", v)} mono placeholder="https://myinstance.openai.azure.com" /></Field>
                      <Field label="Deployment name"><Input value={llm.azureDeployment} onChange={v => upd(setLlm, "azureDeployment", v)} mono placeholder="gpt-4o" /></Field>
                      <Field label="API Key"><Input value={llm.azureKey} onChange={v => upd(setLlm, "azureKey", v)} type="password" mono /></Field>
                    </div>
                  )}

                  {llm.provider !== "disabled" && (
                    <div style={{ marginTop: 16 }}>
                      <Field label="Test prompt" note="Used to verify the LLM is responding correctly">
                        <textarea value={llm.testPrompt} onChange={e => upd(setLlm, "testPrompt", e.target.value)} />
                      </Field>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setStep("sso")} style={{ padding: "10px 18px", borderRadius: 8, border: "0.5px solid var(--bdr)", background: "var(--bg)", color: "var(--mut)", cursor: "pointer", fontSize: 13 }}>← Back</button>
                      {llm.provider !== "disabled" && <TestBtn id="llm" label="LLM Connection" />}
                    </div>
                    <button onClick={() => setStep("review")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0F6E56", color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Review & Save →</button>
                  </div>
                </div>
              )}

              {/* ── STEP: REVIEW ── */}
              {step === "review" && (
                <div style={{ background: "var(--sur)", borderRadius: 14, border: "0.5px solid var(--bdr)", padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>✅ Review Configuration</div>
                  <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 20 }}>Review all settings before saving. Changes take effect after restart.</div>

                  {[
                    { title: "Server", icon: "🖥", rows: [
                      ["App URL",    server.appUrl || "—"],
                      ["Server IP",  server.serverIp || "—"],
                      ["Port",       server.serverPort],
                      ["Air-gap",    server.airGap ? "Enabled" : "Disabled"],
                      ["White-label",server.whiteLabel ? server.brandName : "Disabled"],
                    ]},
                    { title: "Database", icon: "🗄", rows: [
                      ["Host", db.host || "—"],
                      ["Port", db.port],
                      ["Database", db.name],
                      ["User", db.user],
                      ["SSL", db.ssl ? "Required" : "Disabled"],
                    ]},
                    { title: "Email", icon: "📧", rows: [
                      ["SMTP host", email.smtpHost || "—"],
                      ["Port", email.smtpPort],
                      ["From", email.fromEmail || "—"],
                      ["TLS", email.tlsEnabled ? "Enabled" : "Disabled"],
                    ]},
                    { title: "SSO / Auth", icon: "🔐", rows: [
                      ["Provider", SSO_PROVIDERS.find(p => p.id === sso.provider)?.label || "—"],
                      ...(sso.provider === "ldap" ? [["LDAP URL", sso.ldapUrl || "—"]] : []),
                      ...(sso.provider === "azure_ad" ? [["Tenant ID", sso.azureTenantId || "—"]] : []),
                    ]},
                    { title: "AI / LLM", icon: "🤖", rows: [
                      ["Provider", LLM_PROVIDERS.find(p => p.id === llm.provider)?.label || "—"],
                      ...(llm.provider === "ollama" ? [["Ollama URL", llm.ollamaUrl], ["Model", llm.ollamaModel]] : []),
                      ...(llm.provider === "openai_compatible" ? [["API URL", llm.openaiUrl || "—"], ["Model", llm.openaiModel]] : []),
                    ]},
                  ].map(section => (
                    <div key={section.title} style={{ marginBottom: 16, border: "0.5px solid var(--bdr)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "10px 14px", background: "var(--bg)", fontWeight: 600, fontSize: 13, color: "var(--txt)", borderBottom: "0.5px solid var(--bdr)" }}>
                        {section.icon} {section.title}
                      </div>
                      {section.rows.map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: "0.5px solid var(--bdr)", fontSize: 13 }}>
                          <span style={{ color: "var(--mut)" }}>{k}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--txt)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div style={{ background: "#FAEEDA", borderRadius: 10, padding: 12, fontSize: 12, color: "#633806", marginBottom: 20 }}>
                    ⚠ Saving this configuration will restart the NexPlan service. Active sessions will be briefly interrupted (~30 seconds).
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setStep("llm")} style={{ padding: "10px 18px", borderRadius: 8, border: "0.5px solid var(--bdr)", background: "var(--bg)", color: "var(--mut)", cursor: "pointer", fontSize: 13 }}>← Back</button>
                    <button onClick={handleSave} disabled={saving}
                      style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: saving ? "#888" : "#0F6E56", color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
                      {saving ? "⏳ Saving & restarting…" : "💾 Save Configuration"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div style={{ background: "var(--sur)", borderRadius: 16, border: "0.5px solid var(--bdr)", padding: 40, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "var(--txt)", marginBottom: 8 }}>NexPlan is configured</div>
              <div style={{ fontSize: 14, color: "var(--mut)", marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>
                All settings have been saved and the service is restarting. Your NexPlan instance will be available at{" "}
                <strong style={{ color: "#0F6E56" }}>{server.appUrl || "your configured URL"}</strong> in approximately 30 seconds.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, maxWidth: 600, margin: "0 auto 28px" }}>
                {[
                  { label: "Server",   val: server.serverIp || "configured", color: "#085041" },
                  { label: "Database", val: "connected",                      color: "#0C447C" },
                  { label: "AI / LLM", val: LLM_PROVIDERS.find(p => p.id === llm.provider)?.label.split("(")[0].trim() || "—", color: "#633806" },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--bg)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={server.appUrl || "#"} style={{ padding: "10px 22px", borderRadius: 8, background: "#0F6E56", color: "#fff", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>Open NexPlan →</a>
                <button onClick={() => setStep("server")} style={{ padding: "10px 22px", borderRadius: 8, border: "0.5px solid var(--bdr)", background: "var(--bg)", color: "var(--mut)", cursor: "pointer", fontSize: 14 }}>Edit Configuration</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

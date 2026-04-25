"use client";

/**
 * src/components/LicenceManager.tsx
 *
 * Admin-only component for issuing and managing NexPlan DC licences.
 * Rendered inside the NexPlan Ops tab in AdminClient.
 *
 * Features:
 *   - Issue new licence keys for DC clients
 *   - View all issued licences + expiry status
 *   - View recent activation logs (who started their container when)
 *   - Revoke a licence
 *   - Copy licence key to clipboard
 */

import { useState, useEffect } from "react";

interface IssuedLicence {
  id:             string;
  licence_id:     string;
  client_name:    string;
  allowed_domain: string;
  plan:           string;
  seats:          number;
  ai_enabled:     boolean;
  air_gap:        boolean;
  expires_at:     string;
  issued_at:      string;
  issued_by:      string;
  notes:          string | null;
}

interface ActivationLog {
  id:           string;
  licence_id:   string;
  domain:       string;
  client_name:  string | null;
  success:      boolean;
  reason:       string;
  instance_id:  string | null;
  app_version:  string | null;
  activated_at: string;
}

const CSS = `
.lm-wrap{font-family:system-ui,sans-serif;}
.lm-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.lm-card{background:#fff;border:0.5px solid rgba(0,0,0,.09);border-radius:12px;padding:18px;margin-bottom:14px;}
.lm-tabs{display:flex;gap:0;background:#fff;border:0.5px solid rgba(0,0,0,.09);border-radius:10px;overflow:hidden;margin-bottom:16px;}
.lm-tab{flex:1;padding:9px 6px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:500;color:#73726C;border-right:0.5px solid rgba(0,0,0,.09);}
.lm-tab:last-child{border-right:none;}
.lm-tab.on{background:#085041;color:#fff;}
.lm-slbl{font-family:monospace;font-size:9px;letter-spacing:.07em;color:#73726C;text-transform:uppercase;margin-bottom:8px;}
.lm-fld{margin-bottom:12px;}
.lm-fld-l{font-size:11px;font-weight:500;color:#1A1A18;margin-bottom:3px;}
.lm-fld-n{font-size:10px;color:#73726C;margin-top:2px;}
.lm-inp{width:100%;padding:7px 9px;border-radius:6px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#1A1A18;font-size:12px;box-sizing:border-box;}
.lm-sel{width:100%;padding:7px 9px;border-radius:6px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#1A1A18;font-size:12px;}
.lm-tog-row{display:flex;align-items:center;gap:9px;font-size:12px;cursor:pointer;user-select:none;margin-bottom:10px;}
.lm-tog{width:30px;height:16px;border-radius:8px;background:#ccc;position:relative;transition:background .18s;flex-shrink:0;}
.lm-tog.on{background:#0F6E56;}
.lm-tog-t{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:left .18s;}
.lm-tog.on .lm-tog-t{left:16px;}
.lm-btn{padding:9px 18px;border-radius:6px;border:none;background:#0F6E56;color:#fff;font-weight:600;cursor:pointer;font-size:12px;}
.lm-btn:disabled{background:#888;cursor:not-allowed;}
.lm-btn-sm{padding:5px 10px;border-radius:5px;border:0.5px solid rgba(0,0,0,.09);background:#F4F3EF;color:#73726C;cursor:pointer;font-size:10px;}
.lm-btn-danger{background:#FCEBEB;color:#791F1F;border:0.5px solid #E24B4A;}
.lm-tbl{width:100%;border-collapse:collapse;}
.lm-tbl th{text-align:left;font-size:9px;font-family:monospace;text-transform:uppercase;color:#73726C;padding:6px 8px;border-bottom:0.5px solid rgba(0,0,0,.09);letter-spacing:.05em;}
.lm-tbl td{padding:7px 8px;font-size:11px;border-bottom:0.5px solid rgba(0,0,0,.09);vertical-align:middle;}
.lm-tbl tr:last-child td{border-bottom:none;}
.lm-badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:600;font-family:monospace;}
.lm-key-box{background:#1A1A18;color:#9FE1CB;font-family:monospace;font-size:10px;padding:12px;border-radius:8px;word-break:break-all;line-height:1.6;position:relative;}
.lm-copy-btn{position:absolute;top:8px;right:8px;padding:4px 8px;border-radius:4px;border:none;background:#0F6E56;color:#fff;cursor:pointer;font-size:10px;}
.lm-success{background:#E1F5EE;border-radius:8px;padding:12px;font-size:11px;color:#085041;margin-bottom:12px;}
.lm-info{background:#E6F1FB;border-radius:8px;padding:10px 12px;font-size:11px;color:#0C447C;margin-bottom:10px;line-height:1.6;}
.lm-warn{background:#FAEEDA;border-radius:8px;padding:10px 12px;font-size:11px;color:#633806;margin-bottom:10px;}
@media(max-width:700px){.lm-grid2{grid-template-columns:1fr;}}
`;

type LMTab = "issue" | "licences" | "logs";

export default function LicenceManager() {
  const [tab, setTab] = useState<LMTab>("issue");

  /* Issue form state */
  const [clientName,    setClientName]    = useState("");
  const [domain,        setDomain]        = useState("");
  const [plan,          setPlan]          = useState("datacenter");
  const [seats,         setSeats]         = useState("250");
  const [months,        setMonths]        = useState("12");
  const [aiEnabled,     setAiEnabled]     = useState(true);
  const [airGap,        setAirGap]        = useState(false);
  const [notes,         setNotes]         = useState("");
  const [issuing,       setIssuing]       = useState(false);
  const [issuedKey,     setIssuedKey]     = useState<any>(null);
  const [copied,        setCopied]        = useState(false);
  const [error,         setError]         = useState("");

  /* Licences list */
  const [licences,      setLicences]      = useState<IssuedLicence[]>([]);
  const [loadingLics,   setLoadingLics]   = useState(false);

  /* Activation logs */
  const [logs,          setLogs]          = useState<ActivationLog[]>([]);
  const [loadingLogs,   setLoadingLogs]   = useState(false);

  /* Load licences when tab changes */
  useEffect(() => {
    if (tab === "licences" && licences.length === 0) fetchLicences();
    if (tab === "logs"     && logs.length === 0)     fetchLogs();
  }, [tab]);

  async function fetchLicences() {
    setLoadingLics(true);
    try {
      const r = await fetch("/api/admin/licence/issue");
      const d = await r.json();
      setLicences(d.licences ?? []);
    } catch { /* silent */ }
    setLoadingLics(false);
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const r = await fetch("/api/admin/licence/logs");
      const d = await r.json();
      setLogs(d.logs ?? []);
    } catch { /* silent */ }
    setLoadingLogs(false);
  }

  async function handleIssue() {
    setIssuing(true);
    setError("");
    setIssuedKey(null);
    try {
      const r = await fetch("/api/admin/licence/issue", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          client_name:    clientName,
          allowed_domain: domain,
          plan,
          seats:          parseInt(seats) || -1,
          expires_months: parseInt(months) || 12,
          ai_enabled:     aiEnabled,
          air_gap:        airGap,
          notes,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Failed to issue licence");
      } else {
        setIssuedKey(d);
        // Reset form
        setClientName(""); setDomain(""); setNotes("");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setIssuing(false);
  }

  function copyKey() {
    navigator.clipboard.writeText(issuedKey.licence_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function expiryBadge(expires_at: string) {
    const days = Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000);
    if (days < 0)  return { label: "Expired",         bg: "#FCEBEB", color: "#791F1F" };
    if (days < 30) return { label: `${days}d left`,   bg: "#FAEEDA", color: "#633806" };
    return              { label: `${days}d left`,     bg: "#E1F5EE", color: "#085041" };
  }

  return (
    <div className="lm-wrap">
      <style>{CSS}</style>

      <div className="lm-tabs">
        {[
          { id: "issue"    as LMTab, label: "🔑 Issue New Licence" },
          { id: "licences" as LMTab, label: "📋 All Licences" },
          { id: "logs"     as LMTab, label: "📡 Activation Logs" },
        ].map(t => (
          <button key={t.id} className={`lm-tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ISSUE NEW LICENCE ── */}
      {tab === "issue" && (
        <>
          <div className="lm-info">
            🔒 <strong>How it works:</strong> You fill in client details → system generates a signed JWT licence key →
            send the key to the client → they add it to their <code>.env</code> as <code>NEXPLAN_LICENCE_KEY</code> →
            their container verifies it on every startup. Without a valid key, the container won't boot.
          </div>

          {error && <div className="lm-warn">❌ {error}</div>}

          {issuedKey && (
            <div className="lm-success">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                ✅ Licence issued for {issuedKey.client_name}
              </div>
              <div style={{ fontSize: 10, marginBottom: 8, color: "#0F6E56" }}>
                Licence ID: <code>{issuedKey.licence_id}</code> · Expires: {issuedKey.expires_at} · Domain: {issuedKey.allowed_domain}
              </div>
              <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 600, color: "#085041" }}>
                📋 Copy this key and send to the client — it won't be shown again:
              </div>
              <div className="lm-key-box">
                {issuedKey.licence_key}
                <button className="lm-copy-btn" onClick={copyKey}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: "#0F6E56" }}>
                Client adds this to their <code>.env</code>: <code>NEXPLAN_LICENCE_KEY=eyJhbGci...</code>
              </div>
            </div>
          )}

          <div className="lm-card">
            <div className="lm-slbl">client details</div>
            <div className="lm-grid2">
              <div className="lm-fld">
                <div className="lm-fld-l">Client / Organisation name</div>
                <input className="lm-inp" placeholder="CITI BANK" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div className="lm-fld">
                <div className="lm-fld-l">Allowed domain</div>
                <input className="lm-inp" placeholder="nexplan.citibank.net" value={domain} onChange={e => setDomain(e.target.value)} />
                <div className="lm-fld-n">Without https:// · Container only works on this exact domain</div>
              </div>
            </div>

            <div className="lm-slbl">licence terms</div>
            <div className="lm-grid2">
              <div className="lm-fld">
                <div className="lm-fld-l">Plan</div>
                <select className="lm-sel" value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="starter">Starter (≤25 users)</option>
                  <option value="business">Business (≤100 users)</option>
                  <option value="enterprise">Enterprise (unlimited)</option>
                  <option value="datacenter">Data Center</option>
                </select>
              </div>
              <div className="lm-fld">
                <div className="lm-fld-l">Seats (users)</div>
                <input className="lm-inp" placeholder="250 (or -1 for unlimited)" value={seats} onChange={e => setSeats(e.target.value)} />
              </div>
              <div className="lm-fld">
                <div className="lm-fld-l">Duration (months)</div>
                <select className="lm-sel" value={months} onChange={e => setMonths(e.target.value)}>
                  <option value="1">1 month (trial)</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months (standard)</option>
                  <option value="24">24 months</option>
                </select>
              </div>
              <div className="lm-fld">
                <div className="lm-fld-l">Notes (internal only)</div>
                <input className="lm-inp" placeholder="e.g. PO#12345, signed on 13-Apr-2026" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="lm-slbl">features</div>
            <div className="lm-tog-row" onClick={() => setAiEnabled(!aiEnabled)}>
              <div className={`lm-tog ${aiEnabled ? "on" : ""}`}><div className="lm-tog-t"/></div>
              AI features enabled (uses Anthropic API or Ollama)
            </div>
            <div className="lm-tog-row" onClick={() => setAirGap(!airGap)}>
              <div className={`lm-tog ${airGap ? "on" : ""}`}><div className="lm-tog-t"/></div>
              Air-gap mode allowed (offline licence verification)
            </div>

            <button className="lm-btn" onClick={handleIssue} disabled={issuing || !clientName || !domain}>
              {issuing ? "⏳ Generating key…" : "🔑 Generate Licence Key"}
            </button>
          </div>
        </>
      )}

      {/* ── ALL LICENCES ── */}
      {tab === "licences" && (
        <div className="lm-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <div className="lm-slbl" style={{ margin: 0 }}>all issued licences ({licences.length})</div>
            <button className="lm-btn-sm" onClick={fetchLicences}>↻ Refresh</button>
          </div>
          {loadingLics ? (
            <div style={{ textAlign: "center", padding: 24, color: "#73726C", fontSize: 12 }}>Loading…</div>
          ) : licences.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "#73726C", fontSize: 12 }}>No licences issued yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="lm-tbl">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Domain</th>
                    <th>Plan</th>
                    <th>Seats</th>
                    <th>AI</th>
                    <th>Expiry</th>
                    <th>Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {licences.map(lic => {
                    const exp = expiryBadge(lic.expires_at);
                    return (
                      <tr key={lic.id}>
                        <td style={{ fontWeight: 600, color: "#1A1A18" }}>{lic.client_name}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 10, color: "#0F6E56" }}>{lic.allowed_domain}</td>
                        <td><span className="lm-badge" style={{ background: "#E6F1FB", color: "#0C447C" }}>{lic.plan}</span></td>
                        <td style={{ fontFamily: "monospace", fontSize: 10 }}>{lic.seats === -1 ? "∞" : lic.seats}</td>
                        <td><span style={{ color: lic.ai_enabled ? "#1D9E75" : "#E24B4A" }}>{lic.ai_enabled ? "✓" : "✗"}</span></td>
                        <td><span className="lm-badge" style={{ background: exp.bg, color: exp.color }}>{exp.label}</span></td>
                        <td style={{ fontFamily: "monospace", fontSize: 10, color: "#73726C" }}>
                          {new Date(lic.issued_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVATION LOGS ── */}
      {tab === "logs" && (
        <div className="lm-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <div className="lm-slbl" style={{ margin: 0 }}>recent activation logs</div>
            <button className="lm-btn-sm" onClick={fetchLogs}>↻ Refresh</button>
          </div>
          <div className="lm-info">
            Every time a client starts their Docker container, it checks in here. Failed checks mean their container didn't boot.
          </div>
          {loadingLogs ? (
            <div style={{ textAlign: "center", padding: 24, color: "#73726C", fontSize: 12 }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "#73726C", fontSize: 12 }}>No activations yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="lm-tbl">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Domain</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Version</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.client_name ?? "—"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 10 }}>{log.domain}</td>
                      <td>
                        <span className="lm-badge" style={{
                          background: log.success ? "#E1F5EE" : "#FCEBEB",
                          color:      log.success ? "#085041" : "#791F1F",
                        }}>
                          {log.success ? "✓ OK" : "✗ Failed"}
                        </span>
                      </td>
                      <td style={{ fontSize: 10, color: "#73726C" }}>{log.reason}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 10, color: "#73726C" }}>{log.app_version ?? "—"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 10, color: "#73726C" }}>
                        {new Date(log.activated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

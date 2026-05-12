import { useState, useEffect } from "react";

const STORAGE = { clients: "lf-clients-v1", cases: "lf-cases-v1" };
const CASE_TYPES = ["Civil Dispute", "Property / Real Estate", "Family / Matrimonial", "General / Mixed"];
const STATUSES = ["Pending", "In Progress", "Hearing Scheduled", "Awaiting Judgment", "Closed"];
const STATUS_META = {
  "Pending":           { color: "#e8a838", bg: "rgba(232,168,56,0.12)",  dot: "#e8a838" },
  "In Progress":       { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  dot: "#60a5fa" },
  "Hearing Scheduled": { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", dot: "#a78bfa" },
  "Awaiting Judgment": { color: "#f87171", bg: "rgba(248,113,113,0.12)", dot: "#f87171" },
  "Closed":            { color: "#34d399", bg: "rgba(52,211,153,0.12)",  dot: "#34d399" },
};

const FONT_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap";

// ─── tiny helpers ────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().split("T")[0];
const fmt = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const daysUntil = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d + "T00:00:00") - new Date()) / 86400000);
  return diff;
};

// ─── reusable UI ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] || {};
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20,
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", fontFamily:"'DM Sans',sans-serif" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background: m.dot, flexShrink:0 }} />
      {status}
    </span>
  );
}

function Input({ label, value, onChange, type="text", placeholder="", required=false, style={} }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, fontWeight:600, color:"#8899b0", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>
        {label}{required && <span style={{color:"#e8a838"}}> *</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:"#0d1b2a", border:"1px solid #1e3048", borderRadius:8, padding:"9px 12px",
          color:"#e8f0f8", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none",
          transition:"border 0.2s", ...style }}
        onFocus={e=>e.target.style.borderColor="#c9a84c"}
        onBlur={e=>e.target.style.borderColor="#1e3048"} />
    </div>
  );
}

function Select({ label, value, onChange, options, required=false }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, fontWeight:600, color:"#8899b0", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>
        {label}{required && <span style={{color:"#e8a838"}}> *</span>}
      </label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ background:"#0d1b2a", border:"1px solid #1e3048", borderRadius:8, padding:"9px 12px",
          color:"#e8f0f8", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", cursor:"pointer" }}
        onFocus={e=>e.target.style.borderColor="#c9a84c"}
        onBlur={e=>e.target.style.borderColor="#1e3048"}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder="" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, fontWeight:600, color:"#8899b0", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>{label}</label>
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3}
        style={{ background:"#0d1b2a", border:"1px solid #1e3048", borderRadius:8, padding:"9px 12px",
          color:"#e8f0f8", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" }}
        onFocus={e=>e.target.style.borderColor="#c9a84c"}
        onBlur={e=>e.target.style.borderColor="#1e3048"} />
    </div>
  );
}

function Modal({ title, onClose, onSave, saveLabel="Save", children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,10,18,0.85)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#0a1628", border:"1px solid #1e3048", borderRadius:16, width:"100%", maxWidth:560,
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 24px", borderBottom:"1px solid #1a2d45" }}>
          <h2 style={{ margin:0, fontSize:18, fontFamily:"'Playfair Display',serif", color:"#e8f0f8", fontWeight:600 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#8899b0", fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>{children}</div>
        <div style={{ padding:"16px 24px", borderTop:"1px solid #1a2d45", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:"1px solid #1e3048",
            background:"transparent", color:"#8899b0", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={onSave} style={{ padding:"9px 20px", borderRadius:8, border:"none",
            background:"linear-gradient(135deg,#c9a84c,#a07830)", color:"#0a1020", fontSize:13,
            fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function LawFirmDashboard() {
  const [view, setView]         = useState("dashboard");
  const [clients, setClients]   = useState([]);
  const [cases, setCases]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFS]   = useState("All");
  const [filterType, setFT]     = useState("All");
  const [clientModal, setCM]    = useState(null);
  const [caseModal, setCSM]     = useState(null);
  const [viewCase, setViewCase] = useState(null);
  const [sidebarOpen, setSidebar] = useState(true);

  // blank forms
  const blankClient = { name:"", phone:"", email:"", address:"" };
  const blankCase   = { clientId:"", caseTitle:"", caseNumber:"", caseType:CASE_TYPES[0],
    court:"", filingDate:"", status:"Pending", nextAction:"", nextHearingDate:"", notes:"" };
  const [cf, setCF] = useState(blankClient);
  const [csf, setCSF] = useState(blankCase);

  // inject fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = FONT_URL;
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `*{box-sizing:border-box}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#0a1628}::-webkit-scrollbar-thumb{background:#1e3048;border-radius:4px}`;
    document.head.appendChild(style);
  }, []);

  // load storage
  useEffect(() => {
    (async () => {
      try {
        const [cr, csr] = await Promise.all([
          window.storage.get(STORAGE.clients).catch(()=>null),
          window.storage.get(STORAGE.cases).catch(()=>null),
        ]);
        if (cr?.value)  setClients(JSON.parse(cr.value));
        if (csr?.value) setCases(JSON.parse(csr.value));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const persist = async (key, data) => {
    try { await window.storage.set(key, JSON.stringify(data)); } catch {}
  };

  const saveClients = async (data) => { setClients(data); await persist(STORAGE.clients, data); };
  const saveCases   = async (data) => { setCases(data);   await persist(STORAGE.cases, data);   };

  // client ops
  const handleSaveClient = async () => {
    if (!cf.name.trim()) return;
    if (clientModal?.id) {
      const u = clients.map(c => c.id === clientModal.id ? { ...c, ...cf } : c);
      await saveClients(u);
    } else {
      await saveClients([...clients, { ...cf, id: genId(), addedDate: today() }]);
    }
    setCM(null);
  };
  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client and all associated cases?")) return;
    await saveClients(clients.filter(c => c.id !== id));
    await saveCases(cases.filter(c => c.clientId !== id));
  };

  // case ops
  const handleSaveCase = async () => {
    if (!csf.caseTitle.trim() || !csf.clientId) return;
    if (caseModal?.id) {
      const u = cases.map(c => c.id === caseModal.id ? { ...c, ...csf, lastUpdated: today() } : c);
      await saveCases(u);
      if (viewCase?.id === caseModal.id) setViewCase({ ...viewCase, ...csf, lastUpdated: today() });
    } else {
      const nc = { ...csf, id: genId(), createdDate: today(), lastUpdated: today() };
      await saveCases([...cases, nc]);
    }
    setCSM(null);
  };
  const deleteCase = async (id) => {
    if (!window.confirm("Delete this case?")) return;
    await saveCases(cases.filter(c => c.id !== id));
    if (viewCase?.id === id) setViewCase(null);
  };

  const openAddClient = () => { setCF(blankClient); setCM({}); };
  const openEditClient = (cl) => { setCF({ name:cl.name, phone:cl.phone||"", email:cl.email||"", address:cl.address||"" }); setCM(cl); };
  const openAddCase = (clientId="") => { setCSF({ ...blankCase, clientId }); setCSM({}); };
  const openEditCase = (cs) => {
    setCSF({ clientId:cs.clientId, caseTitle:cs.caseTitle, caseNumber:cs.caseNumber||"",
      caseType:cs.caseType, court:cs.court||"", filingDate:cs.filingDate||"",
      status:cs.status, nextAction:cs.nextAction||"", nextHearingDate:cs.nextHearingDate||"", notes:cs.notes||"" });
    setCSM(cs);
  };

  const clientName = (id) => clients.find(c => c.id === id)?.name || "Unknown";
  const clientCases = (id) => cases.filter(c => c.clientId === id);

  // filtered cases
  const filtered = cases.filter(c => {
    const cl = clients.find(x => x.id === c.clientId);
    const q = search.toLowerCase();
    return (!q || c.caseTitle.toLowerCase().includes(q) || (cl?.name||"").toLowerCase().includes(q) || (c.caseNumber||"").toLowerCase().includes(q))
      && (filterStatus === "All" || c.status === filterStatus)
      && (filterType   === "All" || c.caseType === filterType);
  });

  // upcoming hearings
  const upcoming = [...cases]
    .filter(c => c.nextHearingDate && daysUntil(c.nextHearingDate) >= 0)
    .sort((a,b) => new Date(a.nextHearingDate) - new Date(b.nextHearingDate))
    .slice(0, 6);

  // stats
  const stats = {
    total: cases.length, clients: clients.length,
    pending: cases.filter(c=>c.status==="Pending").length,
    inProgress: cases.filter(c=>c.status==="In Progress").length,
    hearing: cases.filter(c=>c.status==="Hearing Scheduled").length,
    closed: cases.filter(c=>c.status==="Closed").length,
  };

  // ── STYLES ──
  const S = {
    app:    { display:"flex", height:"100vh", background:"#060e1a", fontFamily:"'DM Sans',sans-serif", color:"#e8f0f8", overflow:"hidden" },
    sidebar:{ width: sidebarOpen ? 220 : 60, background:"#07111f", borderRight:"1px solid #111f30",
              display:"flex", flexDirection:"column", transition:"width 0.25s", flexShrink:0, overflow:"hidden" },
    main:   { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
    header: { padding:"16px 24px", borderBottom:"1px solid #111f30", display:"flex", alignItems:"center",
              justifyContent:"space-between", background:"#07111f", flexShrink:0 },
    content:{ flex:1, overflowY:"auto", padding:"24px" },
    navItem:(active) => ({
      display:"flex", alignItems:"center", gap:12, padding:"11px 18px",
      cursor:"pointer", borderRadius:8, margin:"2px 8px",
      background: active ? "rgba(201,168,76,0.12)" : "transparent",
      color: active ? "#c9a84c" : "#6a7f95",
      fontWeight: active ? 600 : 400, fontSize:13, transition:"all 0.15s",
      borderLeft: active ? "2px solid #c9a84c" : "2px solid transparent",
      whiteSpace:"nowrap", overflow:"hidden",
    }),
    card: { background:"#0a1628", border:"1px solid #1a2d45", borderRadius:12, padding:"20px 22px" },
    btn: (v="primary") => ({
      padding:"9px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
      fontFamily:"'DM Sans',sans-serif", border:"none", transition:"opacity 0.15s",
      ...(v==="primary" ? { background:"linear-gradient(135deg,#c9a84c,#a07830)", color:"#07111f" }
        : v==="ghost"   ? { background:"transparent", color:"#8899b0", border:"1px solid #1e3048" }
        : v==="danger"  ? { background:"rgba(239,68,68,0.12)", color:"#f87171", border:"1px solid rgba(239,68,68,0.2)" }
        :                 { background:"#0d1b2a", color:"#c9a84c", border:"1px solid #2a3f58" })
    }),
    table: { width:"100%", borderCollapse:"collapse" },
    th: { textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:600, color:"#5a7090",
          letterSpacing:"0.06em", textTransform:"uppercase", borderBottom:"1px solid #1a2d45" },
    td: { padding:"12px 14px", fontSize:13, color:"#c8d8e8", borderBottom:"1px solid #0f1e2e" },
  };

  const NavIcon = ({ name }) => {
    const icons = { dashboard:"⬛", cases:"📋", clients:"👥", add:"＋" };
    return <span style={{fontSize:15}}>{icons[name]||"•"}</span>;
  };

  // ─── DASHBOARD VIEW ───────────────────────────────────────────────────────
  const DashboardView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:14 }}>
        {[
          { label:"Total Cases",   val:stats.total,      color:"#c9a84c" },
          { label:"Clients",       val:stats.clients,    color:"#60a5fa" },
          { label:"Pending",       val:stats.pending,    color:"#e8a838" },
          { label:"In Progress",   val:stats.inProgress, color:"#60a5fa" },
          { label:"Hearings",      val:stats.hearing,    color:"#a78bfa" },
          { label:"Closed",        val:stats.closed,     color:"#34d399" },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, textAlign:"center" }}>
            <div style={{ fontSize:32, fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.val}</div>
            <div style={{ fontSize:11, color:"#5a7090", marginTop:4, letterSpacing:"0.04em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        {/* upcoming hearings */}
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ margin:0, fontSize:15, fontFamily:"'Playfair Display',serif", color:"#e8f0f8" }}>
              ⚖ Upcoming Hearings
            </h3>
            <span style={{ fontSize:11, color:"#5a7090" }}>{upcoming.length} scheduled</span>
          </div>
          {upcoming.length === 0
            ? <p style={{ color:"#3a5070", fontSize:13, textAlign:"center", padding:"20px 0" }}>No upcoming hearings</p>
            : upcoming.map(c => {
                const d = daysUntil(c.nextHearingDate);
                return (
                  <div key={c.id} onClick={()=>setViewCase(c)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0",
                      borderBottom:"1px solid #0f1e2e", cursor:"pointer" }}>
                    <div style={{ width:44, height:44, borderRadius:10, background: d<=2?"rgba(248,113,113,0.12)":"rgba(167,139,250,0.1)",
                      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:15, fontWeight:700, color: d<=2?"#f87171":"#a78bfa", lineHeight:1 }}>{d}</span>
                      <span style={{ fontSize:9, color:"#5a7090" }}>days</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:"#c8d8e8", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.caseTitle}</div>
                      <div style={{ fontSize:11, color:"#5a7090", marginTop:2 }}>{clientName(c.clientId)} · {fmt(c.nextHearingDate)}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* recent cases */}
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ margin:0, fontSize:15, fontFamily:"'Playfair Display',serif", color:"#e8f0f8" }}>📋 Recent Cases</h3>
            <button onClick={()=>setView("cases")} style={{ ...S.btn("ghost"), padding:"5px 12px", fontSize:12 }}>View All</button>
          </div>
          {cases.length === 0
            ? <p style={{ color:"#3a5070", fontSize:13, textAlign:"center", padding:"20px 0" }}>No cases yet</p>
            : [...cases].sort((a,b) => b.lastUpdated?.localeCompare(a.lastUpdated)).slice(0,5).map(c => (
                <div key={c.id} onClick={()=>setViewCase(c)}
                  style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
                    padding:"10px 0", borderBottom:"1px solid #0f1e2e", cursor:"pointer" }}>
                  <div style={{ flex:1, minWidth:0, paddingRight:10 }}>
                    <div style={{ fontSize:13, color:"#c8d8e8", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.caseTitle}</div>
                    <div style={{ fontSize:11, color:"#5a7090", marginTop:2 }}>{clientName(c.clientId)}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
          }
        </div>
      </div>

      {/* pending actions */}
      <div style={S.card}>
        <h3 style={{ margin:"0 0 14px", fontSize:15, fontFamily:"'Playfair Display',serif", color:"#e8f0f8" }}>⏳ Pending Actions</h3>
        {cases.filter(c=>c.nextAction && c.status!=="Closed").length === 0
          ? <p style={{ color:"#3a5070", fontSize:13 }}>No pending actions</p>
          : (
            <table style={S.table}>
              <thead>
                <tr>
                  {["Client","Case","Pending Action","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {cases.filter(c=>c.nextAction&&c.status!=="Closed").map(c => (
                  <tr key={c.id} onClick={()=>setViewCase(c)} style={{cursor:"pointer"}}>
                    <td style={S.td}>{clientName(c.clientId)}</td>
                    <td style={S.td}>{c.caseTitle}</td>
                    <td style={{ ...S.td, color:"#e8a838" }}>{c.nextAction}</td>
                    <td style={S.td}><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );

  // ─── CASES VIEW ───────────────────────────────────────────────────────────
  const CasesView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search cases, clients…"
          style={{ flex:1, minWidth:180, background:"#0a1628", border:"1px solid #1a2d45", borderRadius:8,
            padding:"9px 14px", color:"#e8f0f8", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }} />
        <select value={filterStatus} onChange={e=>setFS(e.target.value)}
          style={{ background:"#0a1628", border:"1px solid #1a2d45", borderRadius:8,
            padding:"9px 12px", color:"#e8f0f8", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          <option>All</option>
          {STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFT(e.target.value)}
          style={{ background:"#0a1628", border:"1px solid #1a2d45", borderRadius:8,
            padding:"9px 12px", color:"#e8f0f8", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          <option>All</option>
          {CASE_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={()=>openAddCase()} style={S.btn("primary")}>+ Add Case</button>
      </div>

      {filtered.length === 0
        ? <div style={{ ...S.card, textAlign:"center", padding:"40px", color:"#3a5070" }}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div>No cases found</div>
          </div>
        : (
          <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
            <table style={S.table}>
              <thead style={{background:"#060e1a"}}>
                <tr>{["Client","Case Title","Type","Status","Next Hearing","Pending Action",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{cursor:"pointer"}} onClick={()=>setViewCase(c)}
                    onMouseEnter={e=>e.currentTarget.style.background="#0d1b2a"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{...S.td,fontWeight:500,color:"#e8f0f8"}}>{clientName(c.clientId)}</td>
                    <td style={S.td}>{c.caseTitle}{c.caseNumber && <span style={{fontSize:11,color:"#5a7090",display:"block"}}>#{c.caseNumber}</span>}</td>
                    <td style={{...S.td,fontSize:12,color:"#8899b0"}}>{c.caseType}</td>
                    <td style={S.td}><StatusBadge status={c.status} /></td>
                    <td style={{...S.td,fontSize:12}}>
                      {c.nextHearingDate ? (
                        <span style={{color: daysUntil(c.nextHearingDate)<=3?"#f87171":"#c8d8e8"}}>
                          {fmt(c.nextHearingDate)}
                          {daysUntil(c.nextHearingDate)<=3 && <span style={{fontSize:10,marginLeft:4,color:"#f87171"}}>Soon</span>}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{...S.td,color:"#e8a838",fontSize:12}}>{c.nextAction||"—"}</td>
                    <td style={S.td} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>openEditCase(c)} style={{...S.btn("ghost"),padding:"4px 10px",fontSize:11}}>Edit</button>
                        <button onClick={()=>deleteCase(c.id)} style={{...S.btn("danger"),padding:"4px 10px",fontSize:11}}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );

  // ─── CLIENTS VIEW ─────────────────────────────────────────────────────────
  const ClientsView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={openAddClient} style={S.btn("primary")}>+ Add Client</button>
      </div>
      {clients.length === 0
        ? <div style={{ ...S.card, textAlign:"center", padding:"40px", color:"#3a5070" }}>
            <div style={{fontSize:32,marginBottom:8}}>👥</div>
            <div>No clients yet. Add your first client.</div>
          </div>
        : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {clients.map(cl => {
              const cc = clientCases(cl.id);
              const activeCases = cc.filter(c=>c.status!=="Closed").length;
              return (
                <div key={cl.id} style={{ ...S.card, display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:16, fontWeight:600, color:"#e8f0f8", fontFamily:"'Playfair Display',serif" }}>{cl.name}</div>
                      <div style={{ fontSize:11, color:"#5a7090", marginTop:2 }}>Since {fmt(cl.addedDate)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:20, fontWeight:700, color:"#c9a84c", fontFamily:"'Playfair Display',serif" }}>{cc.length}</div>
                      <div style={{ fontSize:10, color:"#5a7090" }}>cases</div>
                    </div>
                  </div>
                  {(cl.phone||cl.email) && (
                    <div style={{ fontSize:12, color:"#6a8090", display:"flex", flexDirection:"column", gap:3 }}>
                      {cl.phone && <span>📞 {cl.phone}</span>}
                      {cl.email && <span>✉ {cl.email}</span>}
                      {cl.address && <span>📍 {cl.address}</span>}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {activeCases > 0 && <span style={{ padding:"3px 10px", background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderRadius:20, fontSize:11 }}>{activeCases} active</span>}
                    {cc.filter(c=>c.status==="Closed").length > 0 && <span style={{ padding:"3px 10px", background:"rgba(52,211,153,0.1)", color:"#34d399", borderRadius:20, fontSize:11 }}>{cc.filter(c=>c.status==="Closed").length} closed</span>}
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:4 }}>
                    <button onClick={()=>openAddCase(cl.id)} style={{...S.btn("secondary"),flex:1,padding:"7px 0",fontSize:12}}>+ Case</button>
                    <button onClick={()=>openEditClient(cl)} style={{...S.btn("ghost"),padding:"7px 14px",fontSize:12}}>Edit</button>
                    <button onClick={()=>deleteClient(cl.id)} style={{...S.btn("danger"),padding:"7px 10px",fontSize:12}}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );

  // ─── CASE DETAIL PANEL ────────────────────────────────────────────────────
  const CaseDetail = ({ cs }) => {
    const latest = cases.find(c=>c.id===cs.id) || cs;
    return (
      <div style={{ position:"fixed", right:0, top:0, height:"100vh", width:400, background:"#07111f",
        borderLeft:"1px solid #1a2d45", zIndex:500, overflowY:"auto", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"18px 20px", borderBottom:"1px solid #1a2d45", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h3 style={{ margin:0, fontSize:15, fontFamily:"'Playfair Display',serif" }}>Case Details</h3>
          <button onClick={()=>setViewCase(null)} style={{...S.btn("ghost"),padding:"4px 10px",fontSize:13}}>✕</button>
        </div>
        <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:16, flex:1 }}>
          <div>
            <div style={{ fontSize:19, fontWeight:700, fontFamily:"'Playfair Display',serif", color:"#e8f0f8", lineHeight:1.3 }}>{latest.caseTitle}</div>
            {latest.caseNumber && <div style={{ fontSize:12, color:"#5a7090", marginTop:4 }}>Case No: {latest.caseNumber}</div>}
          </div>
          <StatusBadge status={latest.status} />
          {[
            { label:"Client",         val: clientName(latest.clientId) },
            { label:"Case Type",      val: latest.caseType },
            { label:"Court",          val: latest.court },
            { label:"Filing Date",    val: fmt(latest.filingDate) },
            { label:"Next Hearing",   val: fmt(latest.nextHearingDate), highlight: latest.nextHearingDate && daysUntil(latest.nextHearingDate)<=3 },
            { label:"Last Updated",   val: fmt(latest.lastUpdated) },
          ].map(row => row.val && row.val!=="—" ? (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #0f1e2e" }}>
              <span style={{ fontSize:12, color:"#5a7090" }}>{row.label}</span>
              <span style={{ fontSize:13, color: row.highlight?"#f87171":"#c8d8e8", fontWeight:500 }}>{row.val}</span>
            </div>
          ) : null)}
          {latest.nextAction && (
            <div style={{ background:"rgba(232,168,56,0.08)", border:"1px solid rgba(232,168,56,0.2)", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:11, color:"#e8a838", fontWeight:600, letterSpacing:"0.06em", marginBottom:6 }}>PENDING ACTION</div>
              <div style={{ fontSize:13, color:"#e8f0f8" }}>{latest.nextAction}</div>
            </div>
          )}
          {latest.notes && (
            <div>
              <div style={{ fontSize:11, color:"#5a7090", fontWeight:600, letterSpacing:"0.06em", marginBottom:6 }}>NOTES</div>
              <div style={{ fontSize:13, color:"#c8d8e8", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{latest.notes}</div>
            </div>
          )}
        </div>
        <div style={{ padding:"16px 20px", borderTop:"1px solid #1a2d45", display:"flex", gap:8 }}>
          <button onClick={()=>{ openEditCase(latest); setViewCase(null); }} style={{...S.btn("primary"),flex:1}}>Edit Case</button>
          <button onClick={()=>deleteCase(latest.id)} style={{...S.btn("danger"),padding:"9px 14px"}}>Delete</button>
        </div>
      </div>
    );
  };

  const viewTitles = { dashboard:"Dashboard", cases:"All Cases", clients:"Clients" };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh",
      background:"#060e1a", color:"#c9a84c", fontFamily:"'Playfair Display',serif", fontSize:"1.3rem" }}>
      Loading chambers…
    </div>
  );

  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={{ padding:"18px 14px 10px", borderBottom:"1px solid #111f30", marginBottom:8 }}>
          {sidebarOpen ? (
            <div>
              <div style={{ fontSize:16, fontFamily:"'Playfair Display',serif", color:"#c9a84c", fontWeight:700, lineHeight:1.2 }}>Chambers</div>
              <div style={{ fontSize:10, color:"#3a5070", marginTop:2, letterSpacing:"0.06em" }}>CASE MANAGER</div>
            </div>
          ) : <div style={{fontSize:18,textAlign:"center"}}>⚖</div>}
        </div>
        {[
          { id:"dashboard", label:"Dashboard", icon:"🏛" },
          { id:"cases",     label:"Cases",     icon:"📋" },
          { id:"clients",   label:"Clients",   icon:"👥" },
        ].map(item => (
          <div key={item.id} onClick={()=>setView(item.id)} style={S.navItem(view===item.id)}>
            <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </div>
        ))}
        <div style={{ flex:1 }} />
        {sidebarOpen && (
          <div style={{ padding:"12px 16px", borderTop:"1px solid #111f30", fontSize:11, color:"#2a4060" }}>
            {stats.total} cases · {stats.clients} clients
          </div>
        )}
        <div onClick={()=>setSidebar(!sidebarOpen)}
          style={{ padding:"12px 16px", cursor:"pointer", color:"#3a5070", fontSize:18, textAlign: sidebarOpen?"right":"center",
            borderTop:"1px solid #111f30" }}>
          {sidebarOpen ? "◀" : "▶"}
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.header}>
          <h1 style={{ margin:0, fontSize:20, fontFamily:"'Playfair Display',serif", color:"#e8f0f8", fontWeight:600 }}>
            {viewTitles[view]}
          </h1>
          <div style={{ display:"flex", gap:8 }}>
            {view==="cases"   && <button onClick={()=>openAddCase()}   style={S.btn("primary")}>+ New Case</button>}
            {view==="clients" && <button onClick={openAddClient}        style={S.btn("primary")}>+ New Client</button>}
            {view==="dashboard" && <button onClick={()=>openAddCase()} style={S.btn("primary")}>+ New Case</button>}
          </div>
        </div>
        <div style={S.content}>
          {view==="dashboard" && <DashboardView />}
          {view==="cases"     && <CasesView />}
          {view==="clients"   && <ClientsView />}
        </div>
      </div>

      {/* CASE DETAIL PANEL */}
      {viewCase && <CaseDetail cs={viewCase} />}

      {/* CLIENT MODAL */}
      {clientModal !== null && (
        <Modal title={clientModal?.id ? "Edit Client" : "Add New Client"}
          onClose={()=>setCM(null)} onSave={handleSaveClient}>
          <Input label="Full Name" value={cf.name} onChange={v=>setCF({...cf,name:v})} required placeholder="e.g. Ramesh Kumar Sharma" />
          <Input label="Phone" value={cf.phone} onChange={v=>setCF({...cf,phone:v})} placeholder="+91 98765 43210" />
          <Input label="Email" value={cf.email} onChange={v=>setCF({...cf,email:v})} type="email" placeholder="client@example.com" />
          <Input label="Address" value={cf.address} onChange={v=>setCF({...cf,address:v})} placeholder="City, State" />
        </Modal>
      )}

      {/* CASE MODAL */}
      {caseModal !== null && (
        <Modal title={caseModal?.id ? "Edit Case" : "Add New Case"}
          onClose={()=>setCSM(null)} onSave={handleSaveCase}>
          <Select label="Client" value={csf.clientId} onChange={v=>setCSF({...csf,clientId:v})}
            options={["", ...clients.map(c=>c.id)].map(id => id)} required />
          {/* show names */}
          <div style={{ marginTop:-10 }}>
            <select value={csf.clientId} onChange={e=>setCSF({...csf,clientId:e.target.value})}
              style={{ width:"100%", background:"#0d1b2a", border:"1px solid #1e3048", borderRadius:8,
                padding:"9px 12px", color: csf.clientId?"#e8f0f8":"#5a7090", fontSize:13,
                fontFamily:"'DM Sans',sans-serif", outline:"none" }}>
              <option value="">— Select Client *</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Case Title" value={csf.caseTitle} onChange={v=>setCSF({...csf,caseTitle:v})} required placeholder="e.g. Property Dispute — Sharma vs Kumar" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Case Number" value={csf.caseNumber} onChange={v=>setCSF({...csf,caseNumber:v})} placeholder="e.g. CS/123/2024" />
            <Select label="Case Type" value={csf.caseType} onChange={v=>setCSF({...csf,caseType:v})} options={CASE_TYPES} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Court / Forum" value={csf.court} onChange={v=>setCSF({...csf,court:v})} placeholder="e.g. Gauhati High Court" />
            <Select label="Status" value={csf.status} onChange={v=>setCSF({...csf,status:v})} options={STATUSES} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Filing Date" value={csf.filingDate} onChange={v=>setCSF({...csf,filingDate:v})} type="date" />
            <Input label="Next Hearing Date" value={csf.nextHearingDate} onChange={v=>setCSF({...csf,nextHearingDate:v})} type="date" />
          </div>
          <Input label="Pending Action / Next Step" value={csf.nextAction} onChange={v=>setCSF({...csf,nextAction:v})} placeholder="e.g. File written submissions by Friday" />
          <Textarea label="Notes" value={csf.notes} onChange={v=>setCSF({...csf,notes:v})} placeholder="Any additional notes, documents needed, client instructions…" />
        </Modal>
      )}
    </div>
  );
}

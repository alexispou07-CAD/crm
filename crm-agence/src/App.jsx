import React, { useState, useEffect, useMemo } from "react";
import { Plus, X, Mail, Phone, Clock, ChevronRight, Trash2, User, LogOut } from "lucide-react";

const SUPABASE_URL = "https://iwqokzqtbyxsfbxyauoj.supabase.co";
const SUPABASE_KEY = "sb_publishable_HrklaTc7GNLChVpYewxEgA_dpxPQuJ3";

const STAGES = [
  { key: "nouveau", label: "Nouveau", color: "#E8A33D" },
  { key: "contacte", label: "Contacté", color: "#7DA9C9" },
  { key: "qualifie", label: "Qualifié", color: "#B98FD1" },
  { key: "client", label: "Client", color: "#5FA37B" },
  { key: "perdu", label: "Perdu", color: "#6B7280" },
];

const SOURCES = ["Site web", "Référence", "Réseaux sociaux", "Publicité", "Autre"];

// --- Validation anti faux courriel / faux téléphone ---
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FAKE_LOCALS = ["test", "asdf", "admin", "none", "na", "xxx", "fake", "sample", "user", "email", "abc", "asd", "qwerty", "nom", "exemple", "example", "faux"];
const FAKE_DOMAINS = ["test.com", "example.com", "fake.com", "mail.com", "email.com", "none.com", "test.test", "asdf.com", "xyz.com", "domain.com", "exemple.com", "aaa.com"];
const isAllSameChar = (s) => /^(.)\1*$/.test(s);
const isSequential = (s) => "abcdefghijklmnopqrstuvwxyz".includes(s.toLowerCase()) || "0123456789".includes(s);

const isValidEmail = (v) => {
  if (!v.trim()) return true;
  const val = v.trim().toLowerCase();
  if (!EMAIL_RE.test(val)) return false;
  const [local, domain] = val.split("@");
  const domainRoot = domain.split(".")[0];
  if (local === domainRoot) return false;
  if (FAKE_LOCALS.includes(local)) return false;
  if (FAKE_DOMAINS.includes(domain)) return false;
  if (isAllSameChar(local)) return false;
  if (isSequential(local) && local.length >= 3) return false;
  return true;
};

const isValidPhone = (v) => {
  if (!v.trim()) return true;
  const digits = v.replace(/\D/g, "");
  const norm = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (norm.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(norm)) return false;
  if (norm === "1234567890" || norm === "0123456789") return false;
  if (norm.startsWith("0") || norm.startsWith("1")) return false;
  return true;
};

// --- Petit client Supabase maison (fetch direct, pas de SDK dispo dans l'artefact) ---
const authHeaders = (token) => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${token || SUPABASE_KEY}`,
  "Content-Type": "application/json",
});

async function signUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || "Erreur d'inscription");
  return data;
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || "Courriel ou mot de passe invalide");
  return data;
}

async function apiGet(path, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Erreur de lecture");
  return res.json();
}

async function apiPost(path, body, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erreur d'écriture");
  return res.json();
}

async function apiPatch(path, body, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erreur de mise à jour");
  return res.json();
}

async function apiDelete(path, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error("Erreur de suppression");
}

const inputStyle = (hasError) => ({
  width: "100%", background: "#12141C", border: `1px solid ${hasError ? "#D9705A" : "#2A2E3A"}`,
  borderRadius: "6px", padding: "9px 10px", color: "#F5F3EE", fontSize: "13px", boxSizing: "border-box",
});

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const submit = async () => {
    setError(""); setInfo(""); setBusy(true);
    try {
      if (mode === "signup") {
        const data = await signUp(email, password);
        if (data.access_token) {
          onAuthed({ token: data.access_token, email });
        } else {
          setInfo("Compte créé. Vérifie ta boîte courriel pour confirmer, puis connecte-toi.");
          setMode("signin");
        }
      } else {
        const data = await signIn(email, password);
        onAuthed({ token: data.access_token, email });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "#12141C", color: "#F5F3EE", minHeight: "500px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui", borderRadius: "12px" }}>
      <div style={{ width: "320px", maxWidth: "90vw" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8A33D", fontWeight: 600, marginBottom: "6px" }}>
          Centre de suivi
        </div>
        <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px" }}>
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input placeholder="Courriel" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle(false)} />
          <input type="password" placeholder="Mot de passe (6+ caractères)" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle(false)} />
          {error && <div style={{ fontSize: "12px", color: "#D9705A" }}>{error}</div>}
          {info && <div style={{ fontSize: "12px", color: "#5FA37B" }}>{info}</div>}
          <button onClick={submit} disabled={busy || !email || password.length < 6}
            style={{ background: "#E8A33D", color: "#12141C", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
            {busy ? "..." : mode === "signin" ? "Se connecter" : "Créer le compte"}
          </button>
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}
            style={{ background: "none", border: "none", color: "#9298A8", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}>
            {mode === "signin" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const [session, setSession] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeName, setActiveName] = useState(null);
  const [activeNotes, setActiveNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: SOURCES[0] });
  const [errors, setErrors] = useState({});

  const loadLeads = async (token) => {
    setLoading(true); setLoadError("");
    try {
      const data = await apiGet("Leads?select=*&order=created_at.desc", token);
      setLeads(data);
    } catch (e) {
      setLoadError("Impossible de charger les leads. " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadLeads(session.token);
  }, [session]);

  const counts = useMemo(() => {
    const c = {};
    STAGES.forEach((s) => (c[s.key] = 0));
    leads.forEach((l) => (c[l.Stage] = (c[l.Stage] || 0) + 1));
    return c;
  }, [leads]);

  const total = leads.length || 1;
  const active = leads.find((l) => l.name === activeName);

  useEffect(() => {
    if (!active || !session) { setActiveNotes([]); return; }
    apiGet(`Notes?lead_id=eq.${encodeURIComponent(active.name)}&order=created_at.desc`, session.token).then(setActiveNotes).catch(() => setActiveNotes([]));
  }, [activeName, session]);

  const addLead = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Le nom est requis";
    if (!isValidEmail(form.email)) errs.email = "Format de courriel invalide";
    if (!isValidPhone(form.phone)) errs.phone = "Format de téléphone invalide (10 chiffres)";
    if (!form.email.trim() && !form.phone.trim()) {
      errs.email = "Courriel ou téléphone requis";
      errs.phone = "Courriel ou téléphone requis";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const [created] = await apiPost("Leads", {
        name: form.name.trim(), email: form.email.trim(), Phone: form.phone.trim(),
        Source: form.source, Stage: "nouveau",
      }, session.token);
      setLeads([created, ...leads]);
      setForm({ name: "", email: "", phone: "", source: SOURCES[0] });
      setErrors({});
      setShowForm(false);
    } catch (e) {
      setErrors({ name: "Erreur d'enregistrement : " + e.message });
    }
  };

  const moveStage = async (name, dir) => {
    const lead = leads.find((l) => l.name === name);
    const idx = STAGES.findIndex((s) => s.key === lead.Stage);
    const nextIdx = Math.min(STAGES.length - 1, Math.max(0, idx + dir));
    const nextStage = STAGES[nextIdx].key;
    setLeads(leads.map((l) => (l.name === name ? { ...l, Stage: nextStage } : l)));
    try { await apiPatch(`Leads?name=eq.${encodeURIComponent(name)}`, { Stage: nextStage }, session.token); } catch (e) { /* silencieux, déjà mis à jour visuellement */ }
  };

  const setStage = async (name, stage) => {
    setLeads(leads.map((l) => (l.name === name ? { ...l, Stage: stage } : l)));
    try { await apiPatch(`Leads?name=eq.${encodeURIComponent(name)}`, { Stage: stage }, session.token); } catch (e) {}
  };

  const deleteLead = async (name) => {
    setLeads(leads.filter((l) => l.name !== name));
    if (activeName === name) setActiveName(null);
    try { await apiDelete(`Leads?name=eq.${encodeURIComponent(name)}`, session.token); } catch (e) {}
  };

  const addNote = async () => {
    if (!noteText.trim() || !active) return;
    try {
      const [created] = await apiPost("Notes", { lead_id: active.name, text: noteText.trim() }, session.token);
      setActiveNotes([created, ...activeNotes]);
      setNoteText("");
    } catch (e) {}
  };

  const fmtDate = (ts) => new Date(ts).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
  const stageOf = (key) => STAGES.find((s) => s.key === key) || STAGES[0];

  if (!session) return <AuthScreen onAuthed={setSession} />;

  return (
    <div style={{ background: "#12141C", color: "#F5F3EE", fontFamily: "ui-sans-serif, system-ui, sans-serif", minHeight: "700px", padding: "28px 24px", borderRadius: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8A33D", fontWeight: 600, marginBottom: "6px" }}>
            Pipeline de leads · {session.email}
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>Centre de suivi</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#E8A33D", color: "#12141C", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
            <Plus size={16} /> Nouveau lead
          </button>
          <button onClick={() => setSession(null)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#20242F", color: "#9298A8", border: "1px solid #2A2E3A", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", cursor: "pointer" }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {loading && <div style={{ fontSize: "13px", color: "#9298A8", marginBottom: "12px" }}>Chargement des leads…</div>}
      {loadError && <div style={{ fontSize: "13px", color: "#D9705A", marginBottom: "12px" }}>{loadError}</div>}

      <div style={{ display: "flex", height: "10px", borderRadius: "6px", overflow: "hidden", marginBottom: "8px", background: "#20242F" }}>
        {STAGES.map((s) => (
          <div key={s.key} style={{ width: `${(counts[s.key] / total) * 100}%`, background: s.color, transition: "width 0.3s ease" }} title={`${s.label}: ${counts[s.key]}`} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "26px", fontSize: "12px", color: "#9298A8" }}>
        {STAGES.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, display: "inline-block" }} />
            {s.label} · {counts[s.key]}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "8px" }}>
        {STAGES.map((stage, colIdx) => (
          <div key={stage.key} style={{ minWidth: "230px", flex: "1 1 230px", background: "#1A1D28", borderRadius: "10px", border: "1px solid #2A2E3A", padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #2A2E3A" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: stage.color, display: "inline-block" }} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{stage.label}</span>
              <span style={{ fontSize: "12px", color: "#6B7280", marginLeft: "auto" }}>{counts[stage.key]}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {leads.filter((l) => l.Stage === stage.key).map((lead) => (
                <div key={lead.name} onClick={() => setActiveName(lead.name)} style={{ background: "#20242F", border: "1px solid #2A2E3A", borderRadius: "8px", padding: "10px", cursor: "pointer" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>{lead.name}</div>
                  <div style={{ fontSize: "11px", color: "#9298A8", marginBottom: "8px" }}>{lead.Source}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#6B7280" }}>{fmtDate(lead.created_at)}</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {colIdx > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); moveStage(lead.name, -1); }} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", padding: "2px", transform: "rotate(180deg)" }}>
                          <ChevronRight size={14} />
                        </button>
                      )}
                      {colIdx < STAGES.length - 1 && (
                        <button onClick={(e) => { e.stopPropagation(); moveStage(lead.name, 1); }} style={{ background: "none", border: "none", color: "#E8A33D", cursor: "pointer", padding: "2px" }}>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {leads.filter((l) => l.Stage === stage.key).length === 0 && (
                <div style={{ fontSize: "12px", color: "#4B5060", padding: "8px 2px" }}>Aucun lead ici</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowForm(false)}>
          <div style={{ background: "#1A1D28", border: "1px solid #2A2E3A", borderRadius: "12px", padding: "22px", width: "360px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Ajouter un lead</div>
              <button onClick={() => { setShowForm(false); setErrors({}); }} style={{ background: "none", border: "none", color: "#9298A8", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle(errors.name)} />
                {errors.name && <div style={{ fontSize: "11px", color: "#D9705A", marginTop: "4px" }}>{errors.name}</div>}
              </div>
              <div>
                <input placeholder="Courriel" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle(errors.email)} />
                {errors.email && <div style={{ fontSize: "11px", color: "#D9705A", marginTop: "4px" }}>{errors.email}</div>}
              </div>
              <div>
                <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle(errors.phone)} />
                {errors.phone && <div style={{ fontSize: "11px", color: "#D9705A", marginTop: "4px" }}>{errors.phone}</div>}
              </div>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={inputStyle(false)}>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={addLead} style={{ background: "#E8A33D", color: "#12141C", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer", marginTop: "6px" }}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {active && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 40 }} onClick={() => setActiveName(null)}>
          <div style={{ background: "#1A1D28", width: "340px", maxWidth: "90vw", height: "100%", padding: "22px", overflowY: "auto", borderLeft: "1px solid #2A2E3A" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>{active.name}</div>
                <div style={{ fontSize: "12px", color: stageOf(active.Stage).color, marginTop: "4px" }}>{stageOf(active.Stage).label}</div>
              </div>
              <button onClick={() => setActiveName(null)} style={{ background: "none", border: "none", color: "#9298A8", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#C7CBD6", marginBottom: "18px" }}>
              {active.email && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail size={14} color="#6B7280" /> {active.email}</div>}
              {active.Phone && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Phone size={14} color="#6B7280" /> {active.Phone}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><User size={14} color="#6B7280" /> Source : {active.Source}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Clock size={14} color="#6B7280" /> Créé le {fmtDate(active.created_at)}</div>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280" }}>Changer l'étape</label>
              <select value={active.Stage} onChange={(e) => setStage(active.name, e.target.value)} style={{ ...inputStyle(false), marginTop: "6px" }}>
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>Historique</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
              {activeNotes.length === 0 && <div style={{ fontSize: "12px", color: "#4B5060" }}>Aucune note pour l'instant</div>}
              {activeNotes.map((n) => (
                <div key={n.id} style={{ background: "#20242F", border: "1px solid #2A2E3A", borderRadius: "8px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: "#6B7280", marginBottom: "4px" }}>{fmtDate(n.created_at)}</div>
                  <div style={{ fontSize: "13px", color: "#E4E6EB" }}>{n.text}</div>
                </div>
              ))}
            </div>

            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ajouter une note (appel, courriel, suivi...)"
              style={{ ...inputStyle(false), minHeight: "70px", resize: "vertical", marginBottom: "8px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={addNote} style={{ flex: 1, background: "#E8A33D", color: "#12141C", border: "none", borderRadius: "8px", padding: "9px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                Ajouter la note
              </button>
              <button onClick={() => deleteLead(active.name)} style={{ background: "#20242F", border: "1px solid #2A2E3A", color: "#D9705A", borderRadius: "8px", padding: "9px 12px", cursor: "pointer" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

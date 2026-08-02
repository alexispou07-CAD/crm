import React, { useState } from "react";
import { Mail, Phone, User, MapPin, CheckCircle2 } from "lucide-react";

const SUPABASE_URL = "https://iwqokzqtbyxsfbxyauoj.supabase.co";
const SUPABASE_KEY = "sb_publishable_HrklaTc7GNLChVpYewxEgA_dpxPQuJ3";

const VARIANTS = {
  default: {
    heading: "Parlons de ton projet",
    subtitle: "Laisse-nous tes coordonnées, on te recontacte rapidement.",
    source: "Page de capture",
    role: null,
    showAddress: false,
    thanks: "On a bien reçu tes coordonnées. Quelqu'un va te recontacter très bientôt.",
  },
  estimation: {
    heading: "Estimation gratuite de ma propriété",
    subtitle: "Dis-nous-en un peu plus, un agent te recontacte avec une estimation.",
    source: "Page de capture - Estimation",
    role: "vendeur",
    showAddress: true,
    thanks: "On a bien reçu ta demande. Un agent te recontacte avec ton estimation très bientôt.",
  },
  location: {
    heading: "Faire une demande de location",
    subtitle: "Laisse-nous tes coordonnées, on te recontacte pour organiser une visite.",
    source: "Page de capture - Location",
    role: "locataire",
    showAddress: false,
    thanks: "On a bien reçu ta demande. On te recontacte très bientôt pour organiser une visite.",
  },
};

// --- Même validation anti faux courriel / faux téléphone que le CRM ---
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

const inputStyle = (hasError) => ({
  width: "100%", background: "#1A1D28", border: `1px solid ${hasError ? "#D9705A" : "#2A2E3A"}`,
  borderRadius: "8px", padding: "13px 14px", color: "#F5F3EE", fontSize: "15px", boxSizing: "border-box",
});

export default function CaptureForm({ variant = "default" }) {
  const config = VARIANTS[variant] || VARIANTS.default;
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Ton nom est requis";
    if (!isValidEmail(form.email)) errs.email = "Format de courriel invalide";
    if (!isValidPhone(form.phone)) errs.phone = "Format de téléphone invalide";
    if (!form.email.trim() && !form.phone.trim()) {
      errs.email = "Courriel ou téléphone requis";
      errs.phone = "Courriel ou téléphone requis";
    }
    if (config.showAddress && !form.address.trim()) errs.address = "L'adresse est requise";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Leads`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          Phone: form.phone.trim(),
          Source: config.source,
          Stage: "nouveau",
          role: config.role,
          address: config.showAddress ? form.address.trim() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur d'envoi");
      setStatus("done");
    } catch (err) {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div style={{ background: "#12141C", color: "#F5F3EE", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <CheckCircle2 size={44} color="#5FA37B" style={{ marginBottom: "16px" }} />
          <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Merci !</div>
          <div style={{ fontSize: "14px", color: "#9298A8" }}>{config.thanks}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#12141C", color: "#F5F3EE", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui", padding: "24px" }}>
      <form onSubmit={submit} style={{ width: "380px", maxWidth: "100%" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8A33D", fontWeight: 600, marginBottom: "10px", textAlign: "center" }}>
          Nebelon
        </div>
        <div style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px", textAlign: "center", letterSpacing: "-0.02em" }}>
          {config.heading}
        </div>
        <div style={{ fontSize: "14px", color: "#9298A8", marginBottom: "28px", textAlign: "center" }}>
          {config.subtitle}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#9298A8" }}>
              <User size={13} /> Nom
            </div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle(errors.name)} placeholder="Ton nom complet" />
            {errors.name && <div style={{ fontSize: "12px", color: "#D9705A", marginTop: "4px" }}>{errors.name}</div>}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#9298A8" }}>
              <Mail size={13} /> Courriel
            </div>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle(errors.email)} placeholder="toi@courriel.com" />
            {errors.email && <div style={{ fontSize: "12px", color: "#D9705A", marginTop: "4px" }}>{errors.email}</div>}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#9298A8" }}>
              <Phone size={13} /> Téléphone
            </div>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle(errors.phone)} placeholder="514-555-0123" />
            {errors.phone && <div style={{ fontSize: "12px", color: "#D9705A", marginTop: "4px" }}>{errors.phone}</div>}
          </div>

          {config.showAddress && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#9298A8" }}>
                <MapPin size={13} /> Adresse de la propriété
              </div>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle(errors.address)} placeholder="123 rue Principale, Montréal" />
              {errors.address && <div style={{ fontSize: "12px", color: "#D9705A", marginTop: "4px" }}>{errors.address}</div>}
            </div>
          )}

          {status === "error" && <div style={{ fontSize: "13px", color: "#D9705A" }}>Une erreur est survenue, réessaie.</div>}

          <button type="submit" disabled={status === "sending"}
            style={{ marginTop: "8px", background: "#E8A33D", color: "#12141C", border: "none", borderRadius: "8px", padding: "13px", fontWeight: 700, fontSize: "15px", cursor: status === "sending" ? "default" : "pointer", opacity: status === "sending" ? 0.7 : 1 }}>
            {status === "sending" ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </form>
    </div>
  );
}

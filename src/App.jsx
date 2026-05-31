import React, { useState, useMemo, useEffect } from "react";
import {
  Search, ArrowUpDown, X, Cpu, Boxes, Gauge, AlertTriangle, Pencil, Check,
  TrendingDown, TrendingUp, Layers, MapPin, Clock, ShieldAlert, Info, Loader2
} from "lucide-react";
import { loadData, updateRequirement } from "./lib/api";

/* ============================================================================
   io.net GPU Matchmaker — internal tool
   Design: io.net Brand Guidelines v1.0 — Cloud Blue #3179FF (data/coverage),
   Intelligence Violet #972EF9 (scoring), Core Graphite #060606 base.
   Type: Geist (display) / Mona Sans (body).

   GOING LIVE (the only change): this file talks to a `dataLayer` object.
   In preview it's backed by the seed arrays below. To host, replace the local
   dataLayer with the Supabase one:
       import { loadData, updateRequirement } from "./lib/api";
       const dataLayer = { loadData, updateRequirement };
   Scoring/matching stay client-side & auditable — identical to the SQL views.
   ============================================================================ */

const C = {
  bg: "#060606", bg2: "#0c0c0e", panel: "#131313", panel2: "#1E1E1F",
  line: "#2c2c2e", lineSoft: "#242425",
  text: "#FBFBFF", textSoft: "#ECEDFF", muted: "#97979B", faint: "#67686A",
  cloud: "#3179FF", cloudSoft: "#95B9FF", cloud200: "#D0DFFF",
  iris: "#972EF9", irisSoft: "#CB96FC", iris200: "#E4D0FE",
  good: "#34d399", okay: "#f5b544", warn: "#fb923c", bad: "#f87171",
  altRow: "#0f0f10",
};
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Mona+Sans:wght@300;400;500;600;700&display=swap');
`;
const display = { fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif" };

const SEED_REQUIREMENTS = [
  { id: 1, client: "", model: "B300", ff: null, gpus: 512, target: 3.90, sell: null, location: "US / Global", availability: "Flexible", term: "24 or 36 mo", prepay: 0.20, priority: "High", status: "Active", notes: "Target $3.90/GPU/hr; 24 or 36 mo preferred", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 2, client: "", model: "B200", ff: null, gpus: 1024, target: 3.30, sell: null, location: "US / India", availability: "ASAP", term: "12 mo", prepay: 0.25, priority: "High", status: "Active", notes: "128-node block; 1-yr contract", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 3, client: "", model: "H100", ff: "SXM", gpus: 256, target: 1.80, sell: null, location: "Flexible", availability: "ASAP", term: "12 mo", prepay: 0.20, priority: "Medium", status: "Pipeline", notes: "32-node block; SXM preferred", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 4, client: "", model: "H200", ff: "SXM", gpus: 512, target: 2.00, sell: null, location: "Flexible", availability: "ASAP", term: "12 mo", prepay: 0.20, priority: "High", status: "Active", notes: "Target ~$2/GPU/hr; 64 nodes", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 5, client: "", model: "MI355X", ff: null, gpus: 1024, target: null, sell: null, location: "Flexible", availability: "Evaluating", term: "12 mo", prepay: null, priority: "Medium", status: "Evaluating", notes: "Pricing unknown; open to quotes", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 6, client: "hardik@clusterbid.com", model: "H200", ff: "SXM", gpus: 256, target: 2.20, sell: 2.55, location: "US", availability: "ASAP", term: "TBD", prepay: null, priority: "High", status: "Active", notes: "Healthcare startup; US-required", blacklist: ["Hydra Host", "GMI", "Yota Labs", "Mass Compute", "Voltage Park", "Tiger EU"], updated_at: "2026-05-28T21:00:00Z" },
  { id: 7, client: "hardik@clusterbid.com", model: "H200", ff: "SXM", gpus: 128, target: 2.40, sell: 2.75, location: "Flexible", availability: "ASAP", term: "6 mo", prepay: null, priority: "High", status: "Active", notes: "Partially funded; premium ok to $2.40", blacklist: ["Hydra Host", "GMI", "Yota Labs", "Mass Compute", "Voltage Park", "Tiger EU"], updated_at: "2026-05-28T21:00:00Z" },
  { id: 8, client: "hardik@clusterbid.com", model: "H200", ff: "SXM", gpus: 512, target: 2.20, sell: 2.55, location: "Flexible", availability: "ASAP", term: "TBD", prepay: null, priority: "Medium", status: "Pipeline", notes: "Rigid on $2.20/GPU-hr", blacklist: ["Hydra Host", "GMI", "Yota Labs", "Mass Compute", "Voltage Park", "Tiger EU"], updated_at: "2026-05-28T21:00:00Z" },
  { id: 9, client: "hardik@clusterbid.com", model: "B300", ff: null, gpus: 1000, target: null, sell: null, location: "Flexible", availability: "Flexible", term: "36 mo", prepay: null, priority: "Medium", status: "Pipeline", notes: "1000 cards; 4-week deadline; 36-mo IB", blacklist: ["Hydra Host", "GMI", "Yota Labs", "Mass Compute", "Voltage Park", "Tiger EU"], updated_at: "2026-05-28T21:00:00Z" },
  { id: 10, client: "", model: "B300", ff: null, gpus: 512, target: 4.20, sell: null, location: "Flexible", availability: "ASAP", term: "12 mo", prepay: null, priority: "Medium", status: "Pipeline", notes: "1yr IB; confirm per GPU/hr vs node/hr", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 11, client: "Dough Keeny", model: "B200", ff: null, gpus: 512, target: 3.60, sell: 4.20, location: "Flexible", availability: "ASAP", term: "2-3 yr pref", prepay: 0.325, priority: "High", status: "Active", notes: "US/EU pref, ME ok; 30-35% prepay", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 12, client: "Dough Keeny", model: "H100", ff: "SXM", gpus: 128, target: 1.70, sell: 2.10, location: "US/EU", availability: "ASAP", term: "1 yr pref", prepay: 0.30, priority: "High", status: "Active", notes: "Open to 2yr if pricing improves", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 13, client: "justin@cloudless.dev", model: "B200", ff: null, gpus: 512, target: 2.00, sell: 2.50, location: "US/EU", availability: "Flexible", term: "12 mo", prepay: 0.25, priority: "High", status: "Active", notes: "", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 14, client: "justin@cloudless.dev", model: "H100", ff: "SXM", gpus: 1024, target: 1.70, sell: 2.10, location: "US / Global", availability: "Flexible", term: "12 mo", prepay: 0.20, priority: "Medium", status: "Pipeline", notes: "", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
  { id: 15, client: "justin@cloudless.dev", model: "H200", ff: "SXM", gpus: 160, target: 2.20, sell: 2.60, location: "Flexible", availability: "Flexible", term: "12 mo", prepay: 0.20, priority: "Medium", status: "Pipeline", notes: "", blacklist: [], updated_at: "2026-05-28T21:00:00Z" },
];
const SEED_INVENTORY = [
  { id: 1, provider: "Arc Compute", model: "B200", ff: null, gpus: 32, buy: 3.63, down: 0.20, term: "3 yr", availRaw: "~4 Weeks", lead: 4, location: "US", score: 8, notes: "$3.60-3.65 range" },
  { id: 2, provider: "Exascale", model: "B200", ff: null, gpus: null, buy: 3.70, down: null, term: "3 yr", availRaw: "3rd week May", lead: 26, location: "India", score: 9, notes: "Node count TBC" },
  { id: 3, provider: "CUDO Compute", model: "B200", ff: null, gpus: 1024, buy: 3.90, down: null, term: "2 yr", availRaw: "mid May", lead: 26, location: "US", score: 7, notes: "" },
  { id: 4, provider: "Parasail", model: "B200", ff: null, gpus: 80, buy: 6.01, down: null, term: "—", availRaw: "Immediate", lead: 0, location: "US", score: 3, notes: "Tranche 1 — expensive" },
  { id: 5, provider: "Parasail", model: "B200", ff: null, gpus: 944, buy: 6.01, down: null, term: "12 mo", availRaw: "6 weeks", lead: 6, location: "US", score: 4, notes: "Tranche 2 — expensive" },
  { id: 6, provider: "Arc Compute", model: "B300", ff: null, gpus: 512, buy: 3.70, down: null, term: "3 yr", availRaw: "7 weeks", lead: 7, location: "US", score: 9, notes: "" },
  { id: 7, provider: "Nodestream", model: "B300", ff: null, gpus: 1024, buy: 3.70, down: 0.20, term: "3 yr", availRaw: "6-wk lead", lead: 6, location: "US", score: 9, notes: "" },
  { id: 8, provider: "Ciracircle", model: "B300", ff: null, gpus: 576, buy: 3.75, down: null, term: "—", availRaw: "TBD", lead: 26, location: "US", score: 5, notes: "Alt: 144 nodes" },
  { id: 9, provider: "Ciracircle", model: "B300", ff: null, gpus: 1152, buy: 3.75, down: null, term: "—", availRaw: "TBD", lead: 26, location: "US", score: 5, notes: "144-node option" },
  { id: 10, provider: "ICN", model: "B300", ff: null, gpus: 512, buy: 3.90, down: null, term: "2 yr", availRaw: "4 wks (RoCE)", lead: 4, location: "US", score: 6, notes: "RoCE 4wk / IB 12wk" },
  { id: 11, provider: "Avkone Cloud", model: "B300", ff: null, gpus: null, buy: 4.49, down: null, term: "2 yr", availRaw: "3rd week June", lead: 26, location: "EU", score: 6, notes: "IB; node count TBC" },
  { id: 12, provider: "CUDO Compute", model: "B300", ff: null, gpus: 576, buy: 4.65, down: null, term: "2 yr", availRaw: "mid May", lead: 26, location: "US", score: 4, notes: "" },
  { id: 13, provider: "Sestrece", model: "B300", ff: null, gpus: 1152, buy: 3.40, down: 0.30, term: "2/3 yr", availRaw: "~6 Weeks", lead: 6, location: "EU", score: 9, notes: "" },
  { id: 14, provider: "Daits", model: "B200", ff: null, gpus: 1024, buy: 3.08, down: 0.40, term: "24 mo", availRaw: "8 weeks", lead: 8, location: "US", score: 8, notes: "" },
  { id: 15, provider: "FTP", model: "H100", ff: "SXM", gpus: 320, buy: 2.05, down: 0.20, term: "24 mo", availRaw: "Available Now", lead: 0, location: "Vietnam", score: 6, notes: "640 GB HBM3" },
  { id: 16, provider: "Tata Communication", model: "H200", ff: "SXM", gpus: 160, buy: 2.30, down: 0.30, term: "12 mo", availRaw: "Available Now", lead: 0, location: "India", score: 6, notes: "192 vCPU; 1,024 GB RAM" },
  { id: 17, provider: "Dataknox", model: "B200", ff: null, gpus: 1024, buy: 3.40, down: 0.40, term: "2 yr", availRaw: "~4 Weeks", lead: 4, location: "US", score: 7, notes: "2-yr term" },
  { id: 18, provider: "Dataknox", model: "B200", ff: null, gpus: 1024, buy: 3.30, down: 0.30, term: "3 yr", availRaw: "~4 Weeks", lead: 4, location: "US", score: 8, notes: "3-yr term" },
  { id: 19, provider: "Nodestream", model: "B300", ff: null, gpus: 1024, buy: 3.75, down: 0.25, term: "3 yr", availRaw: "~4 Weeks", lead: 4, location: "US", score: 7, notes: "GNR-SP 6740P" },
  { id: 20, provider: "FTP", model: "B300", ff: null, gpus: 512, buy: 5.20, down: 0.25, term: "1 yr", availRaw: "~2 Weeks", lead: 2, location: "Vietnam", score: 4, notes: "Dual 6th Gen Xeon; BF3 DPU" },
  { id: 21, provider: "Sestrece", model: "B300", ff: null, gpus: 1024, buy: 3.40, down: 0.35, term: "3 yr", availRaw: "~4 Weeks", lead: 4, location: "Lisbon, EU", score: 8, notes: "VAST ENODE 2PB; XDR 800G IB" },
  { id: 22, provider: "Hosted AI", model: "H100", ff: "SXM", gpus: 2048, buy: 1.85, down: 0.20, term: "1 yr", availRaw: "15th June", lead: 26, location: "US", score: 6, notes: "HGX NVSwitch; 8x CX7 NDR 400G" },
  { id: 23, provider: "ResetData", model: "GB300", ff: "NVL72", gpus: 1024, buy: 5.00, down: 0.30, term: "5 yr", availRaw: "Late 2026", lead: 26, location: "Australia", score: 2, notes: "142ms to US West; Grace Superchip" },
  { id: 24, provider: "ResetData", model: "H200", ff: "NVL", gpus: 512, buy: 2.40, down: 0.10, term: "On Request", availRaw: "On Request", lead: 26, location: "TBD", score: 5, notes: "4,096 cores; 204.8 Tb/s" },
  { id: 25, provider: "Yotta", model: "B200", ff: "HGX", gpus: 1024, buy: 3.80, down: 0.20, term: "36 mo", availRaw: "~6 Weeks", lead: 6, location: "India", score: 5, notes: "AI Enterprise License; EPYC 9575F" },
];

/* ---- data layer: Supabase reads + optimistic-concurrency writes (src/lib/api.js) ---- */
const dataLayer = { loadData, updateRequirement };

/* ---- scoring engine: Price 45% / Provider 30% / Availability 25% ---- */
const W = { price: 0.45, provider: 0.30, avail: 0.25 };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const locMatch = (reqLoc, invLoc) => {
  if (!reqLoc) return true;
  if (/flexible|global/i.test(reqLoc)) return true;
  if (!invLoc) return false;
  return reqLoc.toLowerCase().includes(invLoc.toLowerCase());
};
function scoreLine(req, i) {
  const delta = req.target != null && i.buy != null ? (i.buy - req.target) / req.target : null;
  const priceScore = delta == null ? 0.6 : clamp(1 - Math.max(0, delta) / 0.5, 0, 1);
  const provScore = (i.score != null ? i.score : 5) / 10;
  const availScore = clamp(1 - (i.lead != null ? i.lead : 26) / 12, 0, 1);
  const composite = Math.round(100 * (W.price * priceScore + W.provider * provScore + W.avail * availScore));
  return { delta, priceScore, provScore, availScore, composite, rec: recOf(composite) };
}
const recOf = c => (c >= 80 ? "Strong Buy" : c >= 65 ? "Buy" : c >= 45 ? "Watch" : "Avoid");
function candidatesFor(req, inventory) {
  return inventory
    .filter(i => i.model === req.model && (!req.ff || i.ff === req.ff) && locMatch(req.location, i.location) && !(req.blacklist || []).includes(i.provider))
    .map(i => ({ ...i, ...scoreLine(req, i) }))
    .sort((a, b) => b.composite - a.composite);
}
function rollup(req, inventory) {
  const candidates = candidatesFor(req, inventory);
  const matched = candidates.reduce((s, x) => s + (x.gpus || 0), 0);
  const coverage = req.gpus ? matched / req.gpus : 0;
  const best = candidates[0] || null;
  const status = candidates.length === 0 ? "No Supply" : matched >= req.gpus ? "Fully Covered" : "Partial Cover";
  return { candidates, matched, coverage, best, status, gap: req.gpus - matched };
}

const recColor = r => ({ "Strong Buy": C.good, Buy: C.cloud, Watch: C.okay, Avoid: C.bad, "No Supply": C.faint }[r] || C.faint);
const covColor = c => (c >= 1 ? C.good : c >= 0.5 ? C.okay : c > 0 ? C.warn : C.bad);
const fmt$ = v => (v == null ? "—" : "$" + v.toFixed(2));
const tier = r => r.model + (r.ff ? " " + r.ff : "");
const sinceTxt = iso => { const d = (Date.now() - new Date(iso)) / 86400000; return d < 1 ? "today" : Math.round(d) + "d ago"; };

function Pill({ text, color }) {
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
    style={{ color, backgroundColor: color + "1f", border: `1px solid ${color}55` }}>{text}</span>;
}
function Bar({ value, color, height = 6 }) {
  return <div className="w-full rounded-full overflow-hidden" style={{ background: C.lineSoft, height }}>
    <div style={{ width: `${clamp(value * 100, 0, 100)}%`, background: color, height: "100%", transition: "width .3s ease" }} />
  </div>;
}

export default function App() {
  const [requirements, setRequirements] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("demand");
  const [q, setQ] = useState("");
  const [fModel, setFModel] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [sortKey, setSortKey] = useState("coverage");
  const [sel, setSel] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [showWeights, setShowWeights] = useState(false);
  const [toast, setToast] = useState(null);

  // Loads from Supabase when env vars are configured; falls back to seed data otherwise.
  useEffect(() => {
    const isConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      !import.meta.env.VITE_SUPABASE_URL.includes("YOUR-PROJECT");
    let live = true;
    if (!isConfigured) {
      // No real DB yet — show seed data so the UI is fully functional immediately.
      setRequirements(SEED_REQUIREMENTS); setInventory(SEED_INVENTORY); setLoading(false);
      return;
    }
    dataLayer.loadData()
      .then(({ requirements, inventory }) => {
        if (!live) return;
        setRequirements(requirements); setInventory(inventory); setLoading(false);
      })
      .catch(err => {
        console.error("[GPUMatchmaker] loadData failed:", err);
        if (!live) return;
        setRequirements(SEED_REQUIREMENTS); setInventory(SEED_INVENTORY); setLoading(false);
      });
    return () => { live = false; };
  }, []);

  const rows = useMemo(() => requirements.map(r => ({ req: r, ...rollup(r, inventory) })), [requirements, inventory]);
  const models = ["All", ...Array.from(new Set(requirements.map(r => r.model)))];
  const statuses = ["All", "Active", "Pipeline", "Evaluating"];

  const filtered = useMemo(() => {
    let f = rows.filter(({ req }) =>
      (fModel === "All" || req.model === fModel) &&
      (fStatus === "All" || req.status === fStatus) &&
      (q === "" || (req.client + tier(req) + req.notes).toLowerCase().includes(q.toLowerCase())));
    const dir = sortKey === "client" ? 1 : -1;
    f.sort((a, b) => {
      const get = x => sortKey === "coverage" ? x.coverage : sortKey === "score" ? (x.best?.composite || 0)
        : sortKey === "gap" ? x.gap : sortKey === "required" ? x.req.gpus : x.req.client;
      const av = get(a), bv = get(b);
      return typeof av === "string" ? av.localeCompare(bv) * dir : (av - bv) * dir;
    });
    return f;
  }, [rows, q, fModel, fStatus, sortKey]);

  const active = rows.filter(r => r.req.status === "Active");
  const totDemand = active.reduce((s, r) => s + r.req.gpus, 0);
  const totMatched = active.reduce((s, r) => s + Math.min(r.matched, r.req.gpus), 0);
  const uncovered = rows.filter(r => r.status === "No Supply").length;
  const partial = rows.filter(r => r.status === "Partial Cover").length;

  function openEdit(req) { setDraft({ ...req }); setEditing(true); }
  async function saveEdit() {
    const cur = requirements.find(r => r.id === draft.id);
    const patch = {
      target: draft.target === "" || draft.target == null ? null : Number(draft.target),
      gpus: Number(draft.gpus), location: draft.location, ff: draft.ff || null,
      status: draft.status, priority: draft.priority,
      prepay: draft.prepay === "" || draft.prepay == null ? null : Number(draft.prepay),
    };
    try {
      // optimistic-concurrency token = the updated_at we loaded
      const saved = await dataLayer.updateRequirement(draft.id, patch, cur.updated_at);
      setRequirements(rs => rs.map(r => (r.id === draft.id ? { ...r, ...patch, updated_at: saved.updated_at } : r)));
      setEditing(false); setToast({ ok: true, msg: "Saved · scores recomputed" });
    } catch (e) {
      if (e.code === "CONFLICT") setToast({ ok: false, msg: "Edited by someone else — reload" });
      else setToast({ ok: false, msg: "Save failed" });
    }
    setTimeout(() => setToast(null), 2600);
  }

  const Th = ({ k, children, right }) => (
    <th className={`py-2.5 px-3 font-medium select-none ${k ? "cursor-pointer" : ""} ${right ? "text-right" : "text-left"}`}
      style={{ color: C.muted, fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase" }} onClick={() => k && setSortKey(k)}>
      <span className="inline-flex items-center gap-1">{children}{k && <ArrowUpDown size={10} style={{ opacity: sortKey === k ? 1 : .3 }} />}</span>
    </th>
  );
  const Field = ({ label, children }) => (
    <label className="block"><span className="text-xs" style={{ color: C.muted }}>{label}</span><div className="mt-1">{children}</div></label>
  );
  const inp = { background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 10px", width: "100%", outline: "none", fontSize: 13 };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Mona Sans', 'Geist', ui-sans-serif, system-ui, sans-serif", minHeight: "100%" }} className="text-sm">
      <style>{FONT_CSS}</style>

      {/* header with dual-spectrum glow + gradient divider */}
      <div className="relative px-6 pt-5 pb-4" style={{ overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, left: -60, width: 320, height: 240, background: C.cloud, filter: "blur(120px)", opacity: .18, borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: -120, right: -60, width: 320, height: 240, background: C.iris, filter: "blur(120px)", opacity: .18, borderRadius: "50%" }} />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2" style={display}>
              <span className="text-xl font-bold tracking-tight">io<span style={{ color: C.cloud }}>.</span>net</span>
              <span style={{ color: C.faint }}>/</span>
              <span className="text-xl font-semibold">GPU Matchmaker</span>
            </div>
            <div style={{ color: C.muted }} className="text-xs mt-1">Demand <span style={{ color: C.cloud }}>↔</span> supply · live coverage &amp; <span style={{ color: C.irisSoft }}>match scoring</span></div>
          </div>
          <button onClick={() => setShowWeights(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.irisSoft }}>
            <Info size={13} /> Scoring weights
          </button>
        </div>
        {showWeights && (
          <div className="relative mt-3 p-3 rounded-lg text-xs flex flex-wrap gap-x-6 gap-y-1" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <span style={{ color: C.muted }}>Match score, 0–100:</span>
            <span><b style={{ color: C.irisSoft }}>Price fit 45%</b> <span style={{ color: C.muted }}>(buy vs target; ≤target = full)</span></span>
            <span><b style={{ color: C.irisSoft }}>Provider 30%</b> <span style={{ color: C.muted }}>(quality /10)</span></span>
            <span><b style={{ color: C.irisSoft }}>Availability 25%</b> <span style={{ color: C.muted }}>(0 wks full, 12+ wks 0)</span></span>
            <span style={{ color: C.muted }}>→ ≥80 Strong Buy · 65 Buy · 45 Watch · else Avoid</span>
          </div>
        )}
        <div style={{ height: 2, marginTop: 14, background: `linear-gradient(90deg, ${C.cloud}, ${C.iris})`, borderRadius: 2 }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24" style={{ color: C.muted }}>
          <Loader2 size={16} className="animate-spin" /> Loading pipeline…
        </div>
      ) : (<>
        {/* stat cards */}
        <div className="px-6 py-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          {[
            { icon: Boxes, label: "Active demand", val: totDemand.toLocaleString() + " GPUs", accent: C.cloud },
            { icon: Gauge, label: "Matched (capped)", val: totMatched.toLocaleString() + " GPUs", accent: C.cloud },
            { icon: TrendingUp, label: "Active coverage", val: totDemand ? Math.round(100 * totMatched / totDemand) + "%" : "—", color: covColor(totMatched / totDemand) },
            { icon: Layers, label: "Partial cover", val: partial + " deals", color: C.okay },
            { icon: AlertTriangle, label: "No supply", val: uncovered + " deals", color: uncovered ? C.bad : C.good },
          ].map((s, i) => (
            <div key={i} className="p-3.5 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: s.accent ? `inset 0 1px 0 ${s.accent}22` : "none" }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><s.icon size={13} style={{ color: s.accent || s.color || C.muted }} />{s.label}</div>
              <div className="text-2xl font-bold mt-1" style={{ ...display, color: s.color || C.textSoft }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* tabs + filters */}
        <div className="px-6 flex items-center gap-2 flex-wrap">
          {[["demand", "Requirements", Cpu], ["supply", "Inventory", Boxes]].map(([k, label, Ic]) => (
            <button key={k} onClick={() => setTab(k)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: tab === k ? C.cloud : C.panel, color: tab === k ? "#fff" : C.muted, border: `1px solid ${tab === k ? C.cloud : C.line}` }}>
              <Ic size={14} />{label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <Search size={13} style={{ color: C.faint }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search client / model…"
              className="bg-transparent outline-none text-sm" style={{ color: C.text, width: 150 }} />
          </div>
          {tab === "demand" && <>
            <select value={fModel} onChange={e => setFModel(e.target.value)} className="px-2.5 py-1.5 rounded-lg text-sm outline-none"
              style={{ background: C.panel, color: C.text, border: `1px solid ${C.line}` }}>
              {models.map(m => <option key={m} style={{ background: C.panel }}>{m}</option>)}
            </select>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-1.5 rounded-lg text-sm outline-none"
              style={{ background: C.panel, color: C.text, border: `1px solid ${C.line}` }}>
              {statuses.map(s => <option key={s} style={{ background: C.panel }}>{s}</option>)}
            </select>
          </>}
        </div>

        {/* DEMAND */}
        {tab === "demand" && (
          <div className="px-6 py-3">
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead><tr style={{ background: C.panel2 }}>
                  <Th k="client">Client / Deal</Th><Th>Tier</Th><Th k="required" right>Req</Th>
                  <Th k="coverage">Coverage</Th><Th k="gap" right>Gap</Th><Th>Best provider</Th>
                  <Th right>Buy / Target</Th><Th k="score" right>Match</Th><Th>Recommendation</Th>
                </tr></thead>
                <tbody>
                  {filtered.map(({ req, coverage, gap, best, status }, idx) => (
                    <tr key={req.id} onClick={() => { setSel(req.id); setEditing(false); }} className="cursor-pointer"
                      style={{ background: idx % 2 ? C.altRow : "transparent", borderTop: `1px solid ${C.lineSoft}` }}>
                      <td className="py-2.5 px-3">
                        <div className="font-medium">{req.client || <span style={{ color: C.faint }}>Unassigned</span>}</div>
                        <div className="text-xs" style={{ color: C.faint }}>{req.priority} · {req.status}</div>
                      </td>
                      <td className="px-3"><span className="font-semibold" style={{ ...display, color: C.cloudSoft }}>{tier(req)}</span></td>
                      <td className="px-3 text-right tabular-nums">{req.gpus.toLocaleString()}</td>
                      <td className="px-3" style={{ minWidth: 130 }}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1"><Bar value={coverage} color={covColor(coverage)} /></div>
                          <span className="text-xs tabular-nums" style={{ color: covColor(coverage), width: 38 }}>{Math.round(coverage * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-3 text-right tabular-nums" style={{ color: gap > 0 ? C.warn : C.good }}>{gap > 0 ? gap.toLocaleString() : "—"}</td>
                      <td className="px-3">{best ? best.provider : <span style={{ color: C.faint }}>—</span>}</td>
                      <td className="px-3 text-right tabular-nums">
                        {best ? <span>{fmt$(best.buy)}<span style={{ color: C.faint }}> / {fmt$(req.target)}</span></span> : <span style={{ color: C.faint }}>—</span>}
                      </td>
                      <td className="px-3 text-right">
                        {best ? <span className="font-bold tabular-nums" style={{ ...display, color: recColor(best.rec) }}>{best.composite}</span> : <span style={{ color: C.faint }}>—</span>}
                      </td>
                      <td className="px-3"><Pill text={best ? best.rec : "No Supply"} color={recColor(best ? best.rec : "No Supply")} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUPPLY */}
        {tab === "supply" && (
          <div className="px-6 py-3">
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead><tr style={{ background: C.panel2 }}>
                  <Th>Provider</Th><Th>Tier</Th><Th right>GPUs</Th><Th right>Buy rate</Th>
                  <Th right>Score</Th><Th>Location</Th><Th>Lead</Th><Th right>Serves</Th>
                </tr></thead>
                <tbody>
                  {inventory.filter(i => q === "" || (i.provider + i.model).toLowerCase().includes(q.toLowerCase())).map((i, idx) => {
                    const serves = requirements.filter(r => candidatesFor(r, inventory).some(c => c.id === i.id)).length;
                    return (
                      <tr key={i.id} style={{ background: idx % 2 ? C.altRow : "transparent", borderTop: `1px solid ${C.lineSoft}` }}>
                        <td className="py-2.5 px-3 font-medium">{i.provider}<div className="text-xs" style={{ color: C.faint }}>{i.notes}</div></td>
                        <td className="px-3 font-semibold" style={{ ...display, color: C.cloudSoft }}>{i.model}{i.ff ? " " + i.ff : ""}</td>
                        <td className="px-3 text-right tabular-nums">{i.gpus ? i.gpus.toLocaleString() : "TBC"}</td>
                        <td className="px-3 text-right tabular-nums">{fmt$(i.buy)}</td>
                        <td className="px-3 text-right"><span className="font-semibold tabular-nums" style={{ color: i.score >= 8 ? C.good : i.score >= 5 ? C.okay : C.bad }}>{i.score}</span><span style={{ color: C.faint }}>/10</span></td>
                        <td className="px-3"><span className="inline-flex items-center gap-1" style={{ color: C.muted }}><MapPin size={11} />{i.location}</span></td>
                        <td className="px-3 text-xs" style={{ color: C.muted }}><span className="inline-flex items-center gap-1"><Clock size={11} />{i.availRaw}</span></td>
                        <td className="px-3 text-right tabular-nums" style={{ color: serves ? C.irisSoft : C.faint }}>{serves ? serves + " reqs" : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>)}

      {/* detail / edit drawer */}
      {sel != null && (() => {
        const r = rows.find(x => x.req.id === sel); if (!r) return null;
        const { req, candidates, coverage, gap, matched } = r;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,.6)" }} onClick={() => { setSel(null); setEditing(false); }}>
            <div className="h-full overflow-y-auto" style={{ width: "min(580px,100%)", background: C.bg2, borderLeft: `1px solid ${C.line}` }} onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 sticky top-0 z-10" style={{ background: C.bg2, borderBottom: `2px solid transparent`, borderImage: `linear-gradient(90deg, ${C.cloud}, ${C.iris}) 1` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-bold" style={display}>{req.client || "Unassigned"} · <span style={{ color: C.cloudSoft }}>{tier(req)}</span></div>
                    <div className="text-xs mt-0.5" style={{ color: C.muted }}>{req.gpus.toLocaleString()} GPUs · target {fmt$(req.target)}/hr · {req.location} · {req.term}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!editing && <button onClick={() => openEdit(req)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cloudSoft }}><Pencil size={12} /> Edit</button>}
                    <button onClick={() => { setSel(null); setEditing(false); }}><X size={20} style={{ color: C.muted }} /></button>
                  </div>
                </div>
                {!editing && <div className="flex gap-4 mt-3 text-xs">
                  <div><span style={{ color: C.muted }}>Coverage </span><b style={{ color: covColor(coverage) }}>{Math.round(coverage * 100)}%</b></div>
                  <div><span style={{ color: C.muted }}>Matched </span><b>{matched.toLocaleString()}</b></div>
                  <div><span style={{ color: C.muted }}>Gap </span><b style={{ color: gap > 0 ? C.warn : C.good }}>{gap > 0 ? gap.toLocaleString() : "covered"}</b></div>
                  <div><span style={{ color: C.muted }}>Edited </span><b style={{ color: C.muted }}>{sinceTxt(req.updated_at)}</b></div>
                </div>}
                {!editing && req.blacklist?.length > 0 && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs" style={{ color: C.warn }}>
                    <ShieldAlert size={13} className="mt-0.5 shrink-0" /><span>Avoiding: {req.blacklist.join(", ")}</span>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="p-5 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.faint }}>Edit deal</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Required GPUs"><input type="number" value={draft.gpus} onChange={e => setDraft({ ...draft, gpus: e.target.value })} style={inp} /></Field>
                    <Field label="Target $/GPU/hr"><input type="number" step="0.01" value={draft.target ?? ""} onChange={e => setDraft({ ...draft, target: e.target.value })} style={inp} /></Field>
                    <Field label="Location"><input value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} style={inp} /></Field>
                    <Field label="Form factor"><select value={draft.ff ?? ""} onChange={e => setDraft({ ...draft, ff: e.target.value })} style={inp}>{["", "SXM", "NVL", "HGX", "NVL72"].map(o => <option key={o} value={o} style={{ background: C.panel }}>{o || "any"}</option>)}</select></Field>
                    <Field label="Prepay %"><input type="number" step="0.05" value={draft.prepay ?? ""} onChange={e => setDraft({ ...draft, prepay: e.target.value })} style={inp} /></Field>
                    <Field label="Priority"><select value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value })} style={inp}>{["High", "Medium", "Low"].map(o => <option key={o} style={{ background: C.panel }}>{o}</option>)}</select></Field>
                    <Field label="Status"><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })} style={inp}>{["Active", "Pipeline", "Evaluating"].map(o => <option key={o} style={{ background: C.panel }}>{o}</option>)}</select></Field>
                  </div>
                  <div className="text-xs" style={{ color: C.faint }}>Saving writes only if no one edited this deal since you opened it (updated_at guard).</div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: C.cloud, color: "#fff" }}><Check size={15} /> Save</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: C.panel, color: C.muted, border: `1px solid ${C.line}` }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.faint }}>Ranked supply candidates</div>
                  {candidates.length === 0 && <div className="text-sm" style={{ color: C.muted }}>No matching inventory. Gap of {req.gpus.toLocaleString()} GPUs uncovered.</div>}
                  {candidates.map((c, i) => (
                    <div key={c.id} className="p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${i === 0 ? C.iris : C.line}`, boxShadow: i === 0 ? `0 0 0 1px ${C.iris}33` : "none" }}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: C.iris, color: "#fff" }}>TOP</span>}
                          <span className="font-semibold">{c.provider}</span>
                          <span className="text-xs" style={{ color: C.muted }}>{(c.gpus || 0).toLocaleString()} GPUs · {c.location} · {c.availRaw}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill text={c.rec} color={recColor(c.rec)} />
                          <span className="text-xl font-bold tabular-nums" style={{ ...display, color: recColor(c.rec) }}>{c.composite}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs" style={{ color: C.muted }}>
                        <span className="inline-flex items-center gap-1">
                          {fmt$(c.buy)}/hr
                          {c.delta != null && <span style={{ color: c.delta <= 0 ? C.good : C.warn }}>
                            {c.delta <= 0 ? <TrendingDown size={11} className="inline" /> : <TrendingUp size={11} className="inline" />} {(c.delta * 100).toFixed(0)}% vs target
                          </span>}
                        </span>
                        <span>Provider {c.score}/10 · {c.term}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2.5">
                        {[["Price", c.priceScore], ["Provider", c.provScore], ["Avail", c.availScore]].map(([lbl, v]) => (
                          <div key={lbl}>
                            <div className="flex justify-between text-xs mb-0.5"><span style={{ color: C.faint }}>{lbl}</span><span className="tabular-nums" style={{ color: C.muted }}>{Math.round(v * 100)}</span></div>
                            <Bar value={v} color={C.iris} height={4} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {req.notes && <div className="text-xs pt-1" style={{ color: C.faint }}><b>Notes:</b> {req.notes}</div>}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {toast && (
        <div className="fixed bottom-5 left-1/2 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{ transform: "translateX(-50%)", background: toast.ok ? C.panel : "#2a1416", color: toast.ok ? C.good : C.bad, border: `1px solid ${toast.ok ? C.good : C.bad}55`, zIndex: 60 }}>
          {toast.ok ? <Check size={15} /> : <AlertTriangle size={15} />}{toast.msg}
        </div>
      )}

      <div className="px-6 py-4 text-xs flex items-center justify-between" style={{ color: C.faint, borderTop: `1px solid ${C.line}` }}>
        <span style={display}>io<span style={{ color: C.cloud }}>.</span>net · Internal · Not for Distribution</span>
        <span>Coverage &amp; scores computed live from current inventory</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// 🔌 Backend API base
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");

function iso(d) {
  return d.toISOString().slice(0, 10);
}
function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat().format(n);
}

// ======================================================
// Admin page root: access guard + dashboard body
// ======================================================
export default function AdminDashboardPage() {
  const t = useTranslations("auth.admin");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [allowed, setAllowed] = useState(false);

  // 1) Verify current user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/auth/whoami`, { credentials: "include" });
        if (!r.ok) {
          if (r.status === 401) {
            router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          setAllowed(false);
          setAuthLoading(false);
          return;
        }
        const j = await r.json();
        if (cancelled) return;
        const rle = j.role || "";
        setRole(rle);
        setAllowed(rle === "admin");
      } catch (e) {
        router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
        return;
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, pathname, router]);

  if (authLoading) return <PageLoader label="Chargement du tableau de bord…" />;

  if (!allowed) {
    return (
      <div className="p-6">
        <Callout type="warn" title="Accès refusé">
          Ce tableau est réservé aux administrateurs (rôle actuel : <b>{role || "?"}</b>).
        </Callout>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-[#002147] text-center tracking-tight">
          {t("welcomeDashboard", { default: "Tableau de bord" })}
        </h1>
        <p className="text-[#002147]/80 text-center">
          {t("dashboardSubtitle", { default: "Synthèse des activités et tendances" })}
        </p>
      </div>
      <DashboardBody />
    </div>
  );
}

// ======================================================
// Dashboard body: filters + KPIs + series + loyal clients
// ======================================================
function DashboardBody() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return iso(d);
  });
  const [to, setTo] = useState(() => iso(new Date()));
  const [minOrders, setMinOrders] = useState(3);

  const [data, setData] = useState(null); // DashboardPayload
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [httpCode, setHttpCode] = useState(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams({ from, to, minOrders: String(minOrders), limit: "10" });
    return p.toString();
  }, [from, to, minOrders]);

  async function load() {
    setLoading(true);
    setError("");
    setHttpCode(null);
    try {
      const r = await fetch(`${BACKEND}/api/dashboard/overview?${qs}`, { credentials: "include" });
      setHttpCode(r.status);
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || `HTTP ${r.status}`);
      }
      const j = await r.json();
      setData(j);
    } catch (e) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  function quick(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setFrom(iso(start));
    setTo(iso(end));
  }

  // 🟦 color palette (navy brand)
  const C = {
    navy: "#002147",
    teal: "#00A6A6",
    amber: "#F59E0B",
    red: "#EF4444",
    sky: "#0EA5E9",
    slate: "#64748B",
    mint: "#34D399",
    violet: "#7C3AED",
  };

  const donutData = useMemo(() => {
    const k = data?.kpis || {};
    return [
      { name: "Commandes", value: k.ordersInRange || 0, color: C.sky },
      { name: "Clients", value: k.clientsInRange || 0, color: C.mint },
      { name: "Réclamations", value: k.claimsInRange || 0, color: C.red },
    ];
  }, [data]);

  const totalDonut = donutData.reduce((s, x) => s + (x.value || 0), 0);

  function exportLoyalCSV() {
    const rows = data?.loyalClients || [];
    const header = ["clientId", "name", "accountType", "orders", "lastOrder"];  
    const lines = [header.join(",")];
    rows.forEach((r) => {
      const typeLabel = r.accountType ? (r.accountType === "company" ? "Société" : r.accountType === "person" ? "Particulier" : r.accountType) : "-";
      lines.push([
        r.clientId,
        (r.name || "").replace(/,/g, " "),
        typeLabel.replace(/,/g, " "),
        r.orders,
        r.lastOrder,
      ].join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loyal-clients_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gradient-to-r from-[#002147] to-[#0b3e8b] text-white rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            <div>
              <label className="block text-xs/relaxed opacity-90 mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl px-3 py-2 bg-white text-[#002147] border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
            <div>
              <label className="block text-xs/relaxed opacity-90 mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl px-3 py-2 bg-white text-[#002147] border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
            <div>
              <label className="block text-xs/relaxed opacity-90 mb-1">Min orders (loyal)</label>
              <input
                type="number"
                min={1}
                value={minOrders}
                onChange={(e) => setMinOrders(+e.target.value || 1)}
                className="w-full rounded-xl px-3 py-2 bg-white text-[#002147] border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="mt-auto w-full rounded-xl px-4 py-2 bg-white text-[#002147] font-semibold border border-white/30 hover:bg-white/90 active:scale-[.99] transition"
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <QuickBtn onClick={() => quick(7)}>7j</QuickBtn>
            <QuickBtn onClick={() => quick(30)}>30j</QuickBtn>
            <QuickBtn onClick={() => quick(90)}>90j</QuickBtn>
          </div>
        </div>
      </div>

      {/* Route status messages */}
      {httpCode === 401 && (
        <Callout type="error" title="Non authentifié">Connecte-toi d'abord, puis réessaie.</Callout>
      )}
      {httpCode === 403 && (
        <Callout type="warn" title="Accès refusé">
          Ce tableau est réservé aux administrateurs. Vérifie que ton compte a le rôle <b>admin</b> et reconnecte-toi pour rafraîchir le jeton.
        </Callout>
      )}
      {error && httpCode !== 401 && httpCode !== 403 && (
        <Callout type="error" title="Erreur">{String(error)}</Callout>
      )}

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Total Clients"
          value={fmt(data?.kpis?.totalClients)}
          sub={`+${fmt(data?.kpis?.clientsInRange || 0)} sur la période`}
          accent="from-sky-500 to-blue-600"
        />
        <KpiCard
          title="Total Commandes"
          value={fmt(data?.kpis?.totalOrders)}
          sub={`+${fmt(data?.kpis?.ordersInRange || 0)} sur la période`}
          accent="from-emerald-500 to-teal-600"
        />
        <KpiCard
          title="Réclamations"
          value={fmt(data?.kpis?.totalClaims)}
          sub={`+${fmt(data?.kpis?.claimsInRange || 0)} sur la période`}
          accent="from-rose-500 to-red-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-4 gap-4">
        {/* Histogram: Orders/day */}
        <Card title="Commandes / jour" className="xl:col-span-2">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.series?.ordersByDay || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis width={36} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, "Commandes"]} />
                  <Legend verticalAlign="top" height={24} />
                  <Bar dataKey="count" name="Cmd" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Area: New clients/day */}
        <Card title="Nouveaux clients / jour">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series?.newClientsByDay || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis width={36} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, "Clients"]} />
                  <Area type="monotone" dataKey="count" stroke="#0EA5E9" fill="url(#gradClients)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Donut: Mix in period */}
        <Card title="Mix sur la période">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {donutData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
            </div>
          )}
        </Card>
      </div>

      {/* Second charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Réclamations / jour">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.series?.claimsByDay || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis width={36} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, "Réclam."]} />
                  <Line type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title={`Clients fidèles (≥ ${minOrders} commandes)`} actions={<button onClick={exportLoyalCSV} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50">Exporter CSV</button>}>
          <div className="overflow-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-white border-b">
                  <Th>Client</Th>
                  <Th>Type de compte</Th>
                  <Th className="text-right">Commandes</Th>
                
                  <Th>Dernière commande</Th>
                </tr>
              </thead>
              <tbody>
                {(data?.loyalClients || []).map((r, i) => (
                  <tr key={r.clientId + i} className="border-b last:border-b-0 hover:bg-gray-50/60">
                    <Td>{r.name || r.clientId}</Td>
                    <Td>{r.accountType ? (r.accountType === "company" ? "Société" : r.accountType === "person" ? "Particulier" : r.accountType) : "-"}</Td>
                    <Td className="text-right">{fmt(r.orders)}</Td>
                    
                    <Td>{r.lastOrder ? new Date(r.lastOrder).toLocaleString() : "-"}</Td>
                  </tr>
                ))}
                {!data?.loyalClients?.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">Aucun client fidèle sur la période</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- UI building blocks ----------
function Card({ title, actions, className = "", children }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}
function Th({ className = "", children }) {
  return <th className={`py-2 pr-3 text-left text-xs font-semibold text-slate-600 ${className}`}>{children}</th>;
}
function Td({ className = "", children }) {
  return <td className={`py-2 pr-3 ${className}`}>{children}</td>;
}

function KpiCard({ title, value, sub, accent = "from-sky-500 to-blue-600" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white">
      <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${accent} opacity-20`} />
      <div className="p-4 relative">
        <div className="text-xs text-slate-500">{title}</div>
        <div className="text-3xl font-semibold mt-1 text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function Callout({ type = "info", title, children }) {
  const palette =
    type === "error"
      ? "bg-red-50 border-red-300 text-red-800"
      : type === "warn"
      ? "bg-amber-50 border-amber-300 text-amber-800"
      : "bg-blue-50 border-blue-300 text-blue-800";
  return (
    <div className={`rounded-xl border p-3 ${palette}`}>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function PageLoader({ label = "Chargement…" }) {
  return (
    <div className="p-6">
      <div className="animate-pulse grid gap-3">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return <div className="h-72 w-full animate-pulse rounded-xl bg-slate-100" />;
}

function QuickBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white/95 px-3 py-1.5 text-sm backdrop-blur transition"
    >
      {children}
    </button>
  );
}

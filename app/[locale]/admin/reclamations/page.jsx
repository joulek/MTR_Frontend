"use client";
import { useEffect, useMemo, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const fmtDateTime = (v) => {
  try {
    const d = new Date(v);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch { return "—"; }
};

export default function AdminReclamationsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND}/api/reclamations/admin`, { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.message || `HTTP ${res.status}`);
        setRows(data.data || []);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter(r =>
      (r.client || "").toLowerCase().includes(n) ||
      (r.email || "").toLowerCase().includes(n) ||
      (r.numero || "").toLowerCase().includes(n) ||
      (r.typeDoc || "").toLowerCase().includes(n) ||
      (r.nature || "").toLowerCase().includes(n)
    );
  }, [rows, q]);

  async function viewPdfById(id) {
    try {
      const res = await fetch(`${BACKEND}/api/reclamations/admin/${id}/pdf`, { credentials: "include" });
      if (!res.ok) return alert("Pièce jointe indisponible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Erreur à l'ouverture du PDF");
    }
  }

  async function viewDocByIndex(id, index) {
    try {
      const res = await fetch(`${BACKEND}/api/reclamations/admin/${id}/document/${index}`, { credentials: "include" });
      if (!res.ok) return alert("Pièce jointe indisponible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Erreur à l'ouverture de la pièce jointe");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B1E3A]">
          Réclamations
        </h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (client, email, n°, nature...)"
          className="w-full sm:w-[320px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm
                     shadow focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
        />
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-left">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:border-b [&>th]:border-gray-200">
              <th>Client</th><th>Email</th><th>Type Doc</th><th>N°</th><th>Date</th><th>PDF</th><th>Pièces jointes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Aucune réclamation.</td></tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r._id} className={i % 2 ? "bg-white" : "bg-gray-50/40"}>
                  <td className="px-4 py-3">{r.client || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.email || "—"}</td>
                  <td className="px-4 py-3 capitalize">{r.typeDoc?.replace("_", " ") || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{r.numero || "—"}</td>
                  <td className="px-4 py-3">{fmtDateTime(r.date)}</td>
                  <td className="px-4 py-3">
                    {r.pdf ? (
                      <button
                        onClick={() => viewPdfById(r._id)}
                        className="inline-flex items-center rounded-lg bg-[#002147] text-white px-3 py-1.5 text-xs font-medium hover:opacity-90"
                      >
                        Ouvrir PDF
                      </button>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-600 px-2.5 py-0.5 text-xs">
                        Aucun
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {Array.isArray(r.piecesJointes) && r.piecesJointes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {r.piecesJointes.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => viewDocByIndex(r._id, idx)}
                            className="inline-flex items-center rounded-full border border-[#0B1E3A]/20 px-2 py-0.5 text-[11px] hover:bg-[#0B1E3A]/5"
                            title={p.mimetype || ""}
                          >
                            {p.filename || `pj_${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    ) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

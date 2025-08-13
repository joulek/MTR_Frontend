// components/admin/devis/DevisGrilleList.jsx
"use client";
import { useEffect, useState, useCallback } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function DevisGrilleList() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setErr(""); setLoading(true);
      const res = await fetch(`${BACKEND}/api/admin/devis/grille`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || `Erreur (${res.status})`);
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openPdf(id) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/devis/grille/${id}/pdf`, {
        credentials: "include",
      });
      if (!res.ok) return alert("PDF indisponible.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { alert("Impossible d’ouvrir le PDF."); }
  }

  async function openDoc(id, index) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/devis/grille/${id}/document/${index}`, {
        credentials: "include",
      });
      if (!res.ok) return alert("Document indisponible.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { alert("Impossible d’ouvrir le document."); }
  }

  if (loading) return <p>Chargement…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">N°</th>
            <th className="px-3 py-2 text-left">Client</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">PDF</th>
            <th className="px-3 py-2 text-left">Docs</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id} className="border-t">
              <td className="px-3 py-2">{it.numero}</td>
              <td className="px-3 py-2">{it.user?.prenom} {it.user?.nom}</td>
              <td className="px-3 py-2">{new Date(it.createdAt).toLocaleString()}</td>
              <td className="px-3 py-2">
                {it.hasDemandePdf ? (
                  <button onClick={() => openPdf(it._id)} className="underline text-[#002147]">Ouvrir</button>
                ) : <span className="text-gray-500">Indispo</span>}
              </td>
              <td className="px-3 py-2">
                {(it.documents || []).length === 0 ? (
                  <span className="text-gray-500">—</span>
                ) : (
                  <ul className="space-y-1">
                    {it.documents.map((d, idx) => (
                      <li key={idx} className="flex gap-2 items-center">
                        <button
                          onClick={() => openDoc(it._id, d.index ?? idx)}
                          disabled={!d.hasData}
                          className={`underline ${d.hasData ? "text-[#002147]" : "text-gray-400 cursor-not-allowed"}`}
                        >
                          Ouvrir
                        </button>
                        <span className="truncate max-w-[220px]" title={d.filename}>{d.filename}</span>
                        <span className="text-xs text-gray-500">{d.mimetype} · {(d.size||0)} B</span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

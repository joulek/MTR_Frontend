"use client";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/Pagination"; // ✅ pagination commune
import { FiXCircle } from "react-icons/fi";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const fmtDateTime = (v) => {
  try {
    const d = new Date(v);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "—";
  }
};

export default function AdminReclamationsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ états de pagination (mêmes defaults que Catégories)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 🔸 ID de la ligne dont on ouvre le PDF (pour état du bouton)
  const [openingId, setOpeningId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND}/api/reclamations/admin`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.message || `HTTP ${res.status}`);
        setRows(Array.isArray(data.data) ? data.data : []);
        setPage(1); // ✅ reset page au (re)chargement
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ——— Recherche plein-texte sur toutes les colonnes
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;

    const contains = (txt) => String(txt ?? "").toLowerCase().includes(needle);

    return rows.filter((r) => {
      const dateStr = fmtDateTime(r.date);
      const pjNames = Array.isArray(r.piecesJointes)
        ? r.piecesJointes.map((p) => p?.filename || "").join(" ")
        : "";
      const hasPdf = r.pdf ? "pdf oui true disponible" : "pdf non false indisponible";
      return (
        contains(r.client) ||
        contains(r.email) ||
        contains(r.typeDoc?.replace("_", " ")) ||
        contains(r.numero) ||
        contains(dateStr) ||
        contains(pjNames) ||
        contains(hasPdf)
      );
    });
  }, [rows, q]);

  // ✅ pagination locale sur le résultat filtré
  const total = filtered.length;
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ✅ clamp page si l’utilisateur se retrouve hors bornes (ex: après recherche)
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [total, page, pageSize]);

  // ✅ retour à la page 1 quand on tape une recherche
  useEffect(() => {
    setPage(1);
  }, [q]);

  async function viewPdfById(id) {
    try {
      // 🔸 active l’état d’ouverture pour ce bouton
      setOpeningId(id);
      const res = await fetch(`${BACKEND}/api/reclamations/admin/${id}/pdf`, { credentials: "include" });
      if (!res.ok) {
        alert("Pièce jointe indisponible");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Erreur à l'ouverture du PDF");
    } finally {
      // 🔸 remet le bouton à l’état normal
      setOpeningId(null);
    }
  }

  async function viewDocByIndex(id, index) {
    try {
      const res = await fetch(`${BACKEND}/api/reclamations/admin/${id}/document/${index}`, {
        credentials: "include",
      });
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
    <div className="px-3 sm:px-6 lg:px-8 py-6">
      {/* Titre centré */}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1E3A] text-center">
        Gestion des Réclamations
      </h1>

      {/* Barre de recherche sous le titre */}
      <div className="mt-4 max-w-3xl mx-auto">
        <div className="relative w-full sm:w-[520px] mx-auto">
          {/* Icône recherche à gauche */}
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21 21l-3.8-3.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (client, email, type doc, n°, date, PDF, pièces jointes...)"
            className="w-full rounded-xl border border-gray-300 bg-white px-9 pr-9 py-2 text-sm text-[#0B1E3A]
                 shadow focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
            aria-label="Rechercher une réclamation"
          />

          {/* Icône cancel (❌) visible uniquement si saisie */}
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center
                                          h-6 w-6 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <FiXCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="p-4 text-left">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Client</div>
              </th>
              <th className="p-4 text-left">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Email</div>
              </th>
              <th className="p-4 text-left">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Type Doc</div>
              </th>
              <th className="p-4 text-left">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">N°</div>
              </th>
              <th className="p-4 text-left">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Date</div>
              </th>
              <th className="p-4 text-left">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">PDF</div>
              </th>
              <th className="p-4 text-left">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Pièces jointes</div>
              </th>
            </tr>
            <tr>
              <td colSpan={7}>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </td>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  Chargement…
                </td>
              </tr>
            ) : total === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  Aucune réclamation.
                </td>
              </tr>
            ) : (
              pageItems.map((r, i) => (
                <tr key={r._id} className={i % 2 ? "bg-white" : "bg-gray-50/40"}>
                  {/* Cercle jaune + nom client */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <span className="text-[#0B1E3A] font-medium">{r.client || "—"}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-700 break-all">{r.email || "—"}</td>
                  <td className="px-4 py-3 capitalize">{r.typeDoc?.replace("_", " ") || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{r.numero || "—"}</td>
                  <td className="px-4 py-3">{fmtDateTime(r.date)}</td>

                  <td className="px-4 py-3">
                    {r.pdf ? (
                      <button
                        onClick={() => viewPdfById(r._id)}
                        disabled={openingId === r._id}
                        className={`inline-flex items-center gap-1 rounded-full border border-[#0B1E3A]/20 
                                         px-2 py-0.5 text-[11px] transition ${
                                           openingId === r._id
                                             ? "bg-[#F7C600]/20 text-[#0B1E3A] cursor-wait animate-pulse"
                                             : "hover:bg-[#0B1E3A]/5"
                                         }`}
                      >
                        {openingId === r._id ? "Ouverture…" : "Ouvrir"}
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
                            title={p?.mimetype || ""}
                          >
                            {p?.filename || `pj_${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination + compteur */}
      <div className="px-1 sm:px-0">
        <div className="mt-2">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>
    </div>
  );
}

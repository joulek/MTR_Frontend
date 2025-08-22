"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Pagination from "@/components/Pagination";
import { FiSearch, FiXCircle } from "react-icons/fi";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// Conteneur identique aux autres listes
const WRAP = "mx-auto w-full max-w-4xl px-3 sm:px-4";

// Helpers
function shortDate(d) {
  try {
    const dt = new Date(d);
    return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "";
  }
}

export default function DevisGrilleList() {
  const t = useTranslations("devisGrille");

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Recherche
  const [q, setQ] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const load = useCallback(async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/admin/devis/grille`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || `Erreur (${res.status})`);
      setItems(data.items || []);
      setPage(1);
    } catch (e) {
      setErr(e.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtre local (N°, Client, Date)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => {
      const numero = String(it?.numero || "").toLowerCase();
      const client = `${it?.user?.prenom || ""} ${it?.user?.nom || ""}`.trim().toLowerCase();
      let dateStr = "";
      try { dateStr = new Date(it?.createdAt).toLocaleDateString().toLowerCase(); } catch {}
      return numero.includes(needle) || client.includes(needle) || dateStr.includes(needle);
    });
  }, [items, q]);

  // clamp si on dépasse après changement de taille / filtre
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length, page, pageSize]);

  // reset page à chaque saisie
  useEffect(() => { setPage(1); }, [q]);

  // sous-ensemble paginé
  const { pageItems, total } = useMemo(() => {
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { pageItems: filtered.slice(start, end), total };
  }, [filtered, page, pageSize]);

  // Ouverture PDF
  async function openPdf(id) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/devis/grille/${id}/pdf`, { credentials: "include" });
      if (!res.ok) return alert(t("errors.pdfUnavailable"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { alert(t("errors.pdfOpenError")); }
  }

  // Ouverture doc joint
  async function openDoc(id, index) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/devis/grille/${id}/document/${index}`, { credentials: "include" });
      if (!res.ok) return alert(t("errors.docUnavailable"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { alert(t("errors.docOpenError")); }
  }

  const colWidths = ["w-[150px]", "w-[200px]", "w-[170px]", "w-[90px]", "w-auto"];

  return (
    <div className="py-6 space-y-4">
      {/* Titre + Recherche */}
      <div className={WRAP}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B1E3A]">
            {t("title")}
          </h1>

          {/* Barre de recherche */}
          <div className="relative w-full sm:w-[300px]">
            <FiSearch aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchAria")}
              className="w-full rounded-lg border border-gray-300 bg-white px-8 pr-8 py-1.5 text-sm text-[#0B1E3A]
                         shadow focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label={t("clearSearch")}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center
                           h-5 w-5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <FiXCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {err && (
          <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700">
            {err}
          </p>
        )}
      </div>

      {/* Table */}
      <div className={WRAP}>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-6 bg-gray-100 rounded" />
            <div className="h-6 bg-gray-100 rounded" />
            <div className="h-6 bg-gray-100 rounded" />
          </div>
        ) : total === 0 ? (
          <p className="text-gray-500">{t("noData")}</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block">
              <div className="overflow-x-hidden">
                <table className="w-full table-fixed text-sm border-separate border-spacing-0">
                  <colgroup>{colWidths.map((w, i) => <col key={i} className={w} />)}</colgroup>

                  <thead>
                    <tr>
                      {[t("columns.number"), t("columns.client"), t("columns.date"), t("columns.pdf"), t("columns.attachments")].map((h) => (
                        <th key={h} className="p-2 text-left align-bottom">
                          <div className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">
                            {h}
                          </div>
                          <div className="mt-2 h-px w-full bg-gray-200" />
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="text-[#0B1E3A]">
                    {pageItems.map((it) => {
                      const hasPdf = !!it?.hasDemandePdf;
                      const docs = (it?.documents || [])
                        .map((d, idx) => ({ ...d, index: d.index ?? idx }))
                        .filter((d) => (d.hasData === undefined ? true : !!d.hasData));

                      return (
                        <tr key={it._id} className="hover:bg-[#0B1E3A]/[0.03] transition-colors">
                          {/* N° */}
                          <td className="p-2 align-top border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full bg-[#F7C600] shrink-0" />
                              <span className="font-mono whitespace-nowrap">{it.numero}</span>
                            </div>
                          </td>

                          {/* Client */}
                          <td className="p-2 align-top border-b border-gray-200">
                            <span className="block truncate" title={`${it.user?.prenom || ""} ${it.user?.nom || ""}`}>
                              {it.user?.prenom} {it.user?.nom}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="p-2 align-top border-b border-gray-200">
                            {shortDate(it.createdAt)}
                          </td>

                          {/* PDF */}
                          <td className="p-2 align-top border-b border-gray-200">
                            {hasPdf ? (
                              <button
                                onClick={() => openPdf(it._id)}
                                className="inline-flex items-center gap-1 rounded-full border border-[#0B1E3A]/20 px-2 py-0.5 text-[11px] hover:bg-[#0B1E3A]/5"
                              >
                                {t("open")}
                              </button>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>

                          {/* Fichiers joints */}
                          <td className="p-2 align-top border-b border-gray-200">
                            {docs.length === 0 ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {docs.map((d) => (
                                  <button
                                    key={d.index}
                                    onClick={() => openDoc(it._id, d.index)}
                                    className="inline-flex items-center gap-1 rounded-full border border-[#0B1E3A]/20 px-2 py-0.5 text-[11px] hover:bg-[#0B1E3A]/5"
                                  >
                                    {t("open")}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-gray-200">
              {pageItems.map((it) => {
                const hasPdf = !!it?.hasDemandePdf;
                const docs = (it?.documents || [])
                  .map((d, idx) => ({ ...d, index: d.index ?? idx }))
                  .filter((d) => (d.hasData === undefined ? true : !!d.hasData));

                return (
                  <div key={it._id} className="py-3">
                    <div className="flex items-center gap-2 text-[#0B1E3A]">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#F7C600] shrink-0" />
                      <span className="font-mono">{it.numero}</span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">{t("columns.client")}</p>
                        <p className="truncate">{it.user?.prenom} {it.user?.nom}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500">{t("columns.date")}</p>
                        <p className="truncate">{shortDate(it.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-2 text-sm">
                      <span className="text-xs font-semibold text-gray-500">{t("columns.pdf")}</span>{" "}
                      {hasPdf ? (
                        <button
                          onClick={() => openPdf(it._id)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#0B1E3A]/20 
                                     px-2 py-0.5 text-[12px] text-[#0B1E3A] hover:bg-[#0B1E3A]/5"
                        >
                          {t("open")}
                        </button>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-gray-500">{t("columns.attachments")}</p>
                    {docs.length === 0 ? (
                      <p className="text-gray-500">—</p>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {docs.map((d) => (
                          <button
                            key={d.index}
                            onClick={() => openDoc(it._id, d.index)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#0B1E3A]/20 px-2 py-0.5 text-[12px] text-[#0B1E3A] hover:bg-[#0B1E3A]/5"
                          >
                            {t("open")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FiSearch, FiXCircle } from "react-icons/fi";
import Pagination from "@/components/Pagination";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function MesDevisPage() {
  const t = useTranslations("auth.client.quotesPage");
  const locale = useLocale();

  // on garde toutes les lignes, puis on filtre/pagine côté client
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // -------------------- FETCH (une seule fois) --------------------
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // on demande "beaucoup" pour tout récupérer (les comptes clients n’ont en général pas des milliers de lignes)
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "1000"); // ajuste si besoin

      const res = await fetch(`${BACKEND}/api/mes-devis?` + params.toString(), {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Fetch error");

      setAllItems(data.items || []);
    } catch (e) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // -------------------- HELPERS --------------------
  const prettyDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(locale, {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso || "-";
    }
  };

  const openUrlInNewTab = async (url) => {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return alert("Fichier introuvable");
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      window.open(obj, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(obj), 60000);
    } catch {
      alert("Impossible d’ouvrir ce fichier.");
    }
  };

  const openPdf = (it) => {
    const slug = String(it.type || "").toLowerCase();
    const url = it.pdfUrl || `${BACKEND}/api/mes-devis/${slug}/${it._id}/pdf`;
    openUrlInNewTab(url);
  };

  const openDoc = (it, file, index) => {
    if (file?.url) return openUrlInNewTab(file.url);
    const slug = String(it.type || "").toLowerCase();
    const url = `${BACKEND}/api/mes-devis/${slug}/${it._id}/document/${index}`;
    openUrlInNewTab(url);
  };

  // petit util pour recherche sans accents / case-insensitive
  const norm = (s) =>
    (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // -------------------- FILTRE SUR TOUTES LES COLONNES --------------------
  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return allItems;

    return allItems.filter((it) => {
      const number = `${it.ref || it.numero || ""}`;
      const type = `${it.typeLabel || it.type || ""}`;

      const files = Array.isArray(it.files) ? it.files : [];
      const fileNames = files.map((f) => f?.name || "").join(" ");
      const dateText = prettyDate(it.createdAt);

      const haystack = norm(
        [number, type, fileNames, dateText].join(" ")
      );

      return haystack.includes(nq);
    });
  }, [allItems, q]); // prettyDate dépend de locale, mais pour éviter de recalculer trop, ça suffit largement

  // reset page quand on tape
  useEffect(() => {
    setPage(1);
  }, [q]);

  // -------------------- PAGINATION (côté client) --------------------
  const total = filtered.length;
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  // -------------------- UI SUBS --------------------
  const FilesCell = ({ it }) => {
    const files = Array.isArray(it.files) ? it.files : [];
    if (files.length === 0) return <span className="text-slate-400">—</span>;
    const shown = files.slice(0, 2);
    const extra = files.length - shown.length;
    return (
      <div className="flex flex-wrap gap-2">
        {shown.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => openDoc(it, f, f.index ?? i)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50 text-[#0B1E3A]"
            title={f?.name || "Fichier joint"}
          >
            Ouvrir
          </button>
        ))}
        {extra > 0 && <span className="text-xs text-slate-600">+{extra}</span>}
      </div>
    );
  };

  const Card = ({ it }) => (
    <div className="rounded-2xl border border-[#F7C60022] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,.06)] space-y-2">
      <div className="text-xs text-slate-500">{t("table.number")}</div>
      <div className="font-semibold text-[#0B1E3A] inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#F7C600]" />
        <span>{it.ref || it.numero || "—"}</span>
      </div>

      <div className="text-xs text-slate-500">{t("table.type")}</div>
      <div>{it.typeLabel || it.type || "-"}</div>

      <div className="text-xs text-slate-500">PDF DDV</div>
      <div>
        {it.hasPdf || it.pdfUrl ? (
          <button
            onClick={() => openPdf(it)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50 text-[#0B1E3A]"
          >
            Ouvrir
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>

      <div className="text-xs text-slate-500">{t("table.files")}</div>
      <FilesCell it={it} />

      <div className="text-xs text-slate-500">{t("table.createdAt")}</div>
      <div className="text-slate-700">{prettyDate(it.createdAt)}</div>

      <button
        onClick={() =>
          (window.location.href = `/${locale}/client/orders/new?quoteId=${it._id}&type=${it.type}&ref=${encodeURIComponent(
            it.ref || it.numero || ""
          )}`)}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        {t("actions.order")}
      </button>
    </div>
  );

  const colWidths = useMemo(
    () => ["w-[18%]", "w-[22%]", "w-[12%]", "w-[26%]", "w-[25%]", "w-[6%]"],
    []
  );

  // -------------------- RENDER --------------------
  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-6 space-y-6 sm:space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1E3A]">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </header>

      {/* Barre de recherche centrée */}
      <div className="w-full mt-1">
        <div className="relative mx-auto w-full max-w-2xl">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-gray-300 bg-white px-9 pr-9 py-2 text-sm text-[#0B1E3A] shadow focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label={t("clear")}
              title={t("clear")}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-6 w-6 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <FiXCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile list */}
      <div className="grid md:hidden gap-3 sm:gap-4">
        {loading ? (
          <p className="text-slate-500">{t("loading")}</p>
        ) : error ? (
          <p className="text-rose-600">{error}</p>
        ) : pageItems.length === 0 ? (
          <p className="text-slate-500">{t("noData")}</p>
        ) : (
          pageItems.map((it) => <Card key={`${it.type}-${it._id}`} it={it} />)
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-[#F7C60022] bg-white shadow-[0_6px_22px_rgba(0,0,0,.06)]">
        {loading ? (
          <p className="px-6 py-6 text-slate-500">{t("loading")}</p>
        ) : error ? (
          <p className="px-6 py-6 text-rose-600">{error}</p>
        ) : pageItems.length === 0 ? (
          <p className="px-6 py-6 text-slate-500">{t("noData")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full table-auto">
                <colgroup>
                  {colWidths.map((w, i) => <col key={i} className={w} />)}
                </colgroup>
                <thead>
                  <tr className="bg-white">
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("table.number")}</div></th>
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("table.type")}</div></th>
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">PDF DDV</div></th>
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("table.files")}</div></th>
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("table.createdAt")}</div></th>
                    <th className="p-3 text-right"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("table.order")}</div></th>
                  </tr>
                  <tr>
                    <td colSpan={6}>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </td>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {pageItems.map((it) => (
                    <tr key={`${it.type}-${it._id}`} className="bg-white hover:bg-[#0B1E3A]/[0.03] transition-colors">
                      {/* Point jaune dans la colonne N° */}
                      <td className="p-3 align-top">
                        <span className="inline-flex items-center gap-2 text-[#0B1E3A] font-medium">
                          <span className="h-2 w-2 rounded-full bg-[#F7C600] shrink-0" />
                          <span>{it.ref || it.numero || "—"}</span>
                        </span>
                      </td>

                      {/* Type (sans point) */}
                      <td className="p-3 align-top text-[#0B1E3A]">
                        <span className="leading-tight">{it.typeLabel || it.type || "-"}</span>
                      </td>

                      <td className="p-3 align-top">
                        {it.hasPdf || it.pdfUrl ? (
                          <button
                            type="button"
                            onClick={() => openPdf(it)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50 text-[#0B1E3A]"
                          >
                            Ouvrir
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-3 align-top">
                        <FilesCell it={it} />
                      </td>

                      <td className="p-3 align-top text-[#0B1E3A]">{prettyDate(it.createdAt)}</td>

                      <td className="p-3 align-top text-right">
                        <button
                          onClick={() =>
                            (window.location.href = `/${locale}/client/orders/new?quoteId=${it._id}&type=${it.type}&ref=${encodeURIComponent(
                              it.ref || it.numero || ""
                            )}`)}
                          className="inline-flex items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          {t("actions.order")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 pb-5">
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

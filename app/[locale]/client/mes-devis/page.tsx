"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FiSearch, FiXCircle } from "react-icons/fi";
import Pagination from "@/components/Pagination";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const NOT_YET = "Pas encore";

/* -------------------- helpers -------------------- */
// lire un cookie côté client
function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const v = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return v ? decodeURIComponent(v.split("=")[1]) : "";
}

// persistance "commande confirmée" (par demandeId) dans localStorage
const ORDERED_KEY = "mtr:client:ordered";
function readOrdered(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ORDERED_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeOrdered(map: Record<string, boolean>) {
  try {
    localStorage.setItem(ORDERED_KEY, JSON.stringify(map || {}));
  } catch {}
}
/* ------------------------------------------------- */

export default function MesDevisPage() {
  const t = useTranslations("auth.client.quotesPage");
  const locale = useLocale();

  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // { [demandeId]: { numero, pdf } }
  const [devisMap, setDevisMap] = useState<Record<string, { numero?: string; pdf?: string }>>(
    {}
  );

  // état commande
  const [ordered, setOrdered] = useState<Record<string, boolean>>({});
  const [placing, setPlacing] = useState<Record<string, boolean>>({});

  // hydrate "ordered" depuis localStorage au 1er rendu
  useEffect(() => {
    setOrdered(readOrdered());
  }, []);

  const hasDevis = useCallback((id: string) => Boolean(devisMap?.[id]?.pdf), [devisMap]);

  /* --------- fetch toutes les lignes --------- */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: "1", pageSize: "1000" });

      const res = await fetch(`${BACKEND}/api/mes-devis?` + params.toString(), {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Fetch error");

      setAllItems(data.items || []);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* --------- récupérer DV (devis) pour chaque demande --------- */
  useEffect(() => {
    if (!allItems.length) {
      setDevisMap({});
      return;
    }
    let cancelled = false;

    (async () => {
      const pairs = await Promise.all(
        allItems.map(async (it) => {
          const demandeId = it._id;
          const numero = encodeURIComponent(it?.ref || it?.numero || "");
          try {
            const r = await fetch(
              `${BACKEND}/api/devis/client/by-demande/${demandeId}?numero=${numero}`,
              { credentials: "include" }
            );
            if (r.status === 403 || r.status === 404) return null;
            const j = await r.json().catch(() => null);
            if (j?.success && j?.exists && j?.pdf) {
              return [demandeId, { numero: j.devis?.numero, pdf: j.pdf }] as const;
            }
            return null;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const map: Record<string, { numero?: string; pdf?: string }> = {};
      for (const p of pairs) if (p) map[p[0]] = p[1];
      setDevisMap(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [allItems]);

  /* --------- récupérer l'état "commande confirmée" depuis le backend (robuste) --------- */
  useEffect(() => {
    if (!allItems.length) {
      setOrdered({});
      writeOrdered({});
      return;
    }

    const controller = new AbortController();

    const token =
      getCookie("token") ||
      (typeof localStorage !== "undefined" &&
        (localStorage.getItem("token") || localStorage.getItem("authToken"))) ||
      "";

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const ids = Array.from(new Set(allItems.map((it) => it?._id).filter(Boolean)));

    const CHUNK = 80;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

    (async () => {
      try {
        const merged: Record<string, boolean> = {};
        for (const group of chunks) {
          const qs = group.map(encodeURIComponent).join(",");
          const res = await fetch(`${BACKEND}/api/order/client/status?ids=${qs}`, {
            credentials: "include",
            headers,
            signal: controller.signal,
          });
          if (!res.ok) continue;
          const j = await res.json().catch(() => null);
          if (j?.success && j?.map) Object.assign(merged, j.map);
        }

        if (!controller.signal.aborted) {
          // merge avec localStorage + prune des ids qui ne sont plus présents
          const fromStorage = readOrdered();
          const next: Record<string, boolean> = {};
          const idSet = new Set(ids);
          for (const id of idSet) next[id] = merged[id] ?? fromStorage[id] ?? false;

          setOrdered(next);
          writeOrdered(next);
        }
      } catch {
        /* noop */
      }
    })();

    return () => controller.abort();
  }, [allItems]);

  /* --------- helpers UI --------- */
  const prettyDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(locale, {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      } as Intl.DateTimeFormatOptions);
    } catch {
      return iso || "-";
    }
  };

  const openUrlInNewTab = async (url: string) => {
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

  const openDdvPdf = (it: any) => {
    const slug = String(it.type || "").toLowerCase();
    const url = it.pdfUrl || `${BACKEND}/api/mes-devis/${slug}/${it._id}/pdf`;
    openUrlInNewTab(url);
  };

  const openDevisPdf = (demandeId: string) => {
    const info = devisMap[demandeId];
    if (info?.pdf) openUrlInNewTab(info.pdf);
  };

  const openDoc = (it: any, file: any, index: number) => {
    if (file?.url) return openUrlInNewTab(file.url);
    const slug = String(it.type || "").toLowerCase();
    const url = `${BACKEND}/api/mes-devis/${slug}/${it._id}/document/${index}`;
    openUrlInNewTab(url);
  };

  /* --------- ENVOI COMMANDE (avec Authorization: Bearer) --------- */
  const placeOrder = async (it: any) => {
    const info = devisMap[it._id];
    if (!info?.pdf) return;

    try {
      setPlacing((s) => ({ ...s, [it._id]: true }));

      const token =
        getCookie("token") ||
        (typeof localStorage !== "undefined" &&
          (localStorage.getItem("token") || localStorage.getItem("authToken"))) ||
        "";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BACKEND}/api/order/client/commander`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          demandeId: it._id,
          devisNumero: info.numero || null,
          devisPdf: info.pdf || null,
          demandeNumero: it.ref || it.numero || null,
        }),
      });

      if (res.status === 401) {
        alert("Non authentifié. Veuillez vous reconnecter.");
        return;
      }
      if (res.status === 403) {
        alert("Accès interdit: cette demande ne vous appartient pas.");
        return;
      }

      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.success) {
        throw new Error(j?.message || "Erreur envoi");
      }

      // ✅ persiste l’état "commande confirmée"
      setOrdered((prev) => {
        const next = { ...prev, [it._id]: true };
        writeOrdered(next);
        return next;
      });

      alert("Commande confirmée ✅");
    } catch (e: any) {
      alert(e.message || "Impossible d’envoyer la commande");
    } finally {
      setPlacing((s) => ({ ...s, [it._id]: false }));
    }
  };

  const norm = (s: string) =>
    (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  /* --------- filtre --------- */
  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return allItems;

    return allItems.filter((it) => {
      const number = `${it.ref || it.numero || ""}`;
      const type = `${it.typeLabel || it.type || ""}`;
      const files = Array.isArray(it.files) ? it.files : [];
      const fileNames = files.map((f) => f?.name || "").join(" ");
      const dateText = prettyDate(it.createdAt);
      const haystack = norm([number, type, fileNames, dateText].join(" "));
      return haystack.includes(nq);
    });
  }, [allItems, q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  /* --------- pagination --------- */
  const total = filtered.length;
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  /* --------- UI subs --------- */
  const StatusPill = ({ id }: { id: string }) => {
    const isPlacing = placing[id];
    const isOrdered = ordered[id];
    const base =
      "inline-block rounded-full px-2 py-0.5 text-xs font-semibold border";

    if (isPlacing)
      return (
        <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>
          Envoi…
        </span>
      );
    if (isOrdered)
      return (
        <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>
          Confirmée
        </span>
      );
    return (
      <span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}>
        Non confirmée
      </span>
    );
  };

  const FilesCell = ({ it }: { it: any }) => {
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

  const Card = ({ it }: { it: any }) => {
    const existeDevis = hasDevis(it._id);
    return (
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
              onClick={() => openDdvPdf(it)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50 text-[#0B1E3A]"
            >
              Ouvrir
            </button>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>

        <div className="text-xs text-slate-500">DV (Devis)</div>
        <div>
          {existeDevis ? (
            <button
              onClick={() => openDevisPdf(it._id)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50 text-[#0B1E3A]"
            >
              Ouvrir
            </button>
          ) : (
            <span className="text-slate-500">{NOT_YET}</span>
          )}
        </div>

        <div className="text-xs text-slate-500">{t("table.files")}</div>
        <FilesCell it={it} />

        <div className="text-xs text-slate-500">{t("table.createdAt")}</div>
        <div className="text-slate-700">{prettyDate(it.createdAt)}</div>

        {/* Statut */}
        <div className="text-xs text-slate-500">Statut</div>
        <StatusPill id={it._id} />

        {/* Action */}
        {existeDevis && !ordered[it._id] && (
          <button
            onClick={() => placeOrder(it)}
            disabled={placing[it._id]}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {placing[it._id] ? "Envoi..." : t("actions.order")}
          </button>
        )}
      </div>
    );
  };

  // +1 colonne pour "Statut"
  const colWidths = useMemo(
    () => [
      "w-[16%]", // numéro
      "w-[18%]", // type
      "w-[12%]", // PDF DDV
      "w-[12%]", // DV
      "w-[22%]", // fichiers
      "w-[12%]", // date
      "w-[8%]", // statut
      "w-[6%]", // action
    ],
    []
  );

  /* --------- render --------- */
  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-6 space-y-6 sm:space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1E3A]">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </header>

      {/* recherche */}
      <div className="w-full mt-1">
        <div className="relative mx-auto w-full max-w-2xl">
          <FiSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
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

      {/* mobile */}
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

      {/* desktop */}
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
              <table className="min-w-[1120px] w-full table-auto">
                <colgroup>
                  {colWidths.map((w, i) => (
                    <col key={i} className={w} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-white">
                    <th className="p-3 text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t("table.number")}
                      </div>
                    </th>
                    <th className="p-3 text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t("table.type")}
                      </div>
                    </th>
                    <th className="p-3 text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        PDF DDV
                      </div>
                    </th>
                    <th className="p-3 text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        DV
                      </div>
                    </th>
                    <th className="p-3 text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t("table.files")}
                      </div>
                    </th>
                    <th className="p-3 text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t("table.createdAt")}
                      </div>
                    </th>
                    <th className="p-3 text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Statut
                      </div>
                    </th>
                    <th className="p-3 text-right">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t("table.order")}
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={8}>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageItems.map((it) => {
                    const existeDevis = hasDevis(it._id);
                    const devisInfo = devisMap[it._id];
                    return (
                      <tr
                        key={`${it.type}-${it._id}`}
                        className="bg-white hover:bg-[#0B1E3A]/[0.03] transition-colors"
                      >
                        <td className="p-3 align-top">
                          <span className="inline-flex items-center gap-2 text-[#0B1E3A] font-medium">
                            <span className="h-2 w-2 rounded-full bg-[#F7C600] shrink-0" />
                            <span>{it.ref || it.numero || "—"}</span>
                          </span>
                        </td>
                        <td className="p-3 align-top text-[#0B1E3A]">
                          {it.typeLabel || it.type || "-"}
                        </td>
                        <td className="p-3 align-top">
                          {it.hasPdf || it.pdfUrl ? (
                            <button
                              type="button"
                              onClick={() => openDdvPdf(it)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50 text-[#0B1E3A]"
                            >
                              Ouvrir
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          {existeDevis ? (
                            <button
                              type="button"
                              onClick={() => openDevisPdf(it._id)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50 text-[#0B1E3A]"
                              title={devisInfo?.numero ? `Devis ${devisInfo.numero}` : "Devis"}
                            >
                              Ouvrir
                            </button>
                          ) : (
                            <span className="text-slate-500">{NOT_YET}</span>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          <FilesCell it={it} />
                        </td>
                        <td className="p-3 align-top text-[#0B1E3A]">
                          {prettyDate(it.createdAt)}
                        </td>
                        <td className="p-3 align-top">
                          <StatusPill id={it._id} />
                        </td>
                        <td className="p-3 align-top text-right">
                          {existeDevis && !ordered[it._id] && (
                            <button
                              onClick={() => placeOrder(it)}
                              disabled={placing[it._id]}
                              className="inline-flex items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {placing[it._id] ? "Envoi..." : t("actions.order")}
                            </button>
                          )}
                          {ordered[it._id] && (
                            <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-sm">
                              Commande confirmée
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

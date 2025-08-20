"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FiSearch,
  FiXCircle,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiPlus,
} from "react-icons/fi";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function AdminCategoriesPage() {
  const locale = useLocale();
  const t = useTranslations("auth.categories");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recherche
  const [query, setQuery] = useState("");

  // Modales
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Ajout
  const [newFR, setNewFR] = useState("");
  const [newEN, setNewEN] = useState("");

  // Edit/Delete
  const [currentId, setCurrentId] = useState(null);
  const [draftFR, setDraftFR] = useState("");
  const [draftEN, setDraftEN] = useState("");

  // Busy
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(() => ({ "Content-Type": "application/json" }), []);

  async function fetchAll() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${BACKEND}/api/categories`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t("errorLoad"));
      setItems(data.categories || []);
    } catch (e) {
      setError(e?.message || t("errorServer"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // ----- Add -----
  function openAddModal() {
    setNewFR("");
    setNewEN("");
    setAddOpen(true);
  }
  function closeAddModal() {
    setAddOpen(false);
    setNewFR("");
    setNewEN("");
  }
  async function submitAdd() {
    if (!newFR.trim()) {
      setError(t("errorRequiredFR"));
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${BACKEND}/api/categories`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ label: newFR.trim(), en: newEN.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t("errorCreate"));
      setItems((prev) => [data.category, ...prev]);
      closeAddModal();
    } catch (e) {
      setError(e?.message || t("errorServer"));
    } finally {
      setSubmitting(false);
    }
  }

  // ----- Edit -----
  function openEditModal(cat) {
    setCurrentId(cat._id);
    setDraftFR((cat?.translations?.fr || cat?.label || "").trim());
    setDraftEN((cat?.translations?.en || "").trim());
    setEditOpen(true);
  }
  function closeEditModal() {
    setEditOpen(false);
    setCurrentId(null);
    setDraftFR("");
    setDraftEN("");
  }
  async function submitEdit() {
    if (!currentId || !draftFR.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${BACKEND}/api/categories/${currentId}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ label: draftFR.trim(), en: draftEN.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t("errorUpdate"));
      setItems((prev) => prev.map((c) => (c._id === currentId ? data.category : c)));
      closeEditModal();
    } catch (e) {
      setError(e?.message || t("errorServer"));
    } finally {
      setSubmitting(false);
    }
  }

  // ----- Delete -----
  function openDeleteModal(cat) {
    setCurrentId(cat._id);
    setDeleteOpen(true);
  }
  function closeDeleteModal() {
    setDeleteOpen(false);
    setCurrentId(null);
  }
  async function submitDelete() {
    if (!currentId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${BACKEND}/api/categories/${currentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t("errorDelete"));
      setItems((prev) => prev.filter((c) => c._id !== currentId));
      closeDeleteModal();
    } catch (e) {
      setError(e?.message || t("errorServer"));
    } finally {
      setSubmitting(false);
    }
  }

  // Filtrage
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const fr = (c?.translations?.fr || c?.label || "").toLowerCase();
      const en = (c?.translations?.en || "").toLowerCase();
      return fr.includes(q) || en.includes(q) || c._id.toLowerCase().includes(q);
    });
  }, [items, query]);

  return (
    <div className="py-6 space-y-6 sm:space-y-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* =================== Header centré =================== */}
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1E3A]">
            {t("title")}
          </h1>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Barre de recherche + bouton alignés, sous le titre, centrés */}
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="relative w-full sm:w-[520px]">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-gray-300 bg-white px-9 pr-9 py-2 text-sm text-[#0B1E3A]
                           shadow focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
                aria-label={t("searchAria")}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("clearSearch")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center
                             h-6 w-6 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  <FiXCircle size={16} />
                </button>
              )}
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F7C600] text-[#0B1E3A] px-4 py-2 font-semibold shadow hover:brightness-105 active:translate-y-[1px] transition whitespace-nowrap"
            >
              <FiPlus /> {t("addButton")}
            </button>
          </div>
        </header>

        {/* =================== Table =================== */}
        <section className="rounded-2xl border border-[#F7C60022] bg-white p-0 shadow-[0_6px_22px_rgba(0,0,0,.06)]">
          {loading ? (
            <div className="px-6 py-6 space-y-3 animate-pulse">
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-6 text-gray-500">{t("noData")}</p>
          ) : (
            <>
              {/* ≥ md */}
              <div className="hidden md:block">
                <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="min-w-full table-auto">
                    <colgroup>
                      <col className="w-[46%]" />
                      <col className="w-[40%]" />
                      <col className="w-[14%]" />
                    </colgroup>

                    <thead className="sticky top-0 z-10">
                      <tr className="bg-white">
                        <th className="p-4 text-left">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {t("table.fr")}
                          </div>
                        </th>
                        <th className="p-4 text-left">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {t("table.en")}
                          </div>
                        </th>
                        <th className="p-4 text-right">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {t("table.actions")}
                          </div>
                        </th>
                      </tr>
                      <tr>
                        <td colSpan={3}>
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                        </td>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((c) => {
                        const fr = c?.translations?.fr || c?.label || "";
                        const en = c?.translations?.en || "";
                        return (
                          <tr
                            key={c._id}
                            className="group bg-white hover:bg-[#0B1E3A]/[0.03] transition-colors"
                          >
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-[#F7C600] opacity-70 group-hover:opacity-100 transition" />
                                <span className="text-[#0B1E3A] font-medium">
                                  {fr}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              {en ? (
                                <span className="text-slate-700">{en}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(c)}
                                  className="inline-flex h-9 items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 text-[13px] font-medium text-yellow-800 hover:bg-yellow-100 hover:shadow-sm transition"
                                  title={t("actions.edit")}
                                  aria-label={t("actions.edit")}
                                >
                                  <FiEdit2 size={16} />
                                 
                                </button>
                                <button
                                  onClick={() => openDeleteModal(c)}
                                  className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 text-[13px] font-medium text-red-700 hover:bg-red-100 hover:shadow-sm transition"
                                  title={t("actions.delete")}
                                  aria-label={t("actions.delete")}
                                >
                                  <FiTrash2 size={16} />
                                 
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* < md */}
              <div className="md:hidden grid grid-cols-1 gap-3 px-4 py-4">
                {filtered.map((c) => {
                  const fr = c?.translations?.fr || c?.label || "";
                  const en = c?.translations?.en || "";
                  return (
                    <div
                      key={c._id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-500">
                            {t("table.fr")}
                          </p>
                          <p className="font-medium text-[#0B1E3A]">{fr}</p>
                          <p className="mt-3 text-xs font-semibold text-gray-500">
                            {t("table.en")}
                          </p>
                          <p className="text-[#0B1E3A]">
                            {en || <span className="text-gray-400">—</span>}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => openEditModal(c)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 transition"
                            aria-label={t("actions.edit")}
                            title={t("actions.edit")}
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(c)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition"
                            aria-label={t("actions.delete")}
                            title={t("actions.delete")}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* =================== Modales =================== */}

      {/* Add */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-title"
        >
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-[0_25px_80px_rgba(0,0,0,.25)] ring-1 ring-gray-100">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-lg ring-4 ring-white flex items-center justify-center text-[#0B1E3A]">
              <FiPlus size={22} />
            </div>

            <div className="px-6 pt-10 pb-4 border-b border-gray-100 text-center">
              <h3 id="add-title" className="text-xl font-semibold text-[#0B1E3A]">
                {t("add.title")}
              </h3>
            </div>

            <div className="px-6 py-6 space-y-5">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  {t("add.labelFR")}
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-9 text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
                    value={newFR}
                    onChange={(e) => setNewFR(e.target.value)}
                    placeholder={t("placeholders.frExample")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                    FR
                  </span>
                </div>
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  {t("add.labelEN")}
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-9 text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
                    value={newEN}
                    onChange={(e) => setNewEN(e.target.value)}
                    placeholder={t("placeholders.enExample")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                    EN
                  </span>
                </div>
              </label>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => !submitting && closeAddModal()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#0B1E3A] bg-white px-4 py-2 text-sm hover:bg-gray-50 transition text-[#0B1E3A]"
                disabled={submitting}
              >
                <FiX /> {t("common.cancel")}
              </button>
              <button
                onClick={submitAdd}
                disabled={submitting || !newFR.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow"
              >
                <FiCheck /> {submitting ? t("add.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-[0_25px_80px_rgba(0,0,0,.25)] ring-1 ring-gray-100">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-lg ring-4 ring-white flex items-center justify-center text-[#0B1E3A]">
              <FiEdit2 size={22} />
            </div>

            <div className="px-6 pt-10 pb-4 border-b border-gray-100 text-center">
              <h3 id="edit-title" className="text-xl font-semibold text-[#0B1E3A]">
                {t("edit.title")}
              </h3>
              {currentId && (
                <p className="mt-1 text-xs text-gray-500 font-mono truncate">
                  {t("common.id")} {currentId}
                </p>
              )}
            </div>

            <div className="px-6 py-6 space-y-5">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  {t("add.labelFR")}
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-9 text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
                    value={draftFR}
                    onChange={(e) => setDraftFR(e.target.value)}
                    placeholder={t("placeholders.frExample")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                    FR
                  </span>
                </div>
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  {t("add.labelEN")}
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-9 text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition"
                    value={draftEN}
                    onChange={(e) => setDraftEN(e.target.value)}
                    placeholder={t("placeholders.enExample")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                    EN
                  </span>
                </div>
              </label>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => !submitting && closeEditModal()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#0B1E3A] bg-white px-4 py-2 text-sm hover:bg-gray-50 transition text-[#0B1E3A]"
                disabled={submitting}
              >
                <FiX /> {t("common.cancel")}
              </button>
              <button
                onClick={submitEdit}
                disabled={submitting || !draftFR.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow"
              >
                <FiCheck /> {submitting ? t("edit.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-[0_25px_80px_rgba(0,0,0,.25)] ring-1 ring-gray-100">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 to-red-600 shadow-lg ring-4 ring-white flex items-center justify-center text-white">
              <FiTrash2 size={22} />
            </div>

            <div className="px-6 pt-10 pb-4 border-b border-gray-100 text-center">
              <h3 id="delete-title" className="text-xl font-semibold text-[#0B1E3A]">
                {t("delete.title")}
              </h3>
              {currentId && (
                <p className="mt-1 text-xs text-gray-500 font-mono truncate">
                  {t("common.id")} {currentId}
                </p>
              )}
            </div>

            <div className="px-6 py-6 text-sm text-gray-700">
              {t("delete.confirm")}{" "}
              <span className="font-semibold text-red-600">{t("delete.irreversible")}</span>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => !submitting && closeDeleteModal()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#0B1E3A] bg-white px-4 py-2 text-sm hover:bg-gray-50 transition text-[#0B1E3A]"
                disabled={submitting}
              >
                <FiX /> {t("common.cancel")}
              </button>
              <button
                onClick={submitDelete}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition shadow"
              >
                <FiTrash2 /> {submitting ? t("delete.deleting") : t("delete.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

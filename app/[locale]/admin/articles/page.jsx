"use client";

import { useEffect, useMemo, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function AdminArticlesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Devis list pour le <select>
  const [devisList, setDevisList] = useState([]);
  const [loadingDevis, setLoadingDevis] = useState(false);

  // Modales
  const [isOpen, setIsOpen] = useState(false); // Add/Edit
  const [deleteOpen, setDeleteOpen] = useState(false); // Delete

  // Form
  const emptyForm = {
    _id: null,
    reference: "",
    designation: "",
    prixHT: "",
    numeroDevis: "",
  };
  const [form, setForm] = useState(emptyForm);
  const isEditing = useMemo(() => Boolean(form?._id), [form]);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // ===== API calls =====
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/articles`, { cache: "no-store" });
      const json = await res.json();
      console.log("Réponse brute devis:", json); // 🔎 log 1
      console.log("BACKEND URL:", BACKEND); // 🔎 log 2
      setItems(json?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevis = async () => {
    setLoadingDevis(true);
    try {
      const res = await fetch(`${BACKEND}/api/devis`, { cache: "no-store" });
      const json = await res.json();
      setDevisList(json?.data ?? []); // [{ _id, numero }]
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDevis(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchDevis();
  }, []);

  // ===== UI actions =====
  const openAdd = () => {
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (it) => {
    setForm({
      _id: it._id,
      reference: it.reference ?? "",
      designation: it.designation ?? "",
      prixHT: it.prixHT ?? "",
      numeroDevis: it.numeroDevis ?? "",
    });
    setIsOpen(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "prixHT" ? value.replace(",", ".") : value,
    }));
  };

  const validForm = () => {
    if (!form.reference?.trim()) return "Référence obligatoire";
    if (!form.designation?.trim()) return "Désignation obligatoire";
    if (
      form.prixHT === "" ||
      isNaN(Number(form.prixHT)) ||
      Number(form.prixHT) < 0
    )
      return "Prix HT invalide";
    // Rends-le obligatoire si tu veux :
    // if (!form.numeroDevis) return "Veuillez sélectionner un N° de devis";
    return null;
  };

  const submitForm = async (e) => {
    e?.preventDefault?.();
    const err = validForm();
    if (err) return alert(err);

    setSubmitting(true);
    try {
      const payload = {
        reference: form.reference.trim(),
        designation: form.designation.trim(),
        prixHT: Number(form.prixHT),
        numeroDevis: form.numeroDevis?.trim() || "",
      };

      const url = isEditing
        ? `${BACKEND}/api/articles/${form._id}`
        : `${BACKEND}/api/articles`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Erreur serveur");
      setIsOpen(false);
      setForm(emptyForm);
      await fetchItems();
    } catch (e) {
      console.error(e);
      alert(e.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (it) => {
    setToDelete(it);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!toDelete?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND}/api/articles/${toDelete._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Erreur serveur");
      setDeleteOpen(false);
      setToDelete(null);
      await fetchItems();
    } catch (e) {
      console.error(e);
      alert(e.message || "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  // Options pour le select : on garantit que la valeur actuelle apparaît même si elle
  // n'est pas dans la liste renvoyée par l'API (utile en mode édition).
  const devisOptions = (() => {
    const arr = [...devisList];
    if (form.numeroDevis && !arr.some((d) => d.numero === form.numeroDevis)) {
      arr.unshift({ _id: "__current__", numero: form.numeroDevis });
    }
    return arr;
  })();

  // ===== RENDER =====
  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <button
          onClick={openAdd}
          className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90 active:opacity-80"
        >
          Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Référence</th>
              <th className="py-3 px-4 text-left">Désignation</th>
              <th className="py-3 px-4 text-right">Prix HT</th>
              <th className="py-3 px-4 text-right">Prix TTC</th>
              <th className="py-3 px-4 text-left">N° Devis</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-8 px-4 text-center text-gray-500" colSpan={6}>
                  Chargement…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="py-8 px-4 text-center text-gray-500" colSpan={6}>
                  Aucun article.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="py-3 px-4">{it.reference}</td>
                  <td className="py-3 px-4">{it.designation}</td>
                  <td className="py-3 px-4 text-right">
                    {Number(it.prixHT).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {Number(it.prixTTC ?? it.prixHT * 1.2).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">{it.numeroDevis || "-"}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(it)}
                      className="rounded-lg px-3 py-1.5 bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => confirmDelete(it)}
                      className="rounded-lg px-3 py-1.5 bg-red-500 text-white hover:bg-red-600"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter/Éditer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Modifier l’article" : "Ajouter un article"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitForm} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Référence <span className="text-red-500">*</span>
                </label>
                <input
                  name="reference"
                  value={form.reference}
                  onChange={onChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  placeholder="Ex: ART-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Désignation <span className="text-red-500">*</span>
                </label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={onChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  placeholder="Ex: Ressort compression Ø10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prix HT <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="prixHT"
                    value={form.prixHT}
                    onChange={onChange}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                    placeholder="Ex: 100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    N° Devis
                  </label>
                  <select
                    name="numeroDevis"
                    value={form.numeroDevis}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, numeroDevis: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  >
                    <option value="">-- Sélectionner --</option>
                    {devisOptions.map((d) => (
                      <option key={(d._id ?? "") + d.numero} value={d.numero}>
                        {d.numero}
                      </option>
                    ))}
                  </select>
                  {loadingDevis && (
                    <p className="text-xs text-gray-500 mt-1">
                      Chargement des numéros…
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-60"
                >
                  {submitting
                    ? "Enregistrement..."
                    : isEditing
                    ? "Mettre à jour"
                    : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Supprimer l’article</h3>
            </div>
            <div className="px-5 py-4">
              <p>
                Confirmez-vous la suppression de{" "}
                <span className="font-medium">{toDelete?.reference}</span> ?
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="rounded-xl px-4 py-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

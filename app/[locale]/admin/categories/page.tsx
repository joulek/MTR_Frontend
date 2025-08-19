"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Category = {
  _id: string;
  label: string; // FR par défaut
  translations: { fr: string; en?: string };
  createdAt?: string;
};

export default function AdminCategoriesPage() {
  const locale = useLocale();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string>("");

  // Form ajout
  const [labelFR, setLabelFR] = useState("");
  const [labelEN, setLabelEN] = useState("");

  // Edition inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editFR, setEditFR] = useState("");
  const [editEN, setEditEN] = useState("");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
  }), []);

  async function fetchAll() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${BACKEND}/api/categories`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Erreur chargement");
      setItems(data.categories || []);
    } catch (e:any) {
      setError(e.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!labelFR.trim()) {
      setError("Le label FR est requis.");
      return;
    }
    try {
      const res = await fetch(`${BACKEND}/api/categories`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ label: labelFR.trim(), en: labelEN.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Création impossible");
      setLabelFR("");
      setLabelEN("");
      setItems((prev) => [data.category, ...prev]);
    } catch (e:any) {
      setError(e.message || "Erreur serveur");
    }
  }

  function startEdit(cat: Category) {
    setEditId(cat._id);
    setEditFR(cat.translations?.fr || cat.label || "");
    setEditEN(cat.translations?.en || "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditFR("");
    setEditEN("");
  }

  async function saveEdit(id: string) {
    try {
      const res = await fetch(`${BACKEND}/api/categories/${id}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ label: editFR.trim(), en: editEN.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Mise à jour impossible");
      setItems((prev) => prev.map((c) => (c._id === id ? data.category : c)));
      cancelEdit();
    } catch (e:any) {
      setError(e.message || "Erreur serveur");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      const res = await fetch(`${BACKEND}/api/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Suppression impossible");
      setItems((prev) => prev.filter((c) => c._id !== id));
    } catch (e:any) {
      setError(e.message || "Erreur serveur");
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#0B1E3A]">Gestion des catégories</h1>
          <span className="text-sm text-gray-500">Locale: {locale}</span>
        </header>

        {/* Formulaire d'ajout */}
        <section className="rounded-2xl border bg-white p-6" style={{ borderColor: "#F7C60055", boxShadow: "0 6px 22px rgba(0,0,0,.05)" }}>
          <h2 className="text-lg font-bold text-[#0B1E3A] mb-4">Ajouter une catégorie</h2>

          <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0B1E3A] mb-1">Label (FR)</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ex: Ressorts"
                value={labelFR}
                onChange={(e) => setLabelFR(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0B1E3A] mb-1">Traduction (EN)</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ex: Springs"
                value={labelEN}
                onChange={(e) => setLabelEN(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full md:w-auto rounded-lg bg-[#0B1E3A] text-white px-4 py-2 font-semibold hover:opacity-90"
              >
                Ajouter
              </button>
            </div>
          </form>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </section>

        {/* Liste */}
        <section className="rounded-2xl border bg-white p-6" style={{ borderColor: "#F7C60055", boxShadow: "0 6px 22px rgba(0,0,0,.05)" }}>
          <h2 className="text-lg font-bold text-[#0B1E3A] mb-4">Catégories</h2>

          {loading ? (
            <p className="text-gray-500">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500">Aucune catégorie.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-[#0B1E3A]">FR</th>
                    <th className="text-left p-3 font-semibold text-[#0B1E3A]">EN</th>
                    <th className="text-left p-3 font-semibold text-[#0B1E3A]">ID</th>
                    <th className="text-right p-3 font-semibold text-[#0B1E3A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => {
                    const isEditing = editId === c._id;
                    const fr = c.translations?.fr || c.label || "";
                    const en = c.translations?.en || "";

                    return (
                      <tr key={c._id} className="border-b">
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={editFR}
                              onChange={(e) => setEditFR(e.target.value)}
                            />
                          ) : (
                            fr
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={editEN}
                              onChange={(e) => setEditEN(e.target.value)}
                            />
                          ) : (
                            en || <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3">{c._id}</td>
                        <td className="p-3 text-right space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(c._id)}
                                className="rounded bg-green-600 text-white px-3 py-1 hover:opacity-90"
                              >
                                Enregistrer
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded bg-gray-300 text-gray-800 px-3 py-1 hover:opacity-90"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(c)}
                                className="rounded bg-[#F7C600] text-[#0B1E3A] px-3 py-1 hover:opacity-90"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => onDelete(c._id)}
                                className="rounded bg-red-600 text-white px-3 py-1 hover:opacity-90"
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

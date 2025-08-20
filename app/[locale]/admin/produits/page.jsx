"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// largeur similaire à la page "catégories"
const CARD_WRAPPER = "mx-auto w-full max-w-[1100px] px-3 sm:px-4 lg:px-0";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modales
  const [isOpen, setIsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Form
  const [nameFr, setNameFr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descFr, setDescFr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState(null);
  const [previews, setPreviews] = useState([]);

  // Lightbox
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const rp = await fetch(`${BACKEND}/api/produits`, { credentials: "include" });
        const prodData = rp.ok ? await rp.json().catch(() => []) : [];
        setProducts(Array.isArray(prodData) ? prodData : prodData?.products ?? []);

        const rc = await fetch(`${BACKEND}/api/categories`, { credentials: "include" });
        const catData = rc.ok ? await rc.json().catch(() => []) : [];
        setCategories(Array.isArray(catData) ? catData : catData?.categories ?? []);
      } catch (err) {
        console.error("❌ Initial fetch error:", err);
      }
    })();
  }, []);

  // Previews
  const onImagesChange = (fileList) => {
    setImages(fileList);
    previews.forEach((u) => URL.revokeObjectURL(u));
    const urls = fileList ? Array.from(fileList).map((f) => URL.createObjectURL(f)) : [];
    setPreviews(urls);
  };

  // Reset + close
  const resetForm = () => {
    setNameFr(""); setNameEn(""); setDescFr(""); setDescEn("");
    setCategory(""); setImages(null);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews([]);
  };
  const closeAddModal = () => { setIsOpen(false); resetForm(); };

  // lock scroll + Esc/Arrows
  const keyHandler = useCallback((e) => {
    if (e.key === "Escape") {
      if (galleryOpen) setGalleryOpen(false);
      if (isOpen) setIsOpen(false);
      if (deleteOpen) setDeleteOpen(false);
    }
    if (galleryOpen && galleryImages.length > 0) {
      if (e.key === "ArrowRight") setGalleryIndex((i) => (i + 1) % galleryImages.length);
      if (e.key === "ArrowLeft") setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
    }
  }, [galleryOpen, galleryImages.length, isOpen, deleteOpen]);

  useEffect(() => {
    const someModalOpen = isOpen || deleteOpen || galleryOpen;
    if (someModalOpen) {
      document.addEventListener("keydown", keyHandler);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", keyHandler);
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", keyHandler);
      document.body.style.overflow = "";
    };
  }, [isOpen, deleteOpen, galleryOpen, keyHandler]);

  // Submit (Add)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append("name_fr", nameFr);
    fd.append("name_en", nameEn);
    fd.append("description_fr", descFr);
    fd.append("description_en", descEn);
    fd.append("category", category);
    if (images) Array.from(images).forEach((img) => fd.append("images", img));

    try {
      const res = await fetch(`${BACKEND}/api/produits`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data) {
        setProducts((prev) => [data, ...prev]);
        closeAddModal();
      } else {
        alert(data?.message || "❌ Erreur lors de la création du produit");
      }
    } catch (err) {
      console.error("❌ POST error:", err);
      alert("❌ Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  // Delete flow
  function openDeleteModal(p) {
    setDeletingId(p._id);
    setDeletingName(p.name_fr || p.name_en || "");
    setDeleteOpen(true);
  }
  function closeDeleteModal() {
    setDeleteOpen(false);
    setDeletingId(null);
    setDeletingName("");
  }
  const submitDelete = async () => {
    if (!deletingId) return;
    try {
      setSubmittingDelete(true);
      const res = await fetch(`${BACKEND}/api/produits/${deletingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Suppression impossible");
      setProducts((prev) => prev.filter((p) => p._id !== deletingId));
      closeDeleteModal();
    } catch (err) {
      console.error("❌ DELETE error:", err);
      alert(err?.message || "❌ Erreur réseau");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Lightbox open
  const openGallery = (imgs = [], startIndex = 0) => {
    if (!imgs || imgs.length === 0) return;
    setGalleryImages(imgs);
    setGalleryIndex(Math.max(0, Math.min(startIndex, imgs.length - 1)));
    setGalleryOpen(true);
  };
  const nextImg = () => setGalleryIndex((i) => (i + 1) % galleryImages.length);
  const prevImg = () => setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);

  // Thumbnails
  const renderThumbs = (imgs = []) => {
    const shown = imgs.slice(0, 2);
    const extra = imgs.length - shown.length;
    return (
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-1">
        {shown.map((src, i) => {
          const showBadge = extra > 0 && i === shown.length - 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => openGallery(imgs, i)}
              className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-md overflow-hidden ring-1 ring-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F7C600]"
              title="Voir les images"
            >
              <Image src={src} alt={`img-${i}`} fill className="object-cover" sizes="56px" />
              {showBadge && (
                <span className="absolute inset-0 bg-black/50 text-white text-xs font-semibold grid place-items-center">
                  +{extra}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // ---- MOBILE CARD (<= md) ----
  const MobileCard = ({ p }) => (
    <div className="rounded-2xl border border-[#F7C60022] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            {p.category ? (p.category?.translations?.fr || p.category?.label || "-") : "-"}
          </div>
          <h3 className="text-base font-semibold text-[#0B1E3A]">{p.name_fr || p.name_en || "-"}</h3>
        </div>
        <button
          onClick={() => openDeleteModal(p)}
          className="shrink-0 inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 text-[13px] font-medium text-red-700 hover:bg-red-100 hover:shadow-sm transition"
        >
          Supprimer
        </button>
      </div>

      {p.description_fr || p.description_en ? (
        <p className="mt-2 text-[13px] text-slate-700">
          {p.description_fr || p.description_en}
        </p>
      ) : null}

      <div className="mt-3">{renderThumbs(p.images || [])}</div>
    </div>
  );

  return (
    <div className="py-6 space-y-6 sm:space-y-8">
      {/* HEADER centré */}
      <div className={CARD_WRAPPER}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1E3A]">
            Gestion des Produits
          </h1>
          <button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#F7C600] text-[#0B1E3A] px-4 py-2 font-semibold shadow hover:brightness-105 active:translate-y-[1px] transition"
          >
            + Ajouter 
          </button>
        </div>
      </div>

      {/* LISTE MOBILE (cartes) */}
      <div className={`${CARD_WRAPPER} md:hidden`}>
        <div className="grid gap-3 sm:gap-4">
          {products.length === 0 ? (
            <p className="text-gray-500">Aucune donnée</p>
          ) : (
            products.map((p) => <MobileCard key={p._id} p={p} />)
          )}
        </div>
      </div>

      {/* TABLE DESKTOP — carte centrée et étroite */}
      <div className={`${CARD_WRAPPER} hidden md:block`}>
        <div className="rounded-2xl border border-[#F7C60022] bg-white shadow-[0_6px_22px_rgba(0,0,0,.06)]">
          {products.length === 0 ? (
            <p className="px-6 py-6 text-gray-500">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full table-auto">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[28%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                </colgroup>

                <thead>
                  <tr className="bg-white">
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Catégorie</div></th>
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nom</div></th>
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</div></th>
                    <th className="p-3 text-left"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Images</div></th>
                    <th className="p-3 text-right"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actions</div></th>
                  </tr>
                  <tr>
                    <td colSpan={5}><div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" /></td>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p._id} className="bg-white hover:bg-[#0B1E3A]/[0.03] transition-colors">
                      <td className="p-3 align-top">
                        <span className="inline-flex items-center gap-2 text-[#0B1E3A]">
                          <span className="h-2 w-2 rounded-full bg-[#F7C600]" />
                          {p.category ? (p.category?.translations?.fr || p.category?.label || "-") : "-"}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <div className="text-[#0B1E3A] font-medium truncate max-w-[220px]">{p.name_fr || p.name_en || "-"}</div>
                      </td>
                      <td className="p-3 align-top">
                        <p className="text-sm text-slate-700 line-clamp-2 max-w-[360px]">
                          {p.description_fr || p.description_en || "-"}
                        </p>
                      </td>
                      <td className="p-3 align-top">
                        <div className="max-w-[140px]">{renderThumbs(p.images || [])}</div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openDeleteModal(p)}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 text-[13px] font-medium text-red-700 hover:bg-red-100 hover:shadow-sm transition"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODALE AJOUT PRODUIT */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="add-title">
          <div className="relative w-full max-w-sm sm:max-w-2xl mt-12 rounded-3xl bg-white shadow-[0_25px_80px_rgba(0,0,0,.25)] ring-1 ring-gray-100">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-lg ring-4 ring-white flex items-center justify-center text-[#0B1E3A] text-xl sm:text-2xl">+</div>
            <div className="px-4 sm:px-6 pt-10 pb-4 border-b border-gray-100 text-center">
              <h3 id="add-title" className="text-lg sm:text-xl font-semibold text-[#0B1E3A]">Ajouter un produit</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Renseignez les informations ci-dessous</p>
              <button onClick={closeAddModal} className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition" aria-label="Fermer" title="Fermer">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Label (FR)</span>
                  <div className="relative">
                    <input value={nameFr} onChange={(e) => setNameFr(e.target.value)} placeholder="ex: Ressorts" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition" required />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">FR</span>
                  </div>
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Traduction (EN)</span>
                  <div className="relative">
                    <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="ex: Springs" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">EN</span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</span>
                  <textarea value={descFr} onChange={(e) => setDescFr(e.target.value)} placeholder="Courte description en français" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 min-h-[96px] text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</span>
                  <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} placeholder="Short description in English" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 min-h-[96px] text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition" />
                </label>
              </div>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Catégorie</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[#0B1E3A] focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none transition">
                  <option value="">Choisir une catégorie</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c?.translations?.fr || c?.label || "Catégorie"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-3">
                <span className="block text-sm font-medium text-gray-700">Images</span>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dotted border-[#F7C600] bg-[#FFF7CC] rounded-xl p-4 sm:p-6 cursor-pointer">
                  <span className="text-slate-600 text-sm text-center">Glissez-déposez ici, ou cliquez pour sélectionner</span>
                  <input type="file" multiple onChange={(e) => onImagesChange(e.target.files)} className="hidden" />
                </label>

                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previews.map((url, i) => (
                      <img key={i} src={url} alt={`preview-${i}`} className="w-16 h-16 object-cover rounded-lg ring-1 ring-slate-200" />
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 sm:pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button type="button" onClick={closeAddModal} className="inline-flex items-center gap-2 rounded-xl border border-[#0B1E3A] bg-white px-4 py-2 text-sm hover:bg-gray-50 transition text-[#0B1E3A]" disabled={loading}>Annuler</button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow">
                  {loading ? "Création..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="relative w-full max-w-sm sm:max-w-md mt-16 rounded-3xl bg-white shadow-[0_25px_80px_rgba(0,0,0,.25)] ring-1 ring-gray-100">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-rose-500 to-red-600 shadow-lg ring-4 ring-white flex items-center justify-center text-white text-xl sm:text-2xl">
              <FaTrashAlt />
            </div>

            <div className="px-4 sm:px-6 pt-10 pb-4 border-b border-gray-100 text-center">
              <h3 id="delete-title" className="text-lg sm:text-xl font-semibold text-[#0B1E3A]">Supprimer ce produit ?</h3>
              {deletingName && <p className="mt-1 text-xs text-gray-500 font-medium truncate">« {deletingName} »</p>}
            </div>

            <div className="px-4 sm:px-6 py-5 text-sm text-gray-700">
              Cette action est <span className="font-semibold text-red-600">irréversible</span>. Voulez-vous vraiment supprimer ce produit ?
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => !submittingDelete && closeDeleteModal()} className="inline-flex items-center gap-2 rounded-xl border border-[#0B1E3A] bg-white px-4 py-2 text-sm hover:bg-gray-50 transition text-[#0B1E3A]" disabled={submittingDelete}>Annuler</button>
              <button onClick={submitDelete} disabled={submittingDelete} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition shadow">
                {submittingDelete ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE GALERIE */}
      {galleryOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog" aria-modal="true" aria-label="Galerie d'images"
          onClick={(e) => { if (e.target === e.currentTarget) setGalleryOpen(false); }}>
          <div className="relative w-[94vw] sm:w-[86vw] md:w-[70vw] h-[58vh] sm:h-[60vh] md:h-[65vh] bg-black/10 rounded-2xl overflow-hidden ring-1 ring-white/10">
            <button onClick={() => setGalleryOpen(false)} className="absolute top-3 right-3 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/90 hover:bg-white text-[#0B1E3A] shadow flex items-center justify-center" aria-label="Fermer" title="Fermer (Esc)">✕</button>
            <div className="absolute inset-0">
              <Image src={galleryImages[galleryIndex]} alt={`image-${galleryIndex + 1}`} fill className="object-contain select-none" sizes="100vw" priority />
            </div>
            <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/90 hover:bg-white text-[#0B1E3A] shadow grid place-items-center" aria-label="Image précédente" title="←">‹</button>
            <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/90 hover:bg-white text-[#0B1E3A] shadow grid place-items-center" aria-label="Image suivante" title="→">›</button>
            {galleryImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
                {galleryImages.map((_, i) => (
                  <button key={i} onClick={() => setGalleryIndex(i)} className={`h-2.5 rounded-full transition ${i === galleryIndex ? "w-6 bg-[#F7C600]" : "w-2.5 bg-white/60 hover:bg-white"}`} aria-label={`Aller à l'image ${i + 1}`} title={`Image ${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

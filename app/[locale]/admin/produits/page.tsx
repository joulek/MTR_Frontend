"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Category = {
  _id: string;
  label: string;
  translations?: { fr?: string; en?: string };
};

type Product = {
  _id: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  images: string[];
  category: Category | null;
};

export default function AdminProductsPage() {
  const t = useTranslations("admin.products");
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [nameFr, setNameFr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descFr, setDescFr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<FileList | null>(null);

  // Charger produits & catégories une seule fois
  useEffect(() => {
    (async () => {
      try {
        console.log("🔄 Fetching products...");
        const rp = await fetch(`${BACKEND}/api/produits`, { credentials: "include" });
        console.log("GET /api/produits status:", rp.status);
        const prodData = rp.ok ? await rp.json().catch(() => []) : [];
        console.log("Products data:", prodData);
        setProducts(Array.isArray(prodData) ? prodData : (prodData?.products ?? []));

        console.log("🔄 Fetching categories...");
        const rc = await fetch(`${BACKEND}/api/categories`, { credentials: "include" });
        console.log("GET /api/categories status:", rc.status);
        const catData = rc.ok ? await rc.json().catch(() => []) : [];
        console.log("Categories data:", catData);
        setCategories(Array.isArray(catData) ? catData : (catData?.categories ?? []));
      } catch (err) {
        console.error("❌ Initial fetch error:", err);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append("name_fr", nameFr);
    fd.append("name_en", nameEn);
    fd.append("description_fr", descFr);
    fd.append("description_en", descEn);
    fd.append("category", category);
    if (images) Array.from(images).forEach((img) => fd.append("images", img));

    console.log("➡️ Sending new product:", Object.fromEntries(fd.entries()));

    try {
      const res = await fetch(`${BACKEND}/api/produits`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      console.log("POST /api/produits status:", res.status);
      const data = await res.json().catch(() => null);
      console.log("POST response:", data);

      if (res.ok && data) {
        setProducts((prev) => [data, ...prev]);
        setNameFr(""); setNameEn(""); setDescFr(""); setDescEn("");
        setCategory(""); setImages(null);
      } else {
        alert(data?.message || "❌ Error creating product");
      }
    } catch (err) {
      console.error("❌ POST error:", err);
      alert("❌ Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    console.log("🗑 Deleting product:", id);
    try {
      const res = await fetch(`${BACKEND}/api/produits/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      console.log("DELETE /api/produits/:id status:", res.status);
      const data = await res.json().catch(() => null);
      console.log("DELETE response:", data);

      if (res.ok) setProducts((prev) => prev.filter((p) => p._id !== id));
      else alert(data?.message || "❌ Delete failed");
    } catch (err) {
      console.error("❌ DELETE error:", err);
      alert("❌ Network error");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Formulaire */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">{t("new")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              value={nameFr}
              onChange={(e) => setNameFr(e.target.value)}
              placeholder={t("name") + " (FR)"}
              className="border p-2 rounded w-full"
              required
            />
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={t("name") + " (EN)"}
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <textarea
              value={descFr}
              onChange={(e) => setDescFr(e.target.value)}
              placeholder={t("description") + " (FR)"}
              className="border p-2 rounded w-full"
            />
            <textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder={t("description") + " (EN)"}
              className="border p-2 rounded w-full"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">{t("chooseCategory")}</option>
            {categories.map((c) => {
              const nameFr = c.translations?.fr ?? c.label;
              const nameEn = c.translations?.en ?? c.translations?.fr ?? c.label;
              const display = locale === "fr" ? nameFr : nameEn;
              return (
                <option key={c._id} value={c._id}>
                  {display}
                </option>
              );
            })}
          </select>

          <input
            type="file"
            multiple
            onChange={(e) => setImages(e.target.files)}
            className="w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            {loading ? t("loading") : t("create")}
          </button>
        </form>
      </div>

      {/* Liste */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">{t("list")}</h2>
        {products.length === 0 ? (
          <p>{t("noData")}</p>
        ) : (
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">{t("name")}</th>
                <th className="p-2 border">{t("description")}</th>
                <th className="p-2 border">{t("category")}</th>
                <th className="p-2 border">{t("images")}</th>
                <th className="p-2 border">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-2">
                    {locale === "fr" ? p.name_fr : p.name_en || p.name_fr}
                  </td>
                  <td className="p-2 text-sm">
                    {locale === "fr" ? p.description_fr : p.description_en || p.description_fr}
                  </td>
                  <td className="p-2">
                    {p.category
                      ? (locale === "fr"
                          ? p.category.translations?.fr ?? p.category.label
                          : p.category.translations?.en ?? p.category.translations?.fr ?? p.category.label)
                      : "-"}
                  </td>
                  <td className="p-2 flex gap-2">
                    {p.images?.slice(0, 10).map((img, idx) => (
                      <Image
                        key={idx}
                        src={img}
                        alt="product"
                        width={50}
                        height={50}
                        className="rounded object-cover"
                      />
                    ))}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

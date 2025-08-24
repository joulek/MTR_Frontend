"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const API = `${BACKEND}/api`;

/* -------------------- Helpers -------------------- */
function slugify(s = "") {
  return String(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
function pickName(item, locale = "fr") {
  return (locale?.startsWith("en") ? item?.name_en : item?.name_fr) || item?.name_fr || item?.name_en || "";
}
function pickDesc(item, locale = "fr") {
  return (locale?.startsWith("en") ? item?.description_en : item?.description_fr) || "";
}
const toUrl = (src = "") =>
  src.startsWith("http") ? src : `${BACKEND}${src.startsWith("/") ? "" : "/"}${src}`;

/* -------------------- Règle optionnelle -------------------- */
// Garde ces slugs en mode "liste" quoi qu'il arrive (même si 1 seul produit)
const FORCE_LIST_SLUGS = new Set(["ressorts"]); // ajoute/supprime selon besoin

export default function ProductsByCategoryPage() {
  const { locale, slug } = useParams();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [products, setProducts] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);

  const [error, setError] = useState("");
  const [didAutoOpen, setDidAutoOpen] = useState(false);

  /* 1) Charger les catégories */
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingCats(true);
        const res = await fetch(`${API}/categories`, { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (e) {
        if (alive) setCategories([]);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();

    return () => {
      alive = false;
      if (!controller.signal.aborted) controller.abort();
    };
  }, []);

  /* Trouver la catégorie courante */
  const currentCategory = useMemo(() => {
    if (!categories?.length || !slug) return null;
    return (
      categories.find((c) => {
        const title =
          (c?.translations?.[locale] || c?.translations?.fr || c?.translations?.en || c?.label || "").trim();
        const s = c?.slug ? String(c.slug) : slugify(title);
        return s === slug;
      }) || null
    );
  }, [categories, slug, locale]);

  /* 2) Charger les produits de la catégorie */
  useEffect(() => {
    if (!currentCategory?._id) return;
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingProds(true);
        setError("");
        const res = await fetch(
          `${API}/produits/by-category/${currentCategory._id}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setError("Erreur lors du chargement des produits.");
      } finally {
        if (alive) setLoadingProds(false);
      }
    })();

    return () => {
      alive = false;
      if (!controller.signal.aborted) controller.abort();
    };
  }, [currentCategory?._id]);

  const pageTitle =
    currentCategory?.translations?.[locale] ||
    currentCategory?.translations?.fr ||
    currentCategory?.translations?.en ||
    currentCategory?.label ||
    String(slug || "").replace(/-/g, " ");

  /* 3) Auto-redirect si UN SEUL produit (et pas dans FORCE_LIST_SLUGS) */
  useEffect(() => {
    const forceList = FORCE_LIST_SLUGS.has(String(slug));

    if (!loadingProds && !loadingCats && !error) {
      if (!forceList && products.length === 1) {
        setDidAutoOpen(true);
        router.replace(`/${locale}/produits/${slug}/${products[0]._id}`);
      }
    }
  }, [loadingProds, loadingCats, error, products, slug, locale, router]);

  /* -------------------- RENDER -------------------- */
  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-20">
          {/* Fil d’Ariane */}
          <div className="mb-8">
            <nav className="text-sm text-slate-500">
              <button onClick={() => router.push(`/${locale}`)} className="hover:underline">Accueil</button>
              <span className="mx-2">/</span>
              <span className="text-slate-700 font-semibold capitalize">{pageTitle}</span>
            </nav>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#0B2239] capitalize">{pageTitle}</h1>
            <div className="mt-3 h-1 w-20 rounded-full bg-[#F5B301]" />
          </div>

          {/* États */}
          {(loadingCats || loadingProds || didAutoOpen) && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[280px] rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {error && !didAutoOpen && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
          )}

          {/* Grille produits — s’affiche seulement si PAS de redirect */}
          {!loadingCats && !loadingProds && !error && !didAutoOpen && products.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const title = pickName(p, locale);
                const desc = pickDesc(p, locale);
                const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : "/placeholder.png";
                const imgUrl = toUrl(img);
                return (
                  <article key={p._id} className="group overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
                    <div className="relative h-48">
                      <Image
                        src={imgUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-[#0B2239]">{title}</h3>
                      {desc && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{desc}</p>}
                      <div className="mt-4">
                        <a
                          href={`/${locale}/produits/${slug}/${p._id}`}
                          className="inline-block rounded-lg bg-[#F5B301] px-4 py-2 text-sm font-semibold text-[#0B2239] hover:brightness-95"
                        >
                          Voir détail
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Aucune donnée */}
          {!loadingCats && !loadingProds && !error && !didAutoOpen && products.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              Aucun produit trouvé pour cette catégorie.
            </div>
          )}
        </div>
      </main>
    </>
  );
}

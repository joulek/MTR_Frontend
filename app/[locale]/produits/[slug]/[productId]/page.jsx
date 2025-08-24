"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const API = `${BACKEND}/api`;

// i18n helper
const pick = (obj, frKey, enKey, locale = "fr") =>
  (locale?.startsWith("en") ? obj?.[enKey] : obj?.[frKey]) || obj?.[frKey] || obj?.[enKey] || "";

// URL sûre (تطابق remotePatterns و ما تبدّلش placeholder)
const toUrl = (src = "") => {
  if (!src) return "/placeholder.png";
  if (/^(data|blob):/i.test(src)) return src;
  const s = String(src).replace(/\\/g, "/");
  if (s.startsWith("/placeholder") || s.startsWith("/images") || s.startsWith("/icons") || s.startsWith("/logo") || s.startsWith("/_next/")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/uploads/") ? s : `/uploads/${s.replace(/^\/+/, "")}`;
  return `${BACKEND}${path}`;
};

export default function ProductDetailPage() {
  const { locale, slug, productId } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [activeIdx, setActiveIdx] = useState(0);
  const [hoverZoom, setHoverZoom] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const [related, setRelated] = useState([]);
  const [loadingRel, setLoadingRel] = useState(false);

  // fetch produit
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setErr("");
        let res = await fetch(`${API}/produits/${productId}`, { cache: "no-store" });
        if (!res.ok) {
          const res2 = await fetch(`${API}/products/${productId}`, { cache: "no-store" });
          if (!res2.ok) throw new Error(`HTTP ${res.status} / ${res2.status}`);
          res = res2;
        }
        const data = await res.json();
        if (!alive) return;
        setProduct(data);
      } catch {
        if (alive) setErr("Impossible de charger ce produit.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [productId]);

  const name = product ? pick(product, "name_fr", "name_en", locale) : "";
  const desc = product ? pick(product, "description_fr", "description_en", locale) : "";

  // images: string | { url, title_fr, title_en, desc_fr, desc_en }
  const imagesRaw = Array.isArray(product?.images) && product.images.length ? product.images : ["/placeholder.png"];
  const imgUrl = (i) => {
    const it = imagesRaw[i] ?? imagesRaw[0];
    return toUrl(typeof it === "string" ? it : (it.url || it.src || it.path || ""));
  };
  const imgTitle = (i) => {
    const it = imagesRaw[i] ?? imagesRaw[0];
    if (typeof it === "string") return name;
    return pick(it, "title_fr", "title_en", locale) || name;
  };
  const imgDesc = (i) => {
    const it = imagesRaw[i] ?? imagesRaw[0];
    if (typeof it === "string") return desc;
    return pick(it, "desc_fr", "desc_en", locale) || desc;
  };

  // produits associés
  useEffect(() => {
    const catId = product?._id && (product?.category?._id || product?.categoryId || product?.category_id);
    if (!catId) return;
    let alive = true;
    (async () => {
      try {
        setLoadingRel(true);
        const r = await fetch(`${API}/produits/by-category/${catId}`, { cache: "no-store" });
        const data = r.ok ? await r.json() : [];
        if (!alive) return;
        setRelated((Array.isArray(data) ? data : []).filter(p => p?._id !== productId).slice(0, 6));
      } finally {
        if (alive) setLoadingRel(false);
      }
    })();
    return () => { alive = false; };
  }, [product?._id, product?.category, product?.categoryId, product?.category_id, productId]);

  /* Keyboard: ← →, ESC */
  const onKey = useCallback((e) => {
    if (!imagesRaw?.length) return;
    if (e.key === "ArrowRight") setActiveIdx((i) => (i + 1) % imagesRaw.length);
    if (e.key === "ArrowLeft") setActiveIdx((i) => (i - 1 + imagesRaw.length) % imagesRaw.length);
    if (e.key === "Escape") setLightbox(false);
  }, [imagesRaw]);
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 min-h-screen">
        {/* décor */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#F5B301]/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#0B2239]/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-8 pb-24">
          {/* Fil d’Ariane */}
          <motion.nav initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-slate-500 mb-6">
            <button onClick={() => router.push(`/${locale}`)} className="hover:underline">Accueil</button>
            <span className="mx-2">/</span>
            <button onClick={() => router.push(`/${locale}/produits/${slug}`)} className="hover:underline capitalize">
              {String(slug || "").replace(/-/g, " ")}
            </button>
            <span className="mx-2">/</span>
            <span className="text-slate-700 font-semibold">{name || "Produit"}</span>
          </motion.nav>

          {/* Title produit */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0B2239]">{name || "—"}</h1>
            <div className="mt-3 h-[6px] w-36 rounded-full bg-gradient-to-r from-[#F5B301] via-[#F5B301] to-transparent" />
          </motion.div>

          {/* ====== Mise en page WIX-like ====== */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            {/* Image grande à gauche */}
            <section
              className="relative h-[460px] rounded-2xl overflow-hidden bg-white shadow ring-1 ring-slate-200 cursor-zoom-in"
              onMouseEnter={() => setHoverZoom(true)}
              onMouseLeave={() => setHoverZoom(false)}
              onClick={() => setLightbox(true)}
              aria-label="Agrandir l’image"
              role="button"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.1, scale: 1.02 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imgUrl(activeIdx)}
                    alt={imgTitle(activeIdx)}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className={`object-cover transition-transform duration-500 ${hoverZoom ? "scale-[1.03]" : "scale-100"}`}
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* arrows overlay */}
              {imagesRaw.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + imagesRaw.length) % imagesRaw.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-[#0B2239] shadow hover:bg-white"
                    aria-label="Précédent"
                  >‹</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % imagesRaw.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-[#0B2239] shadow hover:bg-white"
                    aria-label="Suivant"
                  >›</button>
                </>
              )}
            </section>

            {/* Pane à droite: titre/description + commandes */}
            <aside className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-[#0B2239]">{imgTitle(activeIdx)}</h2>
                {imagesRaw.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveIdx((i) => (i - 1 + imagesRaw.length) % imagesRaw.length)}
                      className="h-9 w-9 rounded-full border border-slate-200 text-[#0B2239] hover:bg-slate-50"
                      aria-label="Précédent"
                    >‹</button>
                    <button
                      onClick={() => setActiveIdx((i) => (i + 1) % imagesRaw.length)}
                      className="h-9 w-9 rounded-full border border-slate-200 text-[#0B2239] hover:bg-slate-50"
                      aria-label="Suivant"
                    >›</button>
                  </div>
                )}
              </div>

              <p className="mt-3 text-slate-700 leading-relaxed">
                {imgDesc(activeIdx)}
              </p>

              {/* dots */}
              {imagesRaw.length > 1 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {imagesRaw.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      aria-label={`Aller à l’image ${i+1}`}
                      className={`h-2.5 w-2.5 rounded-full ${i === activeIdx ? "bg-[#F5B301]" : "bg-slate-300 hover:bg-slate-400"}`}
                    />
                  ))}
                </div>
              )}

              {/* CTA (اختياري) */}
            
            </aside>
          </div>

          {/* Thumbnails sous l’image (facultatif) */}
          {imagesRaw.length > 1 && (
            <div className="mt-6 grid grid-cols-5 gap-3 lg:max-w-[60%]">
              {imagesRaw.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`relative h-24 rounded-xl overflow-hidden ring-2 transition ${i === activeIdx ? "ring-[#F5B301]" : "ring-transparent hover:ring-slate-300"}`}
                  aria-label={`Image ${i + 1}`}
                >
                  <Image
                    src={imgUrl(i)}
                    alt={imgTitle(i)}
                    fill
                    sizes="(max-width: 1024px) 20vw, 10vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Produits associés */}
          {!loadingRel && related.length > 0 && (
            <section className="mt-16">
              <h3 className="text-xl font-bold text-[#0B2239]">Produits associés</h3>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => {
                  const t = pick(p, "name_fr", "name_en", locale);
                  const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : "/placeholder.png";
                  return (
                    <article key={p._id} className="group overflow-hidden rounded-2xl bg-white shadow ring-1 ring-slate-200">
                      <div className="relative h-40">
                        <Image src={toUrl(typeof img === "string" ? img : (img.url || img.src || ""))} alt={t} fill sizes="(max-width:1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-4">
                        <h4 className="line-clamp-2 font-semibold text-[#0B2239]">{t}</h4>
                        <div className="mt-3">
                          <a href={`/${locale}/produits/${slug}/${p._id}`} className="inline-block rounded-full bg-[#F5B301] px-4 py-1.5 text-sm font-semibold text-[#0B2239] hover:brightness-95">
                            Voir détail
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {err && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</div>
          )}
        </div>
      </main>

      {/* Lightbox plein écran */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/90 text-[#0B2239] shadow grid place-items-center"
              aria-label="Fermer"
            >✕</button>

            {imagesRaw.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + imagesRaw.length) % imagesRaw.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-[#0B2239] shadow"
                  aria-label="Précédent"
                >‹</button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % imagesRaw.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-[#0B2239] shadow"
                  aria-label="Suivant"
                >›</button>
              </>
            )}

            <div className="absolute inset-0 p-10" onClick={(e) => e.stopPropagation()}>
              <Image src={imgUrl(activeIdx)} alt={imgTitle(activeIdx)} fill className="object-contain" sizes="100vw" priority />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* shimmer */}
      <style jsx>{`
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after {
          content: ""; position: absolute; inset: 0; transform: translateX(-100%);
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 50%, rgba(255,255,255,0) 100%);
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </>
  );
}

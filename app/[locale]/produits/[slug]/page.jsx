"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { motion, useScroll, useTransform } from "framer-motion";

/* -------------------- Consts -------------------- */
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const API = `${BACKEND}/api`;

/* Helpers */
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
  src?.startsWith("http") ? src : `${BACKEND}${src?.startsWith("/") ? "" : "/"}${src}`;

/* Force list view for specific slugs (bypass carousel auto-open single item) */
const FORCE_LIST_SLUGS = new Set(["ressorts"]);

/* -------------------- Anim presets -------------------- */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay } },
});
const containerStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemPop = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

/* =======================================================
   Carousel Component (scroll-snap + buttons + touch/drag)
   ======================================================= */
function Carousel({ items, ariaLabel = "Carrousel", renderItem }) {
  const viewportRef = useRef(null);
  const slideRef = useRef(null);
  const [slideW, setSlideW] = useState(0);
  const [index, setIndex] = useState(0);

  // Mesure la largeur d’une “slide”
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (slideRef.current) setSlideW(slideRef.current.offsetWidth + 24 /* gap approx */);
    });
    if (slideRef.current) {
      setSlideW(slideRef.current.offsetWidth + 24);
      ro.observe(slideRef.current);
    }
    return () => ro.disconnect();
  }, [items.length]);

  // Met à jour l’index visible en scroll
  const onScroll = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !slideW) return;
    const i = Math.round(vp.scrollLeft / slideW);
    setIndex(Math.max(0, Math.min(i, items.length - 1)));
  }, [slideW, items.length]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const scrollTo = (i) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const clamped = Math.max(0, Math.min(i, items.length - 1));
    vp.scrollTo({ left: clamped * (slideW || vp.clientWidth), behavior: "smooth" });
  };

  const next = () => scrollTo(index + 1);
  const prev = () => scrollTo(index - 1);

  // Navigation clavier (←/→)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, slideW]);

  if (!items?.length) return null;

  return (
    <div className="relative">
      {/* Viewport */}
      <div
        ref={viewportRef}
        aria-label={ariaLabel}
        className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Hide scrollbars (Webkit) */}
        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

        {items.map((it, i) => (
          <div
            key={i}
            ref={i === 0 ? slideRef : undefined}
            data-snap
            className="snap-start shrink-0 w-[88%] sm:w-[62%] lg:w-[42%] xl:w-[34%]"
          >
            {renderItem(it, i)}
          </div>
        ))}
      </div>

      {/* Controls */}
      {items.length > 1 && (
        <>
          <button
            aria-label="Précédent"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-11 w-11 rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white disabled:opacity-40"
            disabled={index <= 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="#0B2239" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            aria-label="Suivant"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-11 w-11 rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white disabled:opacity-40"
            disabled={index >= items.length - 1}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="#0B2239" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Aller à l’élément ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-6 bg-[#0B2239]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =======================
   Tile style “Overlay”
   ======================= */
function ProductTileOverlay({ p, locale, slug, badge }) {
  const title = pickName(p, locale);
  const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : "/placeholder.png";
  const imgUrl = toUrl(img);
  const cta = locale?.startsWith("en") ? "VIEW DETAIL" : "VOIR DÉTAIL";

  return (
    <a
      href={`/${locale}/produits/${slug}/${p._id}`}
      className="group relative block h-[420px] sm:h-[360px] overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B301]"
    >
      {/* Image */}
      <Image
        src={imgUrl}
        alt={title}
        fill
        sizes="(max-width: 440px) 92vw, (max-width: 1024px) 80vw, 60vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        priority={false}
      />

      {/* Voiles — ظاهرة وقت الـhover/keyboard-focus فقط */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      </div>

      {/* Badge ثابت */}
      {badge ? (
        <div className="absolute left-4 bottom-4 z-10">
          <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0B2239] shadow">
            {badge}
          </span>
        </div>
      ) : null}

      {/* اللوحة البيضاء — مخفية عادي، تبان وقت hover/focus */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                   flex flex-col items-center w-[min(92vw,820px)] z-10
                   opacity-0 scale-[.98] translate-y-2
                   transition-all duration-300
                   group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
                   group-focus-visible:opacity-100 group-focus-visible:scale-100 group-focus-visible:translate-y-0"
      >
       <div className="-mt rounded-3xl bg-white/85 backdrop-blur px-9 py-6 md:px-10 md:py-8 shadow-2xl ring-1 ring-slate-200 text-center">
          <p className="text-[11px] font-extrabold tracking-[0.35em] text-[#F5B301]">MTR</p>
          <h3 className="mt-1 text-xl md:text-2xl font-extrabold text-[#0B2239]">{title}</h3>
        </div>

        <div className="mt-1">
          <span className="inline-flex items-center gap-3 rounded-full bg-[#F5B301] px-7 py-3 md:px-10 md:py-4
                           text-base md:text-lg font-extrabold text-[#0B2239] shadow-xl
                           underline decoration-2 underline-offset-4">
            {cta}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M8 5l7 7-7 7" stroke="#0B2239" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}





/* =======================================================
   Page
   ======================================================= */
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
      } catch {
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

  /* 2) Charger les produits */
  useEffect(() => {
    if (!currentCategory?._id) return;
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingProds(true);
        setError("");
        const res = await fetch(`${API}/produits/by-category/${currentCategory._id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setProducts(Array.isArray(data) ? data : []);
      } catch {
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

  /* 3) Auto-redirect si UN SEUL produit (et pas forcé en liste) */
  useEffect(() => {
    const forceList = FORCE_LIST_SLUGS.has(String(slug));
    if (!loadingProds && !loadingCats && !error) {
      if (!forceList && products.length === 1) {
        setDidAutoOpen(true);
        router.replace(`/${locale}/produits/${slug}/${products[0]._id}`);
      }
    }
  }, [loadingProds, loadingCats, error, products, slug, locale, router]);

  /* Micro-parallax header */
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.98]);

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 min-h-screen">
        {/* Hero / Bandeau */}
        <motion.section ref={heroRef} style={{ y, scale }} className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pt-10">
            <motion.nav {...fadeUp(0.05)} className="text-sm text-slate-500">
              <button onClick={() => router.push(`/${locale}`)} className="hover:underline">
                Accueil
              </button>
              <span className="mx-2">/</span>
              <span className="text-slate-700 font-semibold capitalize">{pageTitle}</span>
            </motion.nav>

            <motion.h1
              {...fadeUp(0.1)}
              className="mt-3 text-3xl md:text-4xl font-extrabold text-[#0B2239] capitalize tracking-tight"
            >
              {pageTitle}
            </motion.h1>

            <motion.div
              {...fadeUp(0.18)}
              className="mt-4 h-[6px] w-36 rounded-full bg-gradient-to-r from-[#F5B301] via-[#F5B301] to-transparent"
            />
          </div>

          {/* décor discret */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-16 -right-24 h-56 w-56 rounded-full bg-[#F5B301]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#0B2239]/10 blur-3xl" />
          </div>
        </motion.section>

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-6">
          {/* États */}
          {(loadingCats || loadingProds || didAutoOpen) && (
            <motion.div
              variants={containerStagger}
              initial="initial"
              animate="animate"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div key={i} variants={itemPop}>
                  <ShimmerCard />
                </motion.div>
              ))}
            </motion.div>
          )}

          {error && !didAutoOpen && (
            <motion.div {...fadeUp(0)} className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </motion.div>
          )}

          {/* Carousel produits — style overlay (plus de “cards”) */}
          {!loadingCats && !loadingProds && !error && !didAutoOpen && products.length > 0 && (
            <motion.div {...fadeUp(0.06)}>
              <Carousel
                items={products}
                ariaLabel={`Produits de la catégorie ${pageTitle}`}
                renderItem={(p) => (
                  <ProductTileOverlay p={p} locale={locale} slug={slug} badge={pageTitle} />
                )}
              />
            </motion.div>
          )}

          {/* Aucune donnée */}
          {!loadingCats && !loadingProds && !error && !didAutoOpen && products.length === 0 && (
            <motion.div
              {...fadeUp(0)}
              className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
            >
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#F5B301]/20 grid place-items-center">
                <span className="text-[#0B2239] text-xl">☰</span>
              </div>
              <h4 className="text-[#0B2239] font-semibold">Aucun produit</h4>
              <p className="text-sm text-slate-600 mt-1">
                Aucun produit trouvé pour cette catégorie. Revenez plus tard.
              </p>
            </motion.div>
          )}
        </section>
      </main>
    </>
  );
}

/* ============ Skeleton Shimmer ============ */
function ShimmerCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="relative h-48">
        <div className="h-full w-full bg-slate-200 shimmer" />
      </div>
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-slate-200 rounded shimmer" />
        <div className="h-3 w-11/12 bg-slate-200 rounded shimmer" />
        <div className="h-3 w-9/12 bg-slate-200 rounded shimmer" />
        <div className="h-9 w-32 bg-slate-200 rounded-full shimmer" />
      </div>
      <style jsx>{`
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.6) 50%,
            rgba(255,255,255,0) 100%);
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

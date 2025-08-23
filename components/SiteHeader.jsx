"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Facebook, Linkedin } from "lucide-react";
import { CircleFlag } from 'react-circle-flags';


/* ---------------------------- API backend ---------------------------- */
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const API = `${BACKEND}/api`;

/* --------------------------- Helpers --------------------------- */
function pickName(cat, locale) {
  return (
    (cat?.translations && (cat.translations[locale] || cat.translations.fr || cat.translations.en)) ||
    cat?.label ||
    ""
  );
}
function slugify(s = "") {
  return String(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
const makeCatHref = (cat, locale) =>
  `/${locale}/produits/${cat?.slug || slugify(pickName(cat, locale))}`;

/* remplace /fr ou /en en tête de path, en conservant le reste et la query */
function swapLocaleInPath(path, nextLocale) {
  const [p, q] = (path || "/").split("?");
  let base = p || "/";
  if (/^\/(fr|en)(\/|$)/.test(base)) {
    base = base.replace(/^\/(fr|en)(?=\/|$)/, `/${nextLocale}`);
  } else if (base === "/") {
    base = `/${nextLocale}`;
  } else {
    base = `/${nextLocale}${base}`;
  }
  return q ? `${base}?${q}` : base;
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState("fr");
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const router = useRouter();
  const pathname = usePathname() || "/";

  /* Détecter la langue depuis <html lang> / navigateur */
  useEffect(() => {
    const pick = () => {
      const htmlLang = document?.documentElement?.lang || "";
      const navLang = navigator?.language || "";
      const l = (htmlLang || navLang || "fr").toLowerCase();
      setLocale(l.startsWith("en") ? "en" : "fr");
    };
    pick();
    const mo = new MutationObserver(pick);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => mo.disconnect();
  }, []);

  /* Charger catégories (menu Produits) */
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingCats(true);
        const res = await fetch(`${API}/categories`, { method: "GET", cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (err) {
        const isAbort =
          err?.name === "AbortError" ||
          err?.message === "component-unmounted" ||
          err === "component-unmounted";
        if (isAbort) return;
        if (alive) setCategories([]);
        // Optionnel: console.warn("SiteHeader: échec chargement catégories:", err);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();
    return () => {
      alive = false;
      if (!controller.signal.aborted) controller.abort(); // abort silencieux
    };
  }, []);

  /* -------- scroll helper: descendre sans # dans l'URL -------- */
  const goToSection = useCallback(
    async (id, closeMenu) => {
      const homePaths = ["/", "/fr", "/en", "/fr/", "/en/"];
      const doScroll = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (closeMenu) setOpen(false);
      };
      if (!homePaths.includes(pathname)) {
        await router.push(`/${locale}`, { scroll: true });
        setTimeout(doScroll, 60);
      } else {
        doScroll();
      }
    },
    [pathname, router, locale]
  );

  /* -------- Sélecteur de langue (drapeaux) -------- */
  const switchLang = useCallback(
    (next) => {
      if (next === locale) return;
      document.documentElement.lang = next; // pour ton observer
      setLocale(next);
      const nextPath = swapLocaleInPath(pathname, next);
      router.push(nextPath, { scroll: false });
      try { localStorage.setItem("mtr_locale", next); } catch { }
    },
    [pathname, router, locale]
  );

  /* -------- Menu Produits (parents → enfants) -------- */
  const ProductsMenu = ({ cats, locale }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [hoveredParent, setHoveredParent] = useState(null);

    const childrenMap = new Map();
    const getParentId = (c) => c?.parent?._id || c?.parent || c?.parentId || c?.parent_id || null;
    const getId = (c) => c?._id || pickName(c, locale);

    cats.forEach((c) => {
      const pid = getParentId(c);
      if (!pid) return;
      const arr = childrenMap.get(pid) || [];
      arr.push(c);
      childrenMap.set(pid, arr);
    });
    const tops = cats.filter((c) => !getParentId(c));

    return (
      <div
        className="relative"
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => { setMenuOpen(false); setHoveredParent(null); }}
      >
        <button
          type="button"
          className="group relative px-3 py-2 text-sm font-semibold text-[#0B2239] hover:text-[#F5B301]"
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : "false"}
        >
          Produits <span className="ml-1">▾</span>
        </button>

        {menuOpen && (
          <div className="absolute left-0 top-full z-50 before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-2">
            {/* liste parents */}
            <ul className="relative w-64 rounded-lg bg-white p-2 shadow-2xl ring-1 ring-slate-200 after:content-[''] after:absolute after:top-0 after:right-[-8px] after:w-2 after:h-full">
              {tops.map((parent) => {
                const id = getId(parent);
                const label = pickName(parent, locale);
                const hasChildren = !!childrenMap.get(id);
                const active = hoveredParent === id;
                return (
                  <li key={id}>
                    <Link
                      href={makeCatHref(parent, locale)}
                      onMouseEnter={() => setHoveredParent(id)}
                      className={`flex items-center justify-between rounded-md px-4 py-3 text-sm transition
                        ${active ? "bg-[#F5B301] text-[#0B2239]" : "text-[#0B2239] hover:bg-[#F5B301] hover:text-[#0B2239]"}`}
                    >
                      {label}
                      {hasChildren ? <span className="ml-3 text-xs opacity-70">›</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* sous-menu enfants */}
            {hoveredParent && (childrenMap.get(hoveredParent) || []).length > 0 && (
              <ul className="absolute left-[100%] top-0 ml-2 w-64 rounded-lg bg-white p-2 shadow-2xl ring-1 ring-slate-200">
                {childrenMap.get(hoveredParent).map((child) => (
                  <li key={getId(child)}>
                    <Link
                      href={makeCatHref(child, locale)}
                      className="block rounded-md px-4 py-3 text-sm text-[#0B2239] hover:bg-slate-50"
                    >
                      {pickName(child, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  /* --------------------------- RENDER --------------------------- */
  return (
    <header className="sticky top-0 z-40">
      {/* --------- Top bar bleu marine --------- */}
      <div className="bg-[#0B2239] text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs sm:text-sm">
          {/* liens à gauche */}
          <nav className="flex items-center gap-4">
            <button type="button" onClick={() => goToSection("apropos")} className="opacity-90 transition hover:text-[#F5B301]" role="link">
              À propos
            </button>
            <span className="opacity-40">|</span>
            <button type="button" onClick={() => goToSection("contact")} className="opacity-90 transition hover:text-[#F5B301]" role="link">
              Help Desk
            </button>
            <span className="opacity-40">|</span>
            <button type="button" onClick={() => goToSection("presentation")} className="opacity-90 transition hover:text-[#F5B301]" role="link">
              Présentation
            </button>
          </nav>

          {/* droite : réseaux + sélecteur langue par drapeaux */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=100076355199317&locale=fr_FR"
              target="_blank" rel="noreferrer"
              className="rounded-full bg-white/10 p-1.5 hover:bg-white/20" aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/manufacutre-tunisienne-des-ressorts-22b388276/"
              target="_blank" rel="noreferrer"
              className="rounded-full bg-white/10 p-1.5 hover:bg-white/20" aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>

            {/* Sélecteur langue (corrigé) */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => switchLang("fr")}
                className={`${locale === "fr" ? "ring-2 ring-[#F5B301] rounded-full" : ""} p-0 bg-transparent border-0`}
                title="Français"
                aria-pressed={locale === "fr"}
              >
                <CircleFlag countryCode="fr" style={{ width: "20px", height: "20px" }} />
              </button>

              <button
                onClick={() => switchLang("en")}
                className={`${locale === "en" ? "ring-2 ring-[#F5B301] rounded-full" : ""} p-0 bg-transparent border-0`}
                title="English"
                aria-pressed={locale === "en"}
              >
                <CircleFlag countryCode="us" style={{ width: "20px", height: "20px" }} />
              </button>
            </div>



          </div>
        </div>
      </div>

      {/* --------- Barre principale --------- */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="MTR logo" width={100} height={100} className="object-contain" priority />
            </Link>

            {/* nav desktop */}
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/" className="px-3 py-2 text-sm font-semibold text-[#0B2239] hover:text-[#F5B301]">
                Accueil
              </Link>

              <button
                type="button"
                onClick={() => goToSection("presentation")}
                className="px-3 py-2 text-sm font-semibold text-[#0B2239] hover:text-[#F5B301]" role="link"
              >
                L&apos;entreprise
              </button>

              {!loadingCats && <ProductsMenu cats={categories} locale={locale} />}

              <button
                type="button"
                onClick={() => goToSection("contact")}
                className="px-3 py-2 text-sm font-semibold text-[#0B2239] hover:text-[#F5B301]" role="link"
              >
                Contact
              </button>

              <button
                type="button"
                onClick={() => goToSection("localisation")}
                className="px-3 py-2 text-sm font-semibold text-[#0B2239] hover:text-[#F5B301]" role="link"
              >
                Localisation
              </button>
            </nav>

            {/* CTA + burger */}
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/devis`}
                className="hidden rounded-full bg-[#F5B301] px-4 py-2 text-sm font-semibold text-[#0B2239] shadow hover:brightness-95 md:inline-block"
              >
                Demander un devis
              </Link>
              <button
                onClick={() => setOpen((s) => !s)}
                aria-label="Ouvrir le menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-[#0B2239] md:hidden"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* menu mobile */}
        {open && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
              <Link href="/" className="rounded px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>
                Accueil
              </Link>

              <button
                type="button"
                onClick={() => goToSection("presentation", true)}
                className="text-left rounded px-3 py-2 hover:bg-slate-50" role="link"
              >
                L&apos;entreprise
              </button>

              <button
                type="button"
                onClick={() => goToSection("specialites", true)}
                className="text-left rounded px-3 py-2 hover:bg-slate-50" role="link"
              >
                Produits
              </button>

              <button
                type="button"
                onClick={() => goToSection("contact", true)}
                className="text-left rounded px-3 py-2 hover:bg-slate-50" role="link"
              >
                Contact
              </button>

              <button
                type="button"
                onClick={() => goToSection("localisation", true)}
                className="text-left rounded px-3 py-2 hover:bg-slate-50" role="link"
              >
                Localisation
              </button>

              <Link
                href={`/${locale}/devis`}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl bg-[#F5B301] px-4 py-2 text-center text-sm font-semibold text-[#0B2239] shadow hover:brightness-95"
              >
                Demander un devis
              </Link>
            </div>
          </div>
        )}
      </div>
    </header >
  );
}

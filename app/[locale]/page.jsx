"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  PhoneCall, Mail, MapPin, CheckCircle, Send, Facebook, Linkedin,
  ArrowUp, ChevronRight, Factory, Cog, Wrench
} from "lucide-react";

/* ---------------------------- API backend ---------------------------- */
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const API = `${BACKEND}/api`;

/* ------------------------- Section active au scroll ------------------------ */
function useActiveSection() {
  const [active, setActive] = useState("accueil");
  useEffect(() => {
    const ids = ["accueil", "presentation", "specialites", "apropos", "contact", "localisation"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return active;
}



/* --------------------------------- View ---------------------------------- */
export default function HomeMTR() {
  const active = useActiveSection();
  const [open, setOpen] = useState(false);
  const yearsExp = new Date().getFullYear() - 1994;

  /* --------- Langue (FR par défaut, EN si <html lang="en">) --------- */
  const [locale, setLocale] = useState("fr");
  useEffect(() => {
    const pick = () => {
      const htmlLang = document?.documentElement?.lang || "";
      const navLang = navigator?.language || "";
      const l = (htmlLang || navLang || "fr").toLowerCase();
      setLocale(l.startsWith("en") ? "en" : "fr");
    };
    pick();
    const el = document.documentElement;
    const mo = new MutationObserver(pick);
    mo.observe(el, { attributes: true, attributeFilter: ["lang"] });
    return () => mo.disconnect();
  }, []);

  /* ------------------ Récupération des catégories depuis la BD ------------------ */
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingCats(true);
        const res = await fetch(`${API}/categories`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (err) {
        console.error("Erreur chargement catégories:", err);
        if (!alive) return;
        setCategories([]);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []); // charge au montage


  

  const NavLink = ({ href, id, children }) => {
    const isActive = active === id;
    return (
      <a
        href={href}
        className={`group relative px-3 py-2 text-sm font-semibold transition-colors ${isActive ? "text-[#F5B301]" : "text-[#0B2239] hover:text-[#F5B301]"
          }`}
        onClick={() => setOpen(false)}
      >
        {children}
        <span
          className={`pointer-events-none absolute left-3 right-3 -bottom-[6px] h-[3px] origin-left rounded-full bg-[#F5B301] transition-transform duration-200 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
        />
      </a>
    );
  };


  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ================================ NAVBAR ================================ */}
      <header className="sticky top-0 z-40">
        {/* Bandeau supérieur */}
        <div className="bg-[#0B2239] text-white">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs sm:text-sm">
            <nav className="flex items-center gap-4">
              <a href="#presentation" className="opacity-90 transition hover:text-[#F5B301]">À propos</a>
              <span className="opacity-40">|</span>
              <a href="#contact" className="opacity-90 transition hover:text-[#F5B301]">Help Desk</a>
              <span className="opacity-40">|</span>
              <a href="#specialites" className="opacity-90 transition hover:text-[#F5B301]">Produits</a>
            </nav>

            <div className="hidden items-center gap-2 sm:flex">
              <a
                href="https://www.facebook.com/profile.php?id=100076355199317&locale=fr_FR"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/manufacutre-tunisienne-des-ressorts-22b388276/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/21698333883"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                aria-label="WhatsApp"
                title="WhatsApp : +216 98 333 883"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-500" fill="currentColor">
                  <path d="M20.52 3.48A11.9 11.9 0 0012 .07 11.93 11.93 0 001.6 17.93L.07 24l6.2-1.63A11.93 11.93 0 0012 23.84C18.6 23.84 24 18.48 24 11.9c0-3.2-1.25-6.2-3.48-8.42zM12 21.5c-1.9 0-3.73-.5-5.34-1.46l-.38-.23-3.67.97.98-3.58-.25-.37A9.93 9.93 0 1122 11.9c0 5.5-4.48 9.6-10 9.6zm5.14-7.44c-.28-.14-1.64-.8-1.9-.9-.26-.1-.45-.14-.64.14-.19.27-.73.9-.9 1.09-.17.19-.34.21-.62.07-.28-.14-1.17-.43-2.23-1.36-.82-.73-1.37-1.64-1.53-1.91-.16-.27-.02-.42.12-.55.12-.12.28-.32.42-.48.14-.16.19-.27.28-.46.09-.19.05-.35-.02-.48-.07-.14-.64-1.55-.88-2.13-.23-.56-.47-.49-.64-.5h-.55c-.19 0-.5.07-.76.35-.26.27-1 1-1 2.43 0 1.43 1.03 2.82 1.18 3.01.14.19 2.03 3.09 4.93 4.33.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.64-.67 1.87-1.32.23-.65.23-1.21.16-1.32-.07-.12-.26-.19-.54-.33z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Barre principale */}
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex h-16 items-center justify-between">
              {/* Logo + baseline */}
              <a href="#accueil" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="MTR logo"
                  width={100}
                  height={100}
                  className="object-contain"
                  priority
                />
                <div className="leading-tight">
                  <p className="text-[11px] text-slate-500">
                    Manufacture Tunisienne des Ressorts
                  </p>
                </div>
              </a>

              {/* Navigation desktop */}
              <nav className="hidden items-center gap-1 md:flex">
                <NavLink href="#accueil" id="accueil">Accueil</NavLink>
                <NavLink href="#presentation" id="presentation">L'entreprise</NavLink>
                <NavLink href="#specialites" id="specialites">Produits</NavLink>
                <NavLink href="#contact" id="contact">Contact</NavLink>
                <NavLink href="#localisation" id="localisation">Localisation</NavLink>
              </nav>

              {/* CTA + burger */}
              <div className="flex items-center gap-3">
                <a
                  href="#contact"
                  className="hidden rounded-full bg-[#F5B301] px-4 py-2 text-sm font-semibold text-[#0B2239] shadow hover:brightness-95 md:inline-block"
                >
                  Demander un devis
                </a>
                <button
                  onClick={() => setOpen((s) => !s)}
                  aria-label="Ouvrir le menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-[#0B2239] md:hidden"
                >
                  <svg
                    className={`transition ${open ? "rotate-90" : ""}`}
                    width="22" height="22" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    {open ? (
                      <path d="M18 6L6 18M6 6l12 12" />
                    ) : (
                      <>
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Menu mobile */}
          {open && (
            <div className="md:hidden border-t border-slate-200 bg-white">
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-col gap-1">
                  <a href="#accueil" className="rounded px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Accueil</a>
                  <a href="#presentation" className="rounded px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>L'entreprise</a>
                  <a href="#specialites" className="rounded px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Produits</a>
                  <a href="#contact" className="rounded px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Contact</a>
                  <a href="#localisation" className="rounded px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Localisation</a>
                  <div className="h-px my-2 bg-slate-200" />
                  <a href="#contact" onClick={() => setOpen(false)} className="rounded-xl bg-[#F5B301] px-4 py-2 text-center text-sm font-semibold text-[#0B2239] shadow hover:brightness-95">Demander un devis</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      {/* ============================= FIN NAVBAR ============================== */}

      {/* HERO */}
      <section
        id="accueil"
        className="relative flex items-center justify-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-32 text-center">
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Ressorts industriels & solutions de traction
          </h1>
          <p className="mt-6 text-lg text-gray-200 md:text-xl">
            Qualité, précision, fiabilité – MTR conçoit et fabrique vos ressorts sur mesure.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#contact" className="rounded-full bg-[#F5B301] px-6 py-3 font-semibold text-[#0B2239] hover:brightness-95">
              Contact rapide
            </a>
            <a href="#specialites" className="rounded-full border border-[#F5B301] px-6 py-3 font-semibold text-[#F5B301] hover:bg-[#F5B301] hover:text-[#0B2239]">
              Nos spécialités
            </a>
          </div>
        </div>
      </section>

      {/* =================== PRÉSENTATION — CARTES DÉTAILLÉES (FULL TEXTE) =================== */}
      <section id="presentation" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-5">
            {/* Colonne visuel (gauche) */}
            <div className="md:col-span-2">
              <div className="sticky top-24">
                <div className="relative h-[420px] overflow-hidden rounded-3xl shadow-xl md:h-[560px]">
                  <Image
                    src="/soc1.jpg"
                    alt="Manufacture Tunisienne des Ressorts"
                    fill
                    sizes="(max-width:768px) 100vw, 40vw"
                    className="object-cover"
                    priority
                  />
                  {/* Accent */}
                  <div className="pointer-events-none absolute -left-6 -top-6 hidden h-24 w-24 rounded-lg border-4 border-[#F5B301] md:block" />
                </div>

                {/* Stats compactes sous l’image */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white py-3 ">
                    <div className="text-2xl font-extrabold text-[#0B2239]">{yearsExp}</div>
                    <div className="text-[11px] uppercase text-slate-500">Années</div>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white py-3">
                    <div className="text-2xl font-extrabold text-[#0B2239]">0,1–10</div>
                    <div className="text-[11px] uppercase text-slate-500">Fil (mm)</div>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white py-3">
                    <div className="text-2xl font-extrabold text-[#0B2239]">2D/3D</div>
                    <div className="text-[11px] uppercase text-slate-500">Grilles</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne contenu (droite) */}
            <div className="md:col-span-3">
              {/* Titre principal */}
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-[#0B2239] md:text-5xl">
                  La qualité à chaque ressort, la fiabilité à chaque pas.
                </h2>
                <div className="mt-4 h-1 w-20 rounded-full bg-[#F5B301]" />
              </div>

              {/* 3 cartes qui structurent la longue description */}
              <div className="grid gap-6">
                {/* Carte 1 : Fondation */}
                <article className="rounded-3xl border-2 border-[#F4D06F] bg-white p-6 shadow-sm transition hover:shadow-lg hover:shadow-[#F4D06F]/20">
                  <h3 className="mb-2 text-lg font-bold text-[#0B2239]">Fondation & activité</h3>
                  <p className="leading-relaxed text-slate-700 bo">
                    Fondée en 1994 par <strong>Monsieur Hbaieb Chokri</strong>, la
                    <strong> Manufacture Tunisienne des Ressorts (MTR)</strong> est une entreprise tunisienne de type SARL,
                    spécialisée depuis plus de 30 ans dans la conception et la fabrication de ressorts :
                    ressorts de <strong>compression</strong>, de <strong>traction</strong>, de <strong>torsion</strong> et de <strong>forme</strong>.
                  </p>
                </article>

                {/* Carte 2 : Savoir-faire */}
                <article className="rounded-3xl border-2 border-[#F5B301] bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-bold text-[#0B2239]">Savoir-faire & qualité</h3>
                  <p className="leading-relaxed text-slate-700">
                    Forte d’un savoir-faire éprouvé et d’une maîtrise technique reconnue, MTR propose des
                    <strong> solutions sur mesure</strong>, adaptées aux besoins les plus exigeants dans une grande
                    variété de secteurs industriels.
                  </p>
                  <p className="mt-3 leading-relaxed text-slate-700">
                    L’entreprise réalise des ressorts en fils métalliques de <strong>0,1 mm à 10 mm</strong> de
                    diamètre, en <strong>petites ou grandes séries</strong>, selon les standards du client ou sur
                    cahier des charges.
                  </p>
                </article>

                {/* Carte 3 : Travail du fil & secteurs */}
                <article className="rounded-3xl border-2 border-[#F5B301] bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-bold text-[#0B2239]">Travail du fil & secteurs servis</h3>
                  <p className="leading-relaxed text-slate-700">
                    En complément de son expertise en ressorts, MTR développe un savoir-faire avancé dans le
                    <strong> travail du fil métallique</strong> : fabrication de <strong>fils dressés et coupés (1 mm à 12 mm)</strong>,
                    fils cambrés et cintrés pour des formes techniques (arcs, spirales, angles…), ainsi que
                    <strong> grilles et composants soudés sur mesure</strong> (treillages, crochets, cadres, pièces techniques ou décoratives)
                    en versions <strong>2D</strong> et <strong>3D</strong>.
                  </p>
                  <p className="mt-3 leading-relaxed text-slate-700">
                    Cette polyvalence permet à MTR de fournir des composants métalliques fiables, durables et parfaitement
                    adaptés aux exigences industrielles. Reconnue pour sa flexibilité, sa rapidité d’exécution et son
                    engagement qualité, MTR accompagne des clients dans l’<strong>automobile</strong>, l’<strong>électroménager</strong>,
                    l’<strong>agriculture</strong>, l’<strong>électricité</strong>, le <strong>bâtiment</strong>, les
                    <strong> sports & loisirs</strong>, et bien d’autres domaines.
                  </p>
                </article>
              </div>

              {/* Rubans de points clés */}
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Fils 0,1 mm à 10 mm",
                  "Séries petites à grandes",
                  "Études & prototypage rapides",
                  "Contrôle qualité interne",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm font-medium text-[#0B2239]">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#F5B301]" /> {t}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#specialites"
                  className="rounded-full bg-[#F5B301] px-6 py-3 font-semibold text-[#0B2239] shadow hover:brightness-95"
                >
                  Voir nos produits
                </a>
                <a
                  href="#contact"
                  className="rounded-full border border-[#0B2239] px-6 py-3 font-semibold text-[#0B2239] hover:bg-[#0B2239] hover:text-white"
                >
                  À propos de nous
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* SPÉCIALITÉS (catégories depuis la BD) */}
      <section id="specialites" className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-[#0B2239] md:text-4xl">Nos spécialités</h2>
            <p className="mt-3 text-slate-600">Découvrez notre savoir-faire en ressorts et articles métalliques.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {loadingCats
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
              ))
              : categories.map((c) => {
                const title =
                  (c?.translations && (c.translations[locale] || c.translations.fr || c.translations.en)) ||
                  c?.label ||
                  "";
                // FR si locale=fr, sinon EN
                const desc =
                  (c?.description && (c.description[locale] || c.description.fr || c.description.en)) ||
                  c?.image?.[`alt_${locale}`] ||
                  c?.image?.alt_fr ||
                  "";

                const raw = c?.image?.url || "";
                const imgUrl = raw.startsWith("http")
                  ? raw
                  : `${BACKEND}${raw.startsWith("/") ? "" : "/"}${raw}`;

                return (
                  <motion.div
                    key={c._id || title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group relative h-64 overflow-hidden rounded-2xl shadow-lg"
                  >
                    <img
                      src={imgUrl}
                      alt={c?.image?.[`alt_${locale}`] || c?.image?.alt_fr || title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <h3 className="mb-2 text-lg font-bold">{title}</h3>
                      {desc && <p className="text-sm text-gray-200">{desc}</p>}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* A PROPOS — Résumé (sans répéter la présentation) */}
      <section id="apropos" className="relative bg-white py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_15%_10%,rgba(245,179,1,0.06),transparent),radial-gradient(60%_40%_at_85%_80%,rgba(11,34,57,0.05),transparent)]" />
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-16 md:mb-20 max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold text-[#0B2239] md:text-4xl">À propos de MTR</h2>
            <p className="mt-3 text-slate-600">
              L’essentiel en trois points : capacités, qualité et travail du fil.
            </p>
          </div>

          {/* Raised grid */}
          <div className="grid gap-6 md:grid-cols-3 -mt-6 md:-mt-10">
            {/* Fondation & activité — résumé */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative rounded-3xl border border-[#F5B301] bg-white p-6 shadow-sm transition hover:shadow-xl"
            >
              <div className="mb-4 inline-flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0B2239]/5">
                  <Factory className="h-5 w-5 text-[#F5B301] " />
                </span>
                <h3 className="text-xl font-bold text-[#0B2239] ">Fondation & activité</h3>
              </div>

              <ul className="mx-auto max-w-sm space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Ressorts & pièces en fil métallique (proto → série)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Fils 0,1–10&nbsp;mm, fabrication sur plan / cahier des charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>{yearsExp}+ ans d’expérience industrielle</span>
                </li>
              </ul>
            </motion.article>

            {/* Savoir-faire & qualité — résumé */}
            <motion.article
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="group relative rounded-3xl border border-[#F5B301] bg-white p-6 shadow-sm transition hover:shadow-xl"
            >
              <div className="mb-4 inline-flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0B2239]/5">
                  <Cog className="h-5 w-5 text-[#F5B301]" />
                </span>
                <h3 className="text-xl font-bold text-[#0B2239]">Savoir-faire & qualité</h3>
              </div>

              <ul className="mx-auto max-w-sm space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Études & co-design, prototypage rapide</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Tolérances maîtrisées, essais charge/dimension</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Traçabilité complète matière & process</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Petites → grandes séries, délais courts</span>
                </li>
              </ul>
            </motion.article>

            {/* Travail du fil & secteurs servis — résumé */}
            <motion.article
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="group relative rounded-3xl border border-[#F5B301] bg-white p-6 shadow-sm transition hover:shadow-xl"
            >
              <div className="mb-4 inline-flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0B2239]/5">
                  <Wrench className="h-5 w-5 text-[#F5B301]" />
                </span>
                <h3 className="text-xl font-bold text-[#0B2239]">Travail du fil & secteurs servis</h3>
              </div>

              <ul className="mx-auto max-w-sm space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Dressage & coupe 1–12&nbsp;mm, cintrage 2D/3D</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Grilles, cadres, formes et ensembles soudés</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-[#F5B301]" />
                  <span>Finitions : zingage, peinture, traitement thermique</span>
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {["Automobile", "Électroménager", "Agriculture", "Électricité", "Bâtiment", "Sports & loisirs"].map(t => (
                  <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">{t}</span>
                ))}
              </div>
            </motion.article>
          </div>
        </div>
      </section>


      {/* CONTACT */}
      <section id="contact" className="relative overflow-hidden bg-slate-50 py-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_15%_10%,rgba(245,179,1,0.08),transparent),radial-gradient(60%_40%_at_85%_80%,rgba(11,34,57,0.06),transparent)]" />
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold text-[#0B2239]">Parlons de votre projet</h2>
            <p className="mt-3 text-slate-600">Une question technique, un devis ou un prototype à lancer ? Notre équipe vous répond rapidement.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Formulaire */}
            <div className="md:col-span-2">
              <form onSubmit={(e) => e.preventDefault()} className="group rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="relative">
                    <input id="nom" className="peer w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-4 outline-none ring-[#F5B301] focus:border-[#F5B301] focus:ring-2" placeholder=" " />
                    <label htmlFor="nom" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-2 text-sm text-slate-500 transition-all peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[#0B2239] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2">Nom complet</label>
                  </div>
                  <div className="relative">
                    <input id="email" type="email" className="peer w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-4 outline-none ring-[#F5B301] focus:border-[#F5B301] focus:ring-2" placeholder=" " />
                    <label htmlFor="email" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-2 text-sm text-slate-500 transition-all peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[#0B2239] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2">E-mail</label>
                  </div>
                  <div className="relative sm:col-span-2">
                    <input id="sujet" className="peer w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-4 outline-none ring-[#F5B301] focus:border-[#F5B301] focus:ring-2" placeholder=" " />
                    <label htmlFor="sujet" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-2 text-sm text-slate-500 transition-all peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[#0B2239] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2">Sujet</label>
                  </div>
                  <div className="relative sm:col-span-2">
                    <textarea id="message" rows={6} className="peer w-full resize-none rounded-2xl border border-slate-300 bg-transparent px-4 py-4 outline-none ring-[#F5B301] focus:border-[#F5B301] focus:ring-2" placeholder=" " />
                    <label htmlFor="message" className="pointer-events-none absolute left-3 top-6 bg-white px-2 text-sm text-slate-500 transition-all peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[#0B2239] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2">Message</label>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <CheckCircle className="h-5 w-5 text-[#F5B301]" />
                    <span>Réponse sous 24h ouvrées</span>
                  </div>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#F5B301] px-7 py-3 font-semibold text-[#0B2239] shadow hover:brightness-95">
                    Envoyer <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Cartes contact */}
            <div className="grid gap-5">
              {/* Téléphone */}
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#0B2239]/5 p-3"><PhoneCall className="h-5 w-5 text-[#F5B301]" /></div>
                  <div>
                    <p className="text-sm text-slate-500">Téléphone</p>
                    <p className="font-semibold text-[#0B2239]">+216 00 000 000</p>
                    <a href="tel:+21600000000" className="mt-3 inline-block rounded-full border border-[#F5B301] px-4 py-2 text-sm font-semibold text-[#0B2239] hover:bg-[#F5B301] hover:text-[#0B2239]">Appeler</a>
                  </div>
                </div>
              </div>
              {/* Email */}
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#0B2239]/5 p-3"><Mail className="h-5 w-5 text-[#F5B301]" /></div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-semibold text-[#0B2239]">contact@mtr.tn</p>
                    <a href="mailto:contact@mtr.tn" className="mt-3 inline-block rounded-full border border-[#F5B301] px-4 py-2 text-sm font-semibold text-[#0B2239] hover:bg-[#F5B301] hover:text-[#0B2239]">Écrire</a>
                  </div>
                </div>
              </div>
              {/* Adresse */}
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#0B2239]/5 p-3"><MapPin className="h-5 w-5 text-[#F5B301]" /></div>
                  <div>
                    <p className="text-sm text-slate-500">Adresse</p>
                    <p className="font-semibold text-[#0B2239]">Z.I. Sfax, Tunisie</p>
                    <a href="#localisation" className="mt-3 inline-block rounded-full border border-[#F5B301] px-4 py-2 text-sm font-semibold text-[#0B2239] hover:bg-[#F5B301] hover:text-[#0B2239]">Voir sur la carte</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCALISATION */}
      <section id="localisation" className="relative bg-white py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(245,179,1,0.08),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(11,34,57,0.08),transparent_40%)]" />
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-[#0B2239] md:text-4xl">Où nous trouver</h2>
            <p className="mt-3 text-slate-600">Usine MTR — Sfax, Tunisie</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200">
            <iframe
              title="Localisation MTR"
              src="https://www.google.com/maps?q=34.8256683,10.7390825&hl=fr&z=18&output=embed"
              className="h-[70vh] w-full md:h-[75vh]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href="https://www.google.com/maps/place/Manufacture+MTR/"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 left-4 rounded-full bg-[#F5B301] px-5 py-2 font-semibold text-[#0B2239] shadow-lg hover:brightness-95"
            >
              Ouvrir dans Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative mt-0 bg-[#0B2239] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(255,255,255,0.05),transparent),radial-gradient(50%_40%_at_80%_60%,rgba(245,179,1,0.08),transparent)]" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-4">
          <div>
            <h4 className="text-xl font-extrabold">MTR</h4>
            <p className="mt-3 max-w-xs text-sm text-white/80">Manufacture Tunisienne des Ressorts — qualité, précision et fiabilité depuis 1994.</p>
            <div className="mt-5 flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=100076355199317&locale=fr_FR" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/in/manufacutre-tunisienne-des-ressorts-22b388276/" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://wa.me/21698333883" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20" title="WhatsApp : +216 98 333 883">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-500" fill="currentColor">
                  <path d="M20.52 3.48A11.9 11.9 0 0012 .07 11.93 11.93 0 001.6 17.93L.07 24l6.2-1.63A11.93 11.93 0 0012 23.84h.01C18.6 23.84 24 18.48 24 11.9c0-3.2-1.25-6.2-3.48-8.42zM12 21.5c-1.9 0-3.73-.5-5.34-1.46l-.38-.23-3.67.97.98-3.58-.25-.37A9.93 9.93 0 1122 11.9c0 5.5-4.48 9.6-10 9.6zm5.14-7.44c-.28-.14-1.64-.8-1.9-.9-.26-.1-.45-.14-.64.14-.19.27-.73.9-.9 1.09-.17.19-.34.21-.62.07-.28-.14-1.17-.43-2.23-1.36-.82-.73-1.37-1.64-1.53-1.91-.16-.27-.02-.42.12-.55.12-.12.28-.32.42-.48.14-.16.19-.27.28-.46.09-.19.05-.35-.02-.48-.07-.14-.64-1.55-.88-2.13-.23-.56-.47-.49-.64-.5h-.55c-.19 0-.5.07-.76.35-.26.27-1 1-1 2.43 0 1.43 1.03 2.82 1.18 3.01.14.19 2.03 3.09 4.93 4.33.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.64-.67 1.87-1.32.23-.65.23-1.21.16-1.32-.07-.12-.26-.19-.54-.33z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-lg font-semibold">Company</h5>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {[
                { label: "À propos", href: "#presentation" },
                { label: "Produits", href: "#specialites" },
                { label: "Demande de devis", href: "#contact" },
                { label: "Politique de remboursement", href: "#" },
                { label: "Projets", href: "#" },
              ].map((l, i) => (
                <li key={i}>
                  <a href={l.href} className="group inline-flex items-center gap-2 hover:text-[#F5B301]">
                    <ChevronRight className="h-4 w-4 opacity-60 transition group-hover:text-[#F5B301]" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-semibold">Ressources</h5>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {[
                { label: "Help Desk", href: "#contact" },
                { label: "Catalogue", href: "#specialites" },
                { label: "Contact", href: "#contact" },
                { label: "Portfolio", href: "#specialites" },
                { label: "Équipe", href: "#presentation" },
              ].map((l, i) => (
                <li key={i}>
                  <a href={l.href} className="group inline-flex items-center gap-2 hover:text-[#F5B301]">
                    <ChevronRight className="h-4 w-4 opacity-60 transition group-hover:text-[#F5B301]" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-semibold">S’abonner à la newsletter</h5>
            <p className="mt-3 text-sm text-white/80">Recevez nos nouveautés produits et conseils techniques.</p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex gap-2">
              <input type="email" placeholder="Votre e-mail" className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none focus:border-[#F5B301]" />
              <button className="rounded-full bg-[#F5B301] px-5 py-3 text-sm font-semibold text-[#0B2239] hover:brightness-95">
                S’abonner
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-white/80 md:flex-row">
            <p>© {new Date().getFullYear()} MTR. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <a href="#presentation" className="hover:text-[#F5B301]">À propos</a>
              <a href="#contact" className="hover:text-[#F5B301]">Help Desk</a>
              <a href="#" className="hover:text-[#F5B301]">Privacy Policy</a>
            </div>
          </div>
        </div>

        <a
          href="#accueil"
          className="fixed bottom-6 right-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F5B301] text-[#0B2239] shadow-xl ring-1 ring-black/10 transition hover:-translate-y-0.5"
          aria-label="Revenir en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </a>
      </footer>
    </div>
  );
}

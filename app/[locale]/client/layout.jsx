"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaFacebook } from "react-icons/fa";

export default function ClientLayout({ children }) {
  const [open, setOpen] = useState(false);            // menu mobile
  const [ordersOpen, setOrdersOpen] = useState(false); // dropdown "Mes services"
  const locale = useLocale();
  const t = useTranslations("auth.client");
  const pathname = usePathname();

  // refs sans types TS (JSX only)
  const servicesRef = useRef(null);
  const closeTimerRef = useRef(null);

  const openServices = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOrdersOpen(true);
  };
  const scheduleCloseServices = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOrdersOpen(false), 180);
  };

  // Fermer au clic en dehors
  useEffect(() => {
    const onDocClick = (e) => {
      if (!servicesRef.current?.contains(e.target)) setOrdersOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ping /api/me pour hydrater la session (optionnel)
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/me", { cache: "no-store", credentials: "include" });
      } catch {}
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = `/${locale}/login`;
    }
  };

  // lien avec underline animé
  const NavLink = ({ href, children, activeMatch }) => {
    const isActive = activeMatch ? activeMatch(pathname) : pathname === href;
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`group relative px-3 py-2 text-sm font-semibold transition-colors ${
          isActive ? "text-yellow-500" : "text-slate-800 hover:text-yellow-500"
        }`}
      >
        {children}
        <span
          className={`pointer-events-none absolute left-3 right-3 -bottom-[6px] h-[3px] rounded-full bg-yellow-400 transition-transform duration-200 origin-left ${
            isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </Link>
    );
  };

  // actif si on est dans une page du groupe "Mes services"
  const isServicesActive = (p) =>
    p.startsWith(`/${locale}/client/mes-devis`);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-40 shadow-sm">
        {/* Top bar (bleu) */}
        <div className="bg-[#0B1E3A] text-white text-xs sm:text-sm">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 h-9 sm:h-10 flex items-center justify-between gap-3">
            <nav className="flex items-center gap-4 whitespace-nowrap overflow-x-auto no-scrollbar">
              <Link href={`/${locale}/about`} className="hover:text-yellow-300 transition">
                {t("top.about")}
              </Link>
              <span className="opacity-40">|</span>
              <Link href={`/${locale}/refund-policy`} className="hover:text-yellow-300 transition">
                {t("top.refund")}
              </Link>
              <span className="opacity-40">|</span>
              <Link href={`/${locale}/support`} className="hover:text-yellow-300 transition">
                {t("top.help")}
              </Link>
            </nav>

            <div className="hidden sm:flex items-center gap-3 opacity-90">
              <a
                href="https://www.facebook.com/profile.php?id=100076355199317&locale=fr_FR"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-yellow-300 transition text-xl"
              >
                <FaFacebook />
              </a>
            </div>
          </div>
        </div>

        {/* Navbar principale */}
        <div className="bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="h-16 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Industry Logo"
                  width={90}
                  height={90}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-1">
                <NavLink href={`/${locale}/client`}>{t("home")}</NavLink>
                <NavLink href={`/${locale}/client/profile`}>{t("profile")}</NavLink>

                {/* Lien direct Réclamations */}
                <NavLink href={`/${locale}/client/reclamations`}>{t("submitClaim")}</NavLink>

                {/* Mes services : hover + clic, avec délai de fermeture */}
                <div
                  ref={servicesRef}
                  className="relative"
                  onMouseEnter={openServices}
                  onMouseLeave={scheduleCloseServices}
                >
                  {/* Trigger */}
                  {(() => {
                    const active = isServicesActive(pathname);
                    return (
                      <button
                        type="button"
                        onClick={() => (ordersOpen ? setOrdersOpen(false) : setOrdersOpen(true))}
                        aria-haspopup="menu"
                        aria-expanded={ordersOpen}
                        className={`group relative px-3 py-2 text-sm font-semibold transition-colors ${
                          active ? "text-yellow-500" : "text-slate-800 hover:text-yellow-500"
                        }`}
                      >
                        {t("services.menu")} ▾
                        <span
                          className={`pointer-events-none absolute left-3 right-3 -bottom-[6px] h-[3px] rounded-full bg-yellow-400 transition-transform duration-200 origin-left ${
                            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                          }`}
                        />
                      </button>
                    );
                  })()}

                  {/* Menu (reste ouvert quand on le survole) */}
                  {ordersOpen && (
                    <div
                      role="menu"
                      onMouseEnter={openServices}
                      onMouseLeave={scheduleCloseServices}
                      className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-lg z-50"
                    >
                      <Link
                        href={`/${locale}/client/mes-devis`}
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {t("services.quotes")}
                      </Link>
                      <Link
                        href={`/${locale}/client/reclamations`}
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {t("services.claims")}
                      </Link>
                    </div>
                  )}
                </div>

                <NavLink href={`/${locale}/client/devis`}>{t("quoteRequest")}</NavLink>
              </nav>

              {/* Actions */}
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="rounded-xl px-4 py-2 text-sm font-semibold bg-yellow-500 hover:bg-yellow-600 text-slate-900 shadow"
                >
                  {t("logout")}
                </button>
              </div>

              {/* Burger mobile */}
              <button
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                onClick={() => setOpen((s) => !s)}
                aria-label="Toggle menu"
              >
                <svg
                  className={`transition ${open ? "rotate-90" : ""}`}
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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

          {/* Mobile menu */}
          {open && (
            <div className="lg:hidden border-t border-slate-200 bg-white">
              <div className="px-4 py-3 flex flex-col gap-1">
                <Link href={`/${locale}/client`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">
                  {t("home")}
                </Link>
                <Link href={`/${locale}/client/profile`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">
                  {t("profile")}
                </Link>

                <details>
                  <summary className="px-3 py-2 text-slate-800 cursor-pointer select-none">
                    {t("services.menu")}
                  </summary>
                  <div className="pl-4 flex flex-col">
                    <Link href={`/${locale}/client/mes-devis`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">
                      {t("services.quotes")}
                    </Link>
                    <Link href={`/${locale}/client/reclamations`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">
                      {t("services.claims")}
                    </Link>
                    <Link href={`/${locale}/client/orders`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">
                      {t("services.orders")}
                    </Link>
                  </div>
                </details>

                <Link href={`/${locale}/client/devis`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">
                  {t("quoteRequest")}
                </Link>

                <div className="h-px bg-slate-200 my-2" />
                <button
                  onClick={handleLogout}
                  className="rounded-xl px-4 py-2 text-sm font-semibold bg-yellow-500 hover:bg-yellow-600 text-slate-900 shadow"
                >
                  {t("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

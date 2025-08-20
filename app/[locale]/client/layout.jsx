"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const [userName, setUserName] = useState("");
  const [open, setOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false); // dropdown commandes
  const locale = useLocale();
  const t = useTranslations("auth.client");
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.name || "");
        }
      } catch { }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = `/${locale}/login`;
    }
  };

  const NavLink = ({ href, children }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`relative px-3 py-2 text-sm font-semibold transition-colors
          ${isActive ? "text-yellow-500" : "text-slate-800 hover:text-yellow-500"}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar principale */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
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

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink href={`/${locale}/client`}>{t("home")}</NavLink>
              <NavLink href={`/${locale}/client/profile`}>{t("profile")}</NavLink>

              {/* ✅ Dropdown Mes commandes */}
              <div className="relative group">
                <button
                  onClick={() => setOrdersOpen((s) => !s)}
                  className="px-3 py-2 text-sm font-semibold text-slate-800 hover:text-yellow-500"
                >
                  Mes services ▾
                </button>
                {ordersOpen && (
                  <div className="absolute left-0 mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                    <Link
                      href={`/${locale}/client/orders`}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Mes commandes
                    </Link>
                    <Link
                      href={`/${locale}/client/mes-devis`}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Mes demandes de devis
                    </Link>
                    <Link
                      href={`/${locale}/client/reclamations`}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Mes réclamations
                    </Link>
                  </div>
                )}
              </div>

              {/* ✅ Demander un devis reste séparé */}
              <NavLink href={`/${locale}/client/devis`}>Demander un devis</NavLink>
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

            {/* Mobile burger */}
            <button
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700"
              onClick={() => setOpen((s) => !s)}
              aria-label="Toggle menu"
            >
              <svg
                className={`transition ${open ? "rotate-90" : ""}`}
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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

        {/* ✅ Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 flex flex-col gap-1">
              <Link href={`/${locale}/client`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">{t("home")}</Link>
              <Link href={`/${locale}/client/profile`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">{t("profile")}</Link>

              {/* Sous-liste Mes commandes en mobile */}
              <details>
                <summary className="px-3 py-2 text-slate-800 cursor-pointer select-none">Mes services</summary>
                <div className="pl-4 flex flex-col">
                  <Link href={`/${locale}/client/orders`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">Mes commandes</Link>
                  <Link href={`/${locale}/client/mes-devis`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">Mes demandes de devis</Link>
                  <Link href={`/${locale}/client/reclamations`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">Mes réclamations</Link>
                </div>
              </details>

              {/* Demander un devis reste séparé */}
              <Link href={`/${locale}/client/devis`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">Demander un devis</Link>

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
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

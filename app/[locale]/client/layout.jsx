"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const [userName, setUserName] = useState("");
  const [open, setOpen] = useState(false);
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

  // Link: active = yellow text + underline; inactive = grey, turns yellow with underline on hover
  const NavLink = ({ href, children }) => {
    const isActive = pathname === href; // exact match only

    return (
      <Link
        href={href}
        className={`relative px-3 py-2 text-sm font-semibold transition-colors
          ${isActive ? "text-yellow-500" : "text-slate-800 hover:text-yellow-500"}`}
      >
        {children}
        <span
          className={`pointer-events-none absolute left-3 right-3 -bottom-1 h-0.5 rounded transition-all
            ${isActive ? "bg-yellow-500 scale-x-100" : "bg-yellow-500 scale-x-0 group-[&]:scale-x-0 hover:scale-x-100"}`}
          style={{ transformOrigin: "left" }}
        />
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Topbar */}
      <div className="hidden md:flex w-full items-center justify-between bg-slate-900 text-slate-200 text-xs px-6 lg:px-10 py-2">
        <div className="flex gap-4">
          <span className="opacity-80 hover:opacity-100 cursor-default">About Us</span>
          <span className="opacity-80 hover:opacity-100 cursor-default">Refund Policy</span>
          <span className="opacity-80 hover:opacity-100 cursor-default">Help Desk</span>
        </div>
        <div className="flex items-center gap-3">
          <a className="opacity-80 hover:opacity-100" href="#" aria-label="Facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9V12.1h2.54V9.79c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.88H13.55v7.02C18.34 21.25 22 17.09 22 12.07z" /></svg>
          </a>
          <a className="opacity-80 hover:opacity-100" href="#" aria-label="Twitter/X">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.98 3H18.1l-5.1 6.33L7.9 3H3l6.92 9.4L3.3 21h2.88l5.3-6.57L16.1 21h4.9l-7.02-9.67L20.98 3z" /></svg>
          </a>
          <a className="opacity-80 hover:opacity-100" href="#" aria-label="YouTube">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32.2 32.2 0 0 0 0 12a32.2 32.2 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.2 2.2c1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2 32.2 32.2 0 0 0 .5-5.8 32.2 32.2 0 0 0-.5-5.8zM9.8 15.4V8.6l6.2 3.4-6.2 3.4z" /></svg>
          </a>
          <a className="opacity-80 hover:opacity-100" href="#" aria-label="LinkedIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9h4v12H3zM14.5 9c-2.1 0-3.5 1.1-4.1 2h-.1V9H6v12h4.4v-6.7c0-1.8.3-3.6 2.6-3.6 2.3 0 2.3 2.1 2.3 3.7V21H20v-7c0-3.7-2-5-5.5-5z" /></svg>
          </a>
        </div>
      </div>

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
              <NavLink href={`/${locale}/client/orders`}>{t("orders")}</NavLink>
              <NavLink href={`/${locale}/client/devis`}>{t("quotes")}</NavLink>
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

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 flex flex-col gap-1">
              <Link href={`/${locale}/client`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">{t("home")}</Link>
              <Link href={`/${locale}/client/profile`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">{t("profile")}</Link>
              <Link href={`/${locale}/client/orders`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">{t("orders")}</Link>
              <Link href={`/${locale}/client/devis`} className="px-3 py-2 rounded hover:bg-slate-50 text-slate-800">{t("quotes")}</Link>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import {
  FaBars, FaTimes, FaTachometerAlt, FaShoppingCart, FaFileAlt,
  FaUsers, FaSignOutAlt
} from "react-icons/fa";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.admin");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

const handleLogout = useCallback(() => {
  // 1) Optimistic: nettoie les traces côté client (si tu utilises un token local)
  try { localStorage.removeItem("token"); } catch {}

  // 2) Fire-and-forget: n’attend pas la réponse
  fetch("/api/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store"
  }).catch(() => { /* on s’en fiche en UI */ });

  // 3) Redirection immédiate (évite l’historique)
  router.replace(`/${locale}/login`);
}, [router, locale]);


  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ----- Helper pour l'état actif -----
  const rootAdmin = `/${locale}/admin`;
  const isActivePath = (href) => {
    // La racine admin ne doit être active QUE sur /{locale}/admin
    if (href === rootAdmin) return pathname === rootAdmin;
    // Pour les autres liens, égalité stricte OU enfant direct
    return pathname === href || pathname.startsWith(href + "/");
  };

  const NavItem = ({ href, icon: Icon, children }) => {
    const active = isActivePath(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2 rounded-md mx-2 transition
          ${active
            ? "bg-yellow-400 text-[#002147]"
            : "text-white hover:bg-yellow-400 hover:text-[#002147]"}`
        }
        aria-current={active ? "page" : undefined}
      >
        <span className={`text-base ${active ? "text-[#002147]" : "text-white group-hover:text-[#002147]"}`}>
          <Icon />
        </span>
        <span className="font-medium">{children}</span>
        {active && <span className="ml-auto h-2 w-2 rounded-full bg-[#002147]" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top bar (mobile) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-gray-200 text-[#002147]"
          >
            <FaBars />
          </button>
          <h1 className="text-[#002147] font-semibold">{t("title")}</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-semibold bg-yellow-400 hover:bg-yellow-300 text-[#002147] transition"
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-[#002147] text-white flex-col justify-between shadow-lg">
          <div>
            <h2 className="text-2xl font-bold p-4 border-b border-yellow-400 text-yellow-400">
              {t("title")}
            </h2>
            <nav className="mt-3 space-y-1">
              <NavItem href={`${rootAdmin}`} icon={FaTachometerAlt}>{t("dashboard")}</NavItem>
              <NavItem href={`${rootAdmin}/orders`} icon={FaShoppingCart}>{t("orders")}</NavItem>
            
              <NavItem href={`${rootAdmin}/devis`} icon={FaFileAlt}>
                {t.has("tractionOrders") ? t("tractionOrders") : `${t("orders")} – Traction`}
              </NavItem>
              <NavItem href={`${rootAdmin}/users`} icon={FaUsers}>{t("users")}</NavItem>
            </nav>
          </div>
          <div className="p-4 border-t border-yellow-400">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 hover:bg-yellow-300 text-[#002147] px-4 py-2 font-semibold transition"
            >
              <FaSignOutAlt /> {t("logout")}
            </button>
          </div>
        </aside>

        {/* Drawer (mobile) */}
        {open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <aside
              className="fixed z-50 inset-y-0 left-0 w-72 bg-[#002147] text-white flex flex-col justify-between shadow-2xl
                         animate-in slide-in-from-left duration-200 lg:hidden"
              role="dialog" aria-modal="true"
            >
              <div>
                <div className="p-4 flex items-center justify-between border-b border-yellow-400">
                  <h2 className="text-xl font-bold text-yellow-400">{t("title")}</h2>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Fermer le menu"
                    className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-white/20"
                  >
                    <FaTimes />
                  </button>
                </div>
                <nav className="mt-3 space-y-1 pb-2">
                  <NavItem href={`${rootAdmin}`} icon={FaTachometerAlt}>{t("dashboard")}</NavItem>
                  <NavItem href={`${rootAdmin}/orders`} icon={FaShoppingCart}>{t("orders")}</NavItem>
                  <NavItem href={`${rootAdmin}/devis/traction`} icon={FaFileAlt}>
                    {t.has("tractionOrders") ? t("tractionOrders") : `${t("orders")} – Traction`}
                  </NavItem>
                  <NavItem href={`${rootAdmin}/users`} icon={FaUsers}>{t("users")}</NavItem>
                </nav>
              </div>
              <div className="p-4 border-t border-yellow-400">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 hover:bg-yellow-300 text-[#002147] px-4 py-2 font-semibold transition"
                >
                  <FaSignOutAlt /> {t("logout")}
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

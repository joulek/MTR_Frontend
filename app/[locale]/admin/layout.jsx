"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaShoppingCart,
  FaFileAlt,
  FaUsers,
  FaSignOutAlt,
  FaTags,
  FaBoxOpen,
  FaNewspaper,
  FaGlobe,
  FaExclamationCircle, // ✅ ajouté pour Réclamations
} from "react-icons/fa";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.admin");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const AVAILABLE_LOCALES = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
  ];

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {}
    fetch("/api/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }).catch(() => {});
    router.replace(`/${locale}/login`);
  }, [router, locale]);

  const switchLocale = useCallback(
    (newLocale) => {
      if (!newLocale || newLocale === locale) return;
      const parts = (pathname || "/").split("/");
      parts[1] = newLocale;
      const nextPath = parts.join("/") || "/";
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      router.replace(nextPath + search);
      setOpen(false);
    },
    [pathname, router, locale]
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const rootAdmin = `/${locale}/admin`;
  const isActivePath = (href) => {
    if (href === rootAdmin) return pathname === rootAdmin;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const NavItem = ({ href, icon: Icon, children }) => {
    const active = isActivePath(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2 rounded-md mx-2 transition
          ${
            active
              ? "bg-yellow-400 text-[#002147]"
              : "text-white hover:bg-yellow-400 hover:text-[#002147]"
          }`}
        aria-current={active ? "page" : undefined}
      >
        <span
          className={`text-base ${
            active
              ? "text-[#002147]"
              : "text-white group-hover:text-[#002147]"
          }`}
        >
          <Icon />
        </span>
        <span className="font-medium">{children}</span>
        {active && (
          <span className="ml-auto h-2 w-2 rounded-full bg-[#002147]" />
        )}
      </Link>
    );
  };

  const LangPills = () => (
    <div className="mx-2">
      <div className="text-xs text-white/80 mb-1 flex items-center gap-2">
        <FaGlobe /> <span>Langue</span>
      </div>
      <div className="inline-flex rounded-full bg-white/10 p-1">
        {AVAILABLE_LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition
                ${
                  active
                    ? "bg-yellow-400 text-[#002147] shadow"
                    : "text-white hover:bg-white/20"
                }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );

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
              <NavItem href={`${rootAdmin}`} icon={FaTachometerAlt}>
                {t("dashboard")}
              </NavItem>
              <NavItem href={`${rootAdmin}/categories`} icon={FaTags}>
                {t.has("categories") ? t("categories") : "Catégories"}
              </NavItem>
              <NavItem href={`${rootAdmin}/produits`} icon={FaBoxOpen}>
                {t.has("products") ? t("products") : "Produits"}
              </NavItem>
              <NavItem href={`${rootAdmin}/articles`} icon={FaNewspaper}>
                {t.has("articles") ? t("articles") : "Articles"}
              </NavItem>
              <NavItem href={`${rootAdmin}/devis`} icon={FaFileAlt}>
                {t.has("tractionOrders")
                  ? t("tractionOrders")
                  : `${t("orders")} – Traction`}
              </NavItem>
              <NavItem href={`${rootAdmin}/users`} icon={FaUsers}>
                {t("users")}
              </NavItem>

              {/* ✅ Réclamations */}
              <NavItem
                href={`/${locale}/admin/reclamations`}
                icon={FaExclamationCircle}
              >
                Réclamations
              </NavItem>
            </nav>
          </div>

          <div className="p-4 border-t border-yellow-400 space-y-3">
            <LangPills />
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
              role="dialog"
              aria-modal="true"
            >
              <div>
                <div className="p-4 flex items-center justify-between border-b border-yellow-400">
                  <h2 className="text-xl font-bold text-yellow-400">
                    {t("title")}
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Fermer le menu"
                    className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-white/20"
                  >
                    <FaTimes />
                  </button>
                </div>
                <nav className="mt-3 space-y-1 pb-2">
                  <NavItem href={`${rootAdmin}`} icon={FaTachometerAlt}>
                    {t("dashboard")}
                  </NavItem>
                  <NavItem href={`${rootAdmin}/categories`} icon={FaTags}>
                    {t.has("categories") ? t("categories") : "Catégories"}
                  </NavItem>
                  <NavItem href={`${rootAdmin}/produits`} icon={FaBoxOpen}>
                    {t.has("products") ? t("products") : "Produits"}
                  </NavItem>
                  <NavItem href={`${rootAdmin}/articles`} icon={FaNewspaper}>
                    {t.has("articles") ? t("articles") : "Articles"}
                  </NavItem>
                  <NavItem href={`${rootAdmin}/devis`} icon={FaFileAlt}>
                    {t.has("tractionOrders")
                      ? t("tractionOrders")
                      : `${t("orders")} – Traction`}
                  </NavItem>
                  <NavItem href={`${rootAdmin}/users`} icon={FaUsers}>
                    {t("users")}
                  </NavItem>

                  {/* ✅ Réclamations (mobile) */}
                  <NavItem
                    href={`/${locale}/admin/reclamations`}
                    icon={FaExclamationCircle}
                  >
                    Réclamations
                  </NavItem>
                </nav>

                <div className="px-4 pb-3">
                  <LangPills />
                </div>
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

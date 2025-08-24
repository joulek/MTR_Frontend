"use client";

export const dynamic = "force-dynamic"; // ⬅️ empêche le SSG pour cette page

import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://mtr-backend-fbq8.onrender.com/").replace(/\/$/, "");

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const linkInvalid = useMemo(() => !uid || !token, [uid, token]);

  const locale = useMemo(() => {
    const m = (pathname || "").match(/^\/(fr|en)(?:\/|$)/);
    if (m) return m[1];
    if (typeof document !== "undefined") {
      const l = (document.documentElement.lang || navigator.language || "fr").toLowerCase();
      return l.startsWith("en") ? "en" : "fr";
    }
    return "fr";
  }, [pathname]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthText = score <= 1 ? "Faible" : score === 2 ? "Moyen" : score === 3 ? "Bon" : "Très bon";

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (linkInvalid) return setMsg({ type: "err", text: "Lien invalide ou incomplet." });
    if (password.length < 6) return setMsg({ type: "err", text: "Le mot de passe doit contenir au moins 6 caractères." });
    if (password !== confirm) return setMsg({ type: "err", text: "Les mots de passe ne correspondent pas." });

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/users/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || `Erreur (${res.status})`);

      setMsg({ type: "ok", text: "Mot de passe défini avec succès. Redirection…" });

      const hasLocalePrefix = /^\/(fr|en)(\/|$)/.test(pathname || "");
      const dest = hasLocalePrefix ? `/${locale}/login` : "/login";
      setTimeout(() => router.replace(dest), 1200);
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <SiteHeader />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#F5B301]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#0B2239]/10 blur-3xl" />
      </div>

      <main className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0B2239]">
              Définir un mot de passe
            </h1>
            <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-[#F5B301] via-[#F5B301] to-transparent" />
          </div>

          {linkInvalid ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              Lien invalide ou incomplet.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-4 pr-12 outline-none ring-[#F5B301] focus:border-[#F5B301] focus:ring-2"
                />
                <label className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 bg-white px-1 text-sm text-slate-500 transition-all duration-150
                                  peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400
                                  peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#F5B301]
                                  peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs">
                  Nouveau mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-[#0B2239] hover:bg-slate-100"
                >
                  {showPw ? "Masquer" : "Afficher"}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPw2 ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-4 pr-12 outline-none ring-[#F5B301] focus:border-[#F5B301] focus:ring-2"
                />
                <label className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 bg-white px-1 text-sm text-slate-500 transition-all duration-150
                                  peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400
                                  peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#F5B301]
                                  peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs">
                  Confirmer le mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPw2((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-[#0B2239] hover:bg-slate-100"
                >
                  {showPw2 ? "Masquer" : "Afficher"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full rounded-full bg-[#F5B301] px-6 py-3 font-semibold text-[#0B2239] shadow ring-1 ring-black/5 transition hover:brightness-95 disabled:opacity-60"
              >
                {loading ? "Validation…" : "Valider"}
              </button>

              {msg && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-3 rounded-xl px-4 py-3 text-sm ${
                    msg.type === "ok" ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

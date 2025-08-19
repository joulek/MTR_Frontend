"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(""); setErr(""); setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/forgot-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error");
      setOk(t("forgotSent")); // ex: “Si un compte existe, un email a été envoyé.”
    } catch (e:any) {
      setErr(e.message || t("errors.network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border border-[#ffb400]/50 bg-white p-8">
        <h1 className="text-2xl font-extrabold text-[#002147]" style={{fontFamily:"'Lora', serif"}}>
          {t("forgotTitle")}
        </h1>
        <p className="text-sm text-gray-600 mt-2">{t("forgotHint")}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="block font-semibold text-[#002147]" style={{fontFamily:"'Lora', serif"}}>
              {t("email")} <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
              placeholder={t("placeholders.email")}
            />
          </div>

          {ok && <p className="text-green-600 text-sm font-semibold">{ok}</p>}
          {err && <p className="text-red-600 text-sm font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#002147] hover:bg-[#003366] text-white font-bold py-3 disabled:opacity-60"
            style={{fontFamily:"'Lora', serif"}}
          >
            {loading ? t("loading") : t("sendReset")}
          </button>

          <a href={`/${locale}/login`} className="block text-center text-sm text-[#002147] font-semibold hover:underline">
            {t("backToLogin")}
          </a>
        </form>
      </div>
    </div>
  );
}

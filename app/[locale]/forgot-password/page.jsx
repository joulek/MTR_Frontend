"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import forgetImg from "@/public/forget_icon.png";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk("");
    setErr("");
    setLoading(true);
    try {
      // 1) Vérifier si l'email existe
      const chk = await fetch(`${BACKEND}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const chkData = await chk.json();
      if (!chk.ok || !chkData?.exists) {
        setErr(t("errors.noAccountForEmail") || "Aucun compte avec cet email.");
        setLoading(false);
        return; // ⛔ stop: pas de redirection
      }

      // 2) Demander l’envoi du code (réponse neutre côté serveur)
      const res = await fetch(`${BACKEND}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error");

      // 3) Ne plus exposer l'email dans l'URL
      sessionStorage.setItem("resetEmail", email);
      router.replace(`/${locale}/reset-password`);
    } catch (e) {
      setErr(e.message || t("errors.network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border border-[#ffb400]/50 bg-white p-8 relative">
        {/* Icône */}
        <div className="flex justify-center -mt-14 mb-4">
          <div className="bg-white rounded-full shadow-lg p-3 border border-[#ffb400]/60">
            <Image
              src={forgetImg}
              alt="Forgot password"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <h1
          className="text-2xl font-extrabold text-[#002147] text-center"
          style={{ fontFamily: "'Lora', serif" }}
        >
          {t("forgotTitle")}
        </h1>
        <p className="text-sm text-gray-600 mt-2 text-center">
          {t("forgotHint")}
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block font-semibold text-[#002147]"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {t("email")} <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            style={{ fontFamily: "'Lora', serif" }}
          >
            {loading ? t("loading") : t("sendReset")}
          </button>

          <a
            href={`/${locale}/login`}
            className="block text-center text-sm text-[#002147] font-semibold hover:underline"
          >
            {t("backToLogin")}
          </a>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation"; // ✅ import

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function Page({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter(); // ✅ initialiser le router

  const [email, setEmail] = useState(searchParams?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (searchParams?.email) setEmail(searchParams.email);
  }, [searchParams?.email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(""); 
    setErr(""); 
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error");

      setOk(t("resetSuccess"));

      // ✅ redirection auto après 2 secondes
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);

    } catch (e: any) {
      setErr(e.message || t("errors.network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border border-[#ffb400]/50 bg-white p-8">
        <h1 className="text-2xl font-extrabold text-[#002147] text-center" style={{ fontFamily: "'Lora', serif" }}>
          {t("resetByCodeTitle")}
        </h1>
        <p className="text-sm text-gray-600 mt-2 text-center">
          {t("resetByCodeHint")}
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {/* Email */}
          <div>
            <label className="block font-semibold text-[#002147]">
              {t("email")} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3"
            />
          </div>

          {/* Code */}
          <div>
            <label className="block font-semibold text-[#002147]">
              {t("code")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-center tracking-widest"
              placeholder="• • • • • •"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-[#002147]">
              {t("newPassword")} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3"
            />
          </div>

          {ok && <p className="text-green-600 text-sm font-semibold">{ok}</p>}
          {err && <p className="text-red-600 text-sm font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#002147] hover:bg-[#003366] text-white font-bold py-3 disabled:opacity-60"
          >
            {loading ? t("loading") : t("confirmReset")}
          </button>
        </form>
      </div>
    </div>
  );
}

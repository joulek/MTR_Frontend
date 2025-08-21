"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // ✅ import des icônes

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function Page() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false); // ✅ état pour afficher/masquer
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      sessionStorage.removeItem("resetEmail");
    }
  }, []);

  const onSubmit = async (e) => {
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
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
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
              src="/reset_password.png"
              alt="Reset password"
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
              className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
              placeholder={t("placeholders.email")}
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
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full rounded-xl border border-[#ddd] text-center bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
              placeholder="• • • • • •"
            />
          </div>

          {/* Password avec toggle */}
          <div>
            <label className="block font-semibold text-[#002147]">
              {t("newPassword")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"} // ✅ toggle
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 pr-10 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                placeholder={t("placeholders.password")}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#002147]"
              >
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {ok && <p className="text-green-600 text-sm font-semibold">{ok}</p>}
          {err && <p className="text-red-600 text-sm font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#002147] hover:bg-[#003366] text-white font-bold py-3 disabled:opacity-60"
            style={{ fontFamily: "'Lora', serif" }}
          >
            {loading ? t("loading") : t("confirmReset")}
          </button>
        </form>
      </div>
    </div>
  );
}

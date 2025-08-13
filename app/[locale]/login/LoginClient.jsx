"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit", 
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || t("errors.loginFailed"));
      } else {
        localStorage.setItem("userData", JSON.stringify(data));
        const role = data.role || data.user?.role;
        document.cookie = `token=${data.token}; path=/; max-age=604800`; // 7j
        document.cookie = `role=${role}; path=/; max-age=604800`;
        if (role === "admin") router.push(`/${locale}/admin`);
        else if (role === "client") router.push(`/${locale}/client`);
        else router.push(`/${locale}/home`);
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl border border-[#ffb400]/50 bg-white">
        {/* Left visual panel */}
        <div className="hidden lg:flex relative items-center justify-center p-10">
          <Image
            src="/about.jpg"
            alt="Ressorts"
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-[#002147]/40" />
          <div className="relative text-center text-white space-y-6 max-w-sm">
            <div className="mx-auto rounded-3xl inline-flex">
              <Image src="/logo.png" alt="MTR" width={290} height={70} priority />
            </div>
            <h2
              className="text-4xl font-extrabold leading-tight text-[#ffb400]"
              style={{ fontFamily: "'Lora', serif", marginTop: "-50px" }}
            >
              {t("joinClientSpace")}
            </h2>
            <p className="text-[#002147]/80 font-bold text-lg" style={{ fontFamily: "'Lora', serif" }}>
              {t("promoText")}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-center text-[#002147]"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {t("loginTitle")}
            </h1>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("email")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                  placeholder={t("placeholders.email")}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("password")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    className={`w-full rounded-xl border border-[#ddd] bg-white py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition ${locale === "ar" ? "pl-10 pr-4" : "pr-10 pl-4"
                      }`}
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className={`absolute inset-y-0 my-auto text-sm font-medium px-3 py-1 rounded-md ${locale === "ar" ? "left-3" : "right-3"
                      }`}
                    style={{ color: "#555555" }}
                    aria-label="Afficher / masquer le mot de passe"
                  >
                    {showPwd ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-red-600 text-sm text-center font-semibold">{error}</p>}

              {/* Options */}
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 select-none text-[#555555]" style={{ fontFamily: "'Lora', serif" }}>
                  <input type="checkbox" className="accent-[#002147]" />
                  {t("rememberMe")}
                </label>
                <a href="#" className="font-semibold hover:underline text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("forgot")}
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#002147] hover:bg-[#003366] text-white font-bold py-3 shadow-lg shadow-[#002147]/30 transition disabled:opacity-60"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {loading ? t("loading") : t("loginBtn")}
              </button>

              <p className="text-center text-sm text-[#555555]">
                {t("noAccount")}{" "}
                <Link href={`/${locale}/register`} className="font-semibold hover:underline text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("goRegister")}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

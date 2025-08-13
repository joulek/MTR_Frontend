"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [showPwd, setShowPwd] = useState(false);
  const [typeCompte, setTypeCompte] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "error"
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");



  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOkMsg("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      nom: fd.get("lastName"), // correspond à "nom" backend
      prenom: fd.get("firstName"),
      email: fd.get("email"),
      password: fd.get("password"),
      numTel: fd.get("phone"),
      adresse: fd.get("address"),
    };

    if (typeCompte === "personnel") {
      payload.personal = {
        cin: Number(fd.get("cin")),
        posteActuel: fd.get("posteActuelPersonnel"),
      };
    } else if (typeCompte === "societe") {
      payload.societe = {
        nomSociete: fd.get("nomSociete"),
        matriculeFiscale: fd.get("matriculeFiscale"),
        posteActuel: fd.get("posteActuelSociete"),
      };
    }


    if (payload.typeCompte === "personnel") {
      payload.cin = fd.get("cin") || "";
      payload.posteActuel = fd.get("posteActuelPersonnel") || "";
    } else if (payload.typeCompte === "societe") {
      payload.nomSociete = fd.get("nomSociete") || "";
      payload.matriculeFiscale = fd.get("matriculeFiscale") || "";
      payload.posteActuel = fd.get("posteActuelSociete") || "";
    }
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setErr(data?.message || "Échec de l'inscription");
    } else {
      setOkMsg("Compte créé avec succès !");
      router.push(`/${locale}/login`);

      // Tu peux stocker si besoin:
      // localStorage.setItem("userData", JSON.stringify(data));
      // et rediriger ensuite, ex:
      // router.push("/login");
      e.currentTarget.reset();
      setTypeCompte("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl border border-[#ffb400]/50 bg-white">
        {/* Form */}
        <div className="p-8 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
              {t("registerTitle")}
            </h1>

            {status === "error" && (
              <p className="mt-4 text-red-600 text-sm text-center font-semibold">{err}</p>
            )}
            {status === "success" && (
              <p className="mt-4 text-green-600 text-sm text-center font-semibold">{okMsg}</p>
            )}


            <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmit}>
              {/* Last name */}
              <div className="space-y-2">
                <label htmlFor="lastName" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("lastName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder={t("placeholders.lastName")}
                  className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                  required
                />
              </div>

              {/* First name */}
              <div className="space-y-2">
                <label htmlFor="firstName" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("firstName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder={t("placeholders.firstName")}
                  className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("email")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("placeholders.email")}
                  className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("phone")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t("placeholders.phone")}
                  className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                  required
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="address" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("address")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder={t("placeholders.address")}
                  className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                  required
                />
              </div>

              {/* Account type */}
              <div className="md:col-span-2 space-y-2">
                <span className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("accountType")} <span className="text-red-500">*</span>
                </span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-[#ffb400] font-medium" style={{ fontFamily: "'Lora', serif" }}>
                    <input
                      type="radio"
                      name="typeCompte"
                      value="personnel"
                      onChange={(e) => setTypeCompte(e.target.value)}
                      className="accent-[#002147]"
                      required
                    />
                    {t("personal")}
                  </label>
                  <label className="flex items-center gap-2 text-[#ffb400] font-medium" style={{ fontFamily: "'Lora', serif" }}>
                    <input
                      type="radio"
                      name="typeCompte"
                      value="societe"
                      onChange={(e) => setTypeCompte(e.target.value)}
                      className="accent-[#002147]"
                      required
                    />
                    {t("company")}
                  </label>
                </div>
              </div>

              {/* Dynamic fields */}
              {typeCompte === "personnel" && (
                <>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                      {t("cin")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="cin"
                      type="text"
                      placeholder={t("placeholders.cin")}
                      className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                      {t("currentPosition")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="posteActuelPersonnel"
                      type="text"
                      placeholder={t("placeholders.currentPosition")}
                      className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                      required
                    />
                  </div>
                </>
              )}

              {typeCompte === "societe" && (
                <>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                      {t("companyName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="nomSociete"
                      type="text"
                      placeholder={t("placeholders.companyName")}
                      className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                      {t("taxId")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="matriculeFiscale"
                      type="text"
                      placeholder={t("placeholders.taxId")}
                      className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                      {t("currentPosition")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="posteActuelSociete"
                      type="text"
                      placeholder={t("placeholders.currentPosition")}
                      className="w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition"
                      required
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="password" className="block font-semibold text-[#002147]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("password")} <span className="text-red-500">*</span>
                </label>

                <div className="relative" dir={locale === "ar" ? "rtl" : "ltr"}>
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    className={`w-full rounded-xl border border-[#ddd] bg-white py-3 text-[#002147] placeholder-[#555555] outline-none focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/25 transition ${locale === "ar" ? "pl-10 pr-4" : "pr-10 pl-4"
                      }`}
                    placeholder={t("placeholders.password")}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className={`absolute inset-y-0 my-auto text-sm font-medium px-3 py-1 rounded-md ${locale === "ar" ? "left-3" : "right-3"
                      }`}
                    style={{ color: "#555555" }}
                  >
                    {showPwd ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#002147] hover:bg-[#003366] text-white font-bold py-3"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {loading ? t("loading") : t("registerBtn")}
                </button>
              </div>

              {/* Go to login */}
              <div className="md:col-span-2">
                <p className="text-center text-sm text-[#555555]" style={{ fontFamily: "'Lora', serif" }}>
                  {t("haveAccount")}{" "}
                  <Link href={`/${locale}/login`} className="font-semibold hover:underline text-[#002147]">
                    {t("goLogin")}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

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
          <div className="relative text-center text-white space-y-6 max-w-sm" style={{ marginTop: "-60px" }}>
            <div className="mx-auto rounded-3xl inline-flex">
              <Image src="/logo.png" alt="MTR" width={290} height={70} priority />
            </div>
            <h2 className="text-4xl font-extrabold leading-tight text-[#ffb400]" style={{ fontFamily: "'Lora', serif", marginTop: "-58px" }}>
              {t("joinClientSpace")}
            </h2>
            <p className="text-[#002147]/80 font-bold text-lg" style={{ fontFamily: "'Lora', serif" }}>
              {t("promoText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

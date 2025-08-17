"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home, FileText, HelpCircle, Lock } from "lucide-react"; // 👈 icons pro


const NAVY = "#0B1E3A";
const YELLOW = "#F7C600";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/* ---------- UI PRIMITIVES ---------- */

function Section({ title, children }) {
  return (
    <section
      className="rounded-2xl border bg-white p-6"
      style={{ borderColor: `${YELLOW}55`, boxShadow: "0 6px 22px rgba(0,0,0,.05)" }}
    >
      <h2 className="text-lg font-extrabold mb-4" style={{ color: NAVY }}>
        {title}
      </h2>
      <div className="h-1 w-12 rounded mb-5" style={{ backgroundColor: YELLOW }} />
      {children}
    </section>
  );
}

function InfoItem({ label, value }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-lg border mb-3 last:mb-0"
      style={{ borderColor: `${YELLOW}44` }}
    >
      <span className="text-sm font-semibold" style={{ color: NAVY }}>{label}</span>
      <span className="text-sm" style={{ color: "#333" }}>{value || "-"}</span>
    </div>
  );
}

function Row({ icon, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition text-left"
      style={{ borderColor: `${YELLOW}44` }}
    >
      <span aria-hidden className="text-lg" style={{ color: NAVY }}>{icon}</span>
      <div className="flex-1">
        <div className="text-[15px] font-semibold" style={{ color: NAVY }}>{label}</div>
        {hint ? <div className="text-xs text-gray-500">{hint}</div> : null}
      </div>
      <span className="text-gray-400">›</span>
    </button>
  );
}

function LanguagePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("profile");
  const locales = ["fr", "en"];

  function switchLocale(next) {
    if (!pathname) return;
    const segs = pathname.split("/").filter(Boolean);
    if (locales.includes(segs[0])) segs[0] = next; else segs.unshift(next);
    router.push("/" + segs.join("/"));
  }

  return (
    <select
      className="rounded-md border px-3 py-2 bg-white text-sm"
      style={{ borderColor: `${YELLOW}66`, color: NAVY }}
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
    >
      <option value="fr">{t("lang.fr")}</option>
      <option value="en">{t("lang.en")}</option>
    </select>
  );
}

/* ---------- PAGE ---------- */

export default function ClientProfileReadOnly() {
  const t = useTranslations("profile");
  const typeKeyMap = { personnel: "personal", societe: "company" };
  const router = useRouter();
  const locale = useLocale();

  const [me, setMe] = useState({
    nom: "",
    prenom: "",
    email: "",
    numTel: "",
    adresse: "",
    accountType: "",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/me`, {
          method: "GET",
          credentials: "include", // ⚠️ indispensable pour envoyer les cookies
        });

        if (!res.ok) throw new Error("Unauthorized");

        const u = await res.json();
        if (cancelled) return;

        setMe({
          nom: u?.nom || "",
          prenom: u?.prenom || "",
          email: u?.email || "",
          numTel: u?.numTel || "",
          adresse: u?.adresse || "",
          accountType: u?.accountType || "",
        });
      } catch (err) {
        console.warn("Non authentifié ou erreur:", err.message);
        // Optionnel : rediriger vers login si pas connecté
        // router.push("/login");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const fullName =
    [me.prenom, me.nom].filter(Boolean).join(" ") || t("userFallback");
  const initial = (fullName && fullName[0]) || "U";

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE : Compte */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bandeau identité */}
          <Section title={t("account.title")}>
            <div className="flex items-center gap-4">
              {/* Initiale utilisateur */}
              <div
                className="grid place-items-center rounded-xl"
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: `${YELLOW}22`,
                  border: `1px solid ${YELLOW}66`,
                  color: NAVY,
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                {initial}
              </div>
              <div className="flex-1">
                <div className="text-xl font-extrabold" style={{ color: NAVY }}>{fullName}</div>
                {/* Email sous le nom */}
                <div className="text-sm text-gray-500">{me.email || t("account.unknownEmail")}</div>
              </div>
            </div>

            {/* Infos */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem label={t("account.fields.lastName")} value={me.nom} />
              <InfoItem label={t("account.fields.firstName")} value={me.prenom} />
              <InfoItem label={t("account.fields.phone")} value={me.numTel} />
              <InfoItem label={t("account.fields.address")} value={me.adresse} />
              <InfoItem
                label={t("account.fields.accountType")}
                value={
                  me.accountType
                    ? t(`account.types.${typeKeyMap[me.accountType] ?? "personal"}`)
                    : "-"
                }
              />


              {/* Email de connexion (dans la liste d'infos aussi) */}
              <InfoItem
                label={t("account.fields.loginEmail")}
                value={me.email}
              />
            </div>
          </Section>

          {/* Raccourcis */}
          <Section title={t("shortcuts.title")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Accueil */}
              <Row
                icon={<Home className="w-5 h-5 text-[#FDC500]" />}
                label={t("shortcuts.home")}
                hint={t("shortcuts.homeHint")}
                onClick={() => router.push(`/${locale}/client`)}
              />

              {/* Commandes */}
              <Row
                icon={<FileText className="w-5 h-5 text-[#FDC500]" />}
                label={t("shortcuts.orders")}
                hint={t("shortcuts.ordersHint")}
                onClick={() => router.push(`/${locale}/client/orders`)}
              />

              {/* Aide & Support */}
              <Row
                icon={<HelpCircle className="w-5 h-5 text-[#FDC500]" />}
                label={t("shortcuts.help")}
                hint={t("shortcuts.helpHint")}
                onClick={() => router.push(`/${locale}/support`)}
              />

            </div>
          </Section>
        </div>

        {/* COLONNE DROITE : Paramètres */}
        <div className="space-y-6">
          <Section title={t("settings.title")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: NAVY }}>
                  {t("settings.language")}
                </div>
                <div className="text-xs text-gray-500">{t("settings.languageHint")}</div>
              </div>
              <LanguagePicker />
            </div>
          </Section>

          <Section title={t("about.title")}>
            <div className="text-sm text-gray-600">
              {t("about.text")}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

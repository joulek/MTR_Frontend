"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function ClientDashboard() {
  const router = useRouter();
  const locale = useLocale(); // fr / en / ar
  const t = useTranslations("auth.client"); // On utilise le namespace existant

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push(`/${locale}/login`);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#002147] text-center">
        {t("dashboardTitle")}
      </h1>
      <p className="text-[#002147]  text-center">{t("dashboardSubtitle")}</p>
    </div>
  );
}

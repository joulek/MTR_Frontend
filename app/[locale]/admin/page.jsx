"use client";

import { useLocale, useTranslations } from "next-intl";

export default function AdminDashboard() {
    const t = useTranslations("auth.admin");

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#002147] text-center">{t("welcomeDashboard")}</h1>
      <p className="text-[#002147] text-center">{t("dashboardSubtitle")}</p>
    </div>
  );
}

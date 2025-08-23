"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";

import CompressionForm from "@/components/forms/CompressionForm";
import TractionForm from "@/components/forms/TractionForm";
import TorsionForm from "@/components/forms/TorsionForm";
import FilDresseForm from "@/components/forms/FilDresseForm";
import GrilleMetalliqueForm from "@/components/forms/GrilleMetalliqueForm";
import AutreArticleForm from "@/components/forms/AutreArticleForm";

import compressionImg from "@/public/devis/compression_logo.png";
import tractionImg from "@/public/devis/ressort_traction_1.jpg";
import torsionImg from "@/public/devis/torsion_ressorts.png";
import fillImg from "@/public/devis/dresser.png";
import grillImg from "@/public/devis/grille.png";
import autreImg from "@/public/devis/autre.jpg";

export default function DevisPage() {
  const [type, setType] = useState("compression");
  const t = useTranslations("auth.devis");

  const TYPES = [
    { key: "compression", label: t("types.compression") || "", img: compressionImg },
    { key: "traction", label: t("types.traction") || "", img: tractionImg },
    { key: "torsion", label: t("types.torsion") || "", img: torsionImg },
    { key: "fil", label: t("types.fil") || "", img: fillImg },
    { key: "grille", label: t("types.grille") || "", img: grillImg },
    { key: "autre", label: t("types.autre") || "", img: autreImg },
  ];

  const renderForm = () => {
    switch (type) {
      case "compression": return <CompressionForm />;
      case "traction": return <TractionForm />;
      case "torsion": return <TorsionForm />;
      case "fil": return <FilDresseForm />;
      case "grille": return <GrilleMetalliqueForm />;
      case "autre": return <AutreArticleForm />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR réutilisée */}
      <SiteHeader />

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#002147] text-center">{t("title")}</h1>
        <p className="text-gray-600 mt-1 text-center">{t("subtitle")}</p>

        {/* Liste des types */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TYPES.map(({ key, label, img }) => {
            const active = type === key;
            return (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`rounded-xl border p-4 text-left transition group h-full
                  ${active ? "border-[#ffb400] bg-[#fff7e6] shadow"
                           : "border-gray-200 bg-white hover:border-[#ffb400]/60 hover:shadow-md"}`}
              >
                <div className="flex items-center gap-3 h-full">
                  <div className={`relative w-10 h-10 overflow-hidden rounded-lg ring-1 ${active ? "ring-[#ffb400]" : "ring-gray-200"}`}>
                    <Image src={img} alt={label} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="font-semibold text-[#002147]">{label}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Formulaire affiché */}
        <div className="mt-8 bg-white rounded-2xl shadow p-6">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}

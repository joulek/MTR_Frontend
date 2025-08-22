// app/[locale]/reclamations/page.jsx
"use client";
import dynamic from "next/dynamic";

// On charge le formulaire côté client uniquement
const ReclamationClient = dynamic(() => import("../client/reclamations/ReclamationClient"), { ssr: false });

export default function Page() {
  // Pas de gate d'auth ici -> accessible à tous
  return <ReclamationClient userIdFromProps={null} />;
}

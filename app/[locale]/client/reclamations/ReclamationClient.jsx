// app/[locale]/client/reclamations/ReclamationClient.jsx
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const TYPE_DOCS = [
  { value: "devis", label: "Devis" },
  { value: "bon_commande", label: "Bon de commande" },
  { value: "bon_livraison", label: "Bon de livraison" },
  { value: "facture", label: "Facture" },
];
const NATURES = [
  { value: "produit_non_conforme", label: "Produit non conforme" },
  { value: "deterioration_transport", label: "Détérioration transport" },
  { value: "erreur_quantite", label: "Erreur de quantité" },
  { value: "retard_livraison", label: "Retard de livraison" },
  { value: "defaut_fonctionnel", label: "Défaut fonctionnel" },
  { value: "autre", label: "Autre" },
];
const ATTENTES = [
  { value: "remplacement", label: "Remplacement" },
  { value: "reparation", label: "Réparation" },
  { value: "remboursement", label: "Remboursement" },
  { value: "autre", label: "Autre" },
];

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function ReclamationClient() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // -------------------- SESSION (نفس منطق AutreArticleForm) --------------------
  const [session, setSession] = useState(null);         // ex: { authenticated: true, role: "client", ... }
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store", credentials: "include" });
        const data = res.ok ? await res.json() : null;
        setSession(data || null);
      } catch {
        setSession(null);
      } finally {
        setLoadingSession(false);
      }
    })();
  }, []);

  const isAuthenticated = !!session?.authenticated;
  const isClient       = session?.role === "client";

  // ---------------------------------------------------------------------------

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    typeDoc: "devis",
    numero: "",
    dateLivraison: "",
    referenceProduit: "",
    quantite: "",
    nature: "produit_non_conforme",
    natureAutre: "",
    attente: "remplacement",
    attenteAutre: "",
    files: [],
  });

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "files") {
      setForm((f) => ({ ...f, files: Array.from(files || []) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // نفس الشيك متاع الفورم الأخرى
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname || `/${locale}/reclamations`);
      router.push(`/${locale}/login?next=${next}`);
      return;
    }
    if (!isClient) {
      setMessage("❌ هذه الخدمة مخصّصة للحرفاء فقط.");
      return;
    }

    if (!form.numero.trim()) {
      setMessage("⚠️ Le numéro de document est obligatoire.");
      return;
    }
    if (form.nature === "autre" && !form.natureAutre.trim()) {
      setMessage("⚠️ Précisez la nature de la réclamation.");
      return;
    }
    if (form.attente === "autre" && !form.attenteAutre.trim()) {
      setMessage("⚠️ Précisez votre attente.");
      return;
    }

    setSubmitting(true);
    try {
      const piecesJointes = await Promise.all(
        (form.files || []).map(async (file) => ({
          filename: file.name,
          mimetype: file.type || "application/octet-stream",
          data: await fileToBase64(file),
        }))
      );

      const parts = [];
      if (form.nature === "autre") parts.push(`Nature: ${form.natureAutre.trim()}`);
      if (form.attente === "autre") parts.push(`Attente: ${form.attenteAutre.trim()}`);
      const description = parts.length ? parts.join(" | ") : undefined;

      // خذ ال-id كيف AutreArticleForm (موجود في localStorage) بما أنّ /api/session ما يرجّعش user
      const localId = typeof window !== "undefined" ? localStorage.getItem("id") : null;

      const payload = {
        user: localId || null,  // ✅ نفس الطريقة
        commande: {
          typeDoc: form.typeDoc,
          numero: form.numero.trim(),
          dateLivraison: form.dateLivraison ? new Date(form.dateLivraison) : undefined,
          referenceProduit: form.referenceProduit || undefined,
          quantite: form.quantite ? Number(form.quantite) : undefined,
        },
        nature: form.nature,
        attente: form.attente,
        description,
        piecesJointes,
      };

      const res = await fetch(`${BACKEND}/api/reclamations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.message || `HTTP ${res.status}`);

      setMessage("✅ Réclamation envoyée avec succès.");
      setForm({
        typeDoc: "devis",
        numero: "",
        dateLivraison: "",
        referenceProduit: "",
        quantite: "",
        nature: "produit_non_conforme",
        natureAutre: "",
        attente: "remplacement",
        attenteAutre: "",
        files: [],
      });
      const fi = document.getElementById("filesInput");
      if (fi) fi.value = "";
    } catch (err) {
      setMessage(`❌ ${err?.message || "Erreur inconnue"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = loadingSession || submitting || !isAuthenticated || !isClient;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Formulaire de réclamation</h1>

      {!isAuthenticated && !loadingSession && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
          Vous devez être connecté pour soumettre une réclamation.
        </div>
      )}
      {isAuthenticated && !isClient && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
          Cette action est réservée aux clients.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Doc & Numéro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type de document</label>
            <select
              name="typeDoc"
              value={form.typeDoc}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            >
              {TYPE_DOCS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N° document</label>
            <input
              name="numero"
              value={form.numero}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              placeholder="ex: DV2500016"
              required
            />
          </div>
        </div>

        {/* Livraison & Produit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date de livraison</label>
            <input
              type="date"
              name="dateLivraison"
              value={form.dateLivraison}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Référence produit</label>
            <input
              name="referenceProduit"
              value={form.referenceProduit}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              placeholder="ex: ART-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantité</label>
            <input
              type="number"
              min="0"
              name="quantite"
              value={form.quantite}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              placeholder="ex: 10"
            />
          </div>
        </div>

        {/* Nature & Attente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nature de la réclamation</label>
            <select
              name="nature"
              value={form.nature}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            >
              {NATURES.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
            {form.nature === "autre" && (
              <input
                name="natureAutre"
                value={form.natureAutre}
                onChange={onChange}
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                placeholder="Préciser la nature"
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Votre attente</label>
            <select
              name="attente"
              value={form.attente}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            >
              {ATTENTES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            {form.attente === "autre" && (
              <input
                name="attenteAutre"
                value={form.attenteAutre}
                onChange={onChange}
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                placeholder="Préciser votre attente"
                required
              />
            )}
          </div>
        </div>

        {/* Pièces jointes */}
        <div>
          <label className="block text-sm font-medium mb-1">Pièces jointes (photos, PDF)</label>
          <input
            id="filesInput"
            type="file"
            name="files"
            multiple
            onChange={onChange}
            className="block w-full text-sm"
            accept="image/*,application/pdf"
          />
          <p className="text-xs text-gray-500 mt-1">Formats : images ou PDF. Taille max conseillée : 5 Mo par fichier.</p>
        </div>

        {/* Feedback */}
        {message && (
          <div className={`text-sm mt-2 ${message.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
            {message}
          </div>
        )}

        {/* Bouton */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={disabled}
            className={`rounded-xl px-4 py-2 text-white hover:opacity-90 ${
              disabled ? "bg-gray-500 cursor-not-allowed" : "bg-black"
            }`}
            title={!isAuthenticated ? "Connectez-vous pour envoyer" : !isClient ? "Réservé aux clients" : ""}
          >
            {submitting
              ? "Envoi en cours…"
              : !isAuthenticated
              ? "Se connecter pour envoyer"
              : !isClient
              ? "Accès réservé client"
              : "Envoyer la réclamation"}
          </button>
        </div>
      </form>
    </div>
  );
}

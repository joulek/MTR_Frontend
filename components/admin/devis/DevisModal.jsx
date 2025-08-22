"use client";
import { useEffect, useMemo, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function DevisModal({ open, onClose, demande }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  // N° devis (optionnel : preview + personnalisation)
  const [numero, setNumero] = useState("");
  const [customNum, setCustomNum] = useState(false);

  // Quantité/Remise/TVA (préremplis depuis la demande)
  const [quantite, setQuantite] = useState(1);
  const [remise, setRemise] = useState(0);
  const [tva, setTva] = useState(19);

  useEffect(() => {
    if (!open || !demande?._id) return;

    // 1) récupérer l’article relié en utilisant soit demandeId, soit le numéro de la demande (venant du tableau)
  (async () => {
  try {
    const num = demande?.numero || "";
    const url = `${BACKEND}/api/articles/by-demande?numero=${encodeURIComponent(num)}`;
    const r = await fetch(url, { credentials: "include" });
    const j = await r.json().catch(() => null);
    setArticle(j?.success ? j.item : null);
  } catch {
    setArticle(null);
  }
})();


    // 2) preview du prochain numéro de devis
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/admin/devis/next-number`, { credentials: "include" });
        const j = await r.json().catch(() => null);
        if (j?.success && j?.numero) setNumero(j.numero);
      } catch {}
    })();

    setQuantite(Number(demande?.quantite ?? 1) || 1);
  }, [open, demande]);

  const puht = useMemo(() => {
    const n = Number(article?.prixHT ?? article?.priceHT ?? article?.puht ?? 0);
    return isNaN(n) ? 0 : n;
  }, [article]);

  const totalHT = useMemo(() => {
    const q = Number(quantite) || 0;
    const r = Number(remise) || 0;
    return +(q * puht * (1 - r / 100)).toFixed(3);
  }, [puht, quantite, remise]);

  async function createDevis() {
    if (!article?._id) {
      alert("Aucun article n'est lié à cette demande.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        articleId: article._id,           // si tu as modifié le backend pour auto-déduire, tu peux supprimer cette ligne
        quantite: Number(quantite) || 1,
        remisePct: Number(remise) || 0,
        tvaPct: Number(tva) || 0,
        sendEmail: true,
      };
      if (customNum && numero?.trim()) body.numero = numero.trim();

      const res = await fetch(`${BACKEND}/api/admin/devis/from-demande/${demande._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json?.success) {
        setPdfUrl(json.pdf || "");
        // onClose?.(); // tu peux fermer et rafraîchir la liste si tu veux
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Créer un devis</h2>

        {/* N° demande (lecture seule depuis le tableau) */}
        <div className="mb-3">
          <label className="block">N° demande</label>
          <input
            value={demande?.demandeNumero || demande?.numero || ""}
            readOnly
            className="w-full border rounded-lg p-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* N° devis */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="block">N° devis</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={customNum}
                onChange={(e) => setCustomNum(e.target.checked)}
              />
              Personnaliser
            </label>
          </div>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            readOnly={!customNum}
            className={`w-full border rounded-lg p-2 ${customNum ? "bg-white" : "bg-gray-100 cursor-not-allowed"}`}
            placeholder="DV2500001"
          />
          {!customNum && <p className="text-xs text-gray-500 mt-1">Généré automatiquement.</p>}
        </div>

        {/* Article lié (pas de select) */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Article lié à la demande</label>
          {article ? (
            <div className="rounded-lg border p-3 bg-gray-50">
              <div className="font-medium">
                {(article.reference || article.ref || "").toString()} — {(article.designation || article.name_fr || article.name_en || "").toString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                PU HT : <b>{(article.prixHT ?? article.priceHT ?? 0).toFixed ? (article.prixHT ?? article.priceHT ?? 0).toFixed(3) : (article.prixHT ?? article.priceHT ?? 0)}</b>
              </div>
              {article.demandeNumero && (
                <div className="text-xs text-gray-500 mt-1">N° Demande lié : {article.demandeNumero}</div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border p-3 bg-red-50 border-red-200 text-red-700">
              Aucun article trouvé pour cette demande. Crée d’abord l’article lié (ou renseigne <code>demandeId</code> / <code>demandeNumero</code>).
            </div>
          )}
        </div>

        {/* Paramètres de calcul */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block mb-1">Qté</label>
            <input
              type="number" min={1}
              value={quantite} onChange={(e) => setQuantite(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block mb-1">Remise %</label>
            <input
              type="number" min={0}
              value={remise} onChange={(e) => setRemise(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block mb-1">TVA %</label>
            <select
              value={tva} onChange={(e) => setTva(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-500"
            >
              <option>0</option><option>7</option><option>13</option><option>19</option>
            </select>
          </div>
        </div>

        {/* Totaux */}
        <div className="mt-4 bg-gray-50 rounded-lg p-2 flex justify-between">
          <span>PU HT: {puht.toFixed(3)}</span>
          <span>Total HT: {totalHT.toFixed(3)}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 border rounded-lg" onClick={onClose}>Annuler</button>
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg disabled:opacity-50"
            onClick={createDevis}
            disabled={loading || !article?._id}
          >
            {loading ? "Création..." : "Créer & envoyer"}
          </button>
        </div>

        {pdfUrl && (
          <div className="mt-4">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              Ouvrir le PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// app/admin/devis/page.jsx
"use client";
import { useEffect, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function AdminDevisPage() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/devis/traction`, { cache: "no-store" });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Erreur");
        setItems(data.items || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  // ✅ Ouvrir le PDF d’un devis
  async function viewPdf(id) {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Non authentifié");
      const res = await fetch(`/api/admin/devis/traction/${id}/pdf`);

      if (!res.ok) {
        const txt = await res.text();
        return alert(`Erreur PDF: ${txt || res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(`/api/admin/devis/traction/${id}/pdf`, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Erreur réseau pendant l’ouverture du PDF");
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-[#002147]">Devis – Traction</h1>
      {err && <p className="text-red-600 ">{err}</p>}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-[#002147]">
            <tr>

              <th className="px-4 py-3 text-left">N°</th>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">PDF</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d._id} className="border-t text-[#002147]">
                <td className="px-4 py-2">{d.numero}</td>
                <td className="px-4 py-2">{d.user?.prenom} {d.user?.nom}</td>
                <td className="px-4 py-2">{d.user?.email}</td>
                <td className="px-4 py-2">{new Date(d.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <button onClick={() => viewPdf(d._id)} className="underline text-[#002147]">
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-[#002147]" colSpan={7}>Aucun devis</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
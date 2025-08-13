"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// ✅ Helpers
function humanSize(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function shortMime(m) {
  if (!m) return "?";
  if (m.includes("pdf")) return "pdf";
  if (m.includes("word")) return "docx";
  if (m.includes("excel")) return "xlsx";
  if (m.includes("image")) return "image";
  if (m.includes("text")) return "txt";
  return m.split("/").pop();
}

function cleanFilename(name = "") {
  if (name.startsWith("~$")) return "";
  return name;
}

export default function AdminDevisPage() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // 🔄 Charger la liste des devis
  const load = useCallback(async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/admin/devis/fil`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        router.push(`/fr/login?next=${encodeURIComponent("/fr/admin/devis/fil")}`);
        return;
      }
      if (res.status === 403) {
        router.push(`/fr/unauthorized?code=403`);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Erreur (${res.status})`);
      }
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // 🔄 Rafraîchir manuellement
  async function refreshList() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // 📄 Ouvrir le PDF principal
  async function viewPdfById(id) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/devis/fil/${id}/pdf`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        return alert("PDF non disponible.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Impossible d’ouvrir le PDF.");
    }
  }

  // 📎 Ouvrir un document joint
  async function viewDocByIndex(id, index) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/devis/fil/${id}/document/${index}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        return alert("Document non disponible.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Impossible d’ouvrir le document.");
    }
  }

  return (
    <div className="p-6">
      {/* 🔹 Titre et bouton de refresh */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#002147]">Devis – fil</h1>
        <button
          onClick={refreshList}
          disabled={loading || refreshing}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            loading || refreshing
              ? "text-gray-500 border-gray-300 cursor-not-allowed"
              : "text-[#002147] border-[#002147] hover:bg-[#002147] hover:text-white"
          }`}
        >
          {refreshing ? "Rafraîchissement…" : "Rafraîchir"}
        </button>
      </div>

      {/* 🔹 Message d'erreur */}
      {err && (
        <p className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700">
          {err}
        </p>
      )}

      {/* 🔹 Tableau */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-[#002147]">
            <tr>
              <th className="px-4 py-3 text-left">N°</th>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">PDF</th>
              <th className="px-4 py-3 text-left">Fichiers joints</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#002147]">
                  Chargement…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#002147]">
                  Aucun devis
                </td>
              </tr>
            ) : (
              items.map((d) => {
                const hasPdf = Boolean(d?.hasDemandePdf);
                const visibleDocs = (d?.documents || [])
                  .map((doc, idx) => ({
                    ...doc,
                    index: doc.index ?? idx,
                    filename: cleanFilename(doc.filename),
                  }))
                  .filter(doc => doc.filename && (doc.size ?? 0) > 0);

                return (
                  <tr key={d._id} className="border-t text-[#002147]">
                    <td className="px-4 py-2">{d.numero}</td>
                    <td className="px-4 py-2">{d.user?.prenom} {d.user?.nom}</td>
                    <td className="px-4 py-2">{d.user?.email}</td>
                    <td className="px-4 py-2">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {hasPdf ? (
                        <button
                          onClick={() => viewPdfById(d._id)}
                          className="underline text-[#002147]"
                        >
                          Ouvrir
                        </button>
                      ) : (
                        <span className="text-gray-500">Indisponible</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {visibleDocs.length === 0 ? (
                        <span className="text-gray-500">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {visibleDocs.map((doc) => (
                            <li key={doc.index} className="flex items-center gap-2">
                              <button
                                onClick={() => viewDocByIndex(d._id, doc.index)}
                                className="underline text-[#002147]"
                              >
                                Ouvrir
                              </button>
                              <span className="truncate max-w-[220px]" title={doc.filename}>
                                {doc.filename}
                              </span>
                              <span className="text-xs text-gray-500">
                                {shortMime(doc.mimetype)} · {humanSize(doc.size)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

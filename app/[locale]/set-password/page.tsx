"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const linkInvalid = useMemo(() => !uid || !token, [uid, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (linkInvalid) {
      setMsg({ type: "err", text: "Lien invalide ou incomplet." });
      return;
    }
    if (password.length < 6) {
      setMsg({ type: "err", text: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    if (password !== confirm) {
      setMsg({ type: "err", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    try {
      setLoading(true);

      // 👉 on passe par le proxy Next.js, pas par l'URL backend
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Erreur (${res.status})`);
      }

      setMsg({ type: "ok", text: "Mot de passe défini avec succès. Redirection…" });
      setTimeout(() => router.push(`/${locale}/login`), 1500);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-center text-[#0B1E3A]">
          Définir un mot de passe
        </h1>

        {linkInvalid ? (
          <p className="text-red-600 text-center">Lien invalide ou incomplet</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B1E3A] text-white py-2 rounded-lg disabled:opacity-60"
            >
              {loading ? "Envoi…" : "Valider"}
            </button>

            {msg && (
              <p
                className={`text-center mt-2 text-sm ${
                  msg.type === "ok" ? "text-green-600" : "text-red-600"
                }`}
              >
                {msg.text}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

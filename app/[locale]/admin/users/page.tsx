"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FiSearch, FiUserPlus } from "react-icons/fi";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function fmtDate(d?: string) {
  try {
    const dt = new Date(d as string);
    return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "—";
  }
}
const roleLabel = (r?: string) => (r === "admin" ? "admin" : "client");

export default function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/users`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) return router.push(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
      if (res.status === 403) return router.push(`/${locale}/unauthorized?code=403`);

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      const users = Array.isArray(data) ? data : (data.users || data.data || []);
      if (!Array.isArray(users)) throw new Error("Réponse inattendue /api/users");

      setRows(users);
    } catch (e: any) {
      setErr(e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((u) => {
      const name = `${u?.prenom || ""} ${u?.nom || ""}`.toLowerCase();
      return (
        name.includes(needle) ||
        String(u?.email || "").toLowerCase().includes(needle) ||
        String(u?.numTel || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-[#0B1E3A]">Utilisateurs</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-[280px] max-w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, email, téléphone)"
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-sm 
                         shadow focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/30 outline-none"
            />
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B1E3A] text-white px-3 py-2 text-sm hover:opacity-90"
          >
            <FiUserPlus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-gray-700 text-left">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:border-b [&>th]:border-gray-200">
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Type de compte</th>
                <th>Rôle</th>
                <th>Créé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement…</td></tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Aucun utilisateur.</td></tr>
              )}

              {!loading && filtered.map((u, i) => (
                <tr key={u._id || i} className={i % 2 ? "bg-white" : "bg-gray-50/40"}>
                  <td className="px-4 py-3">{`${u?.prenom || ""} ${u?.nom || ""}`.trim() || "—"}</td>
                  <td className="px-4 py-3">{u?.email || "—"}</td>
                  <td className="px-4 py-3">{u?.numTel || "—"}</td>
                  <td className="px-4 py-3 capitalize">{u?.accountType || "—"}</td>
                  <td className="px-4 py-3">{roleLabel(u?.role)}</td>
                  <td className="px-4 py-3">{fmtDate(u?.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(u)}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {err && <p className="text-red-600">{err}</p>}

      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); load(); }}
        />
      )}

      {selected && <DetailsModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* -------------------- Modals -------------------- */

function DetailsModal({ user, onClose }: { user: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-[#0B1E3A]">Détails utilisateur</h3>
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Fermer</button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="Nom">{user?.nom}</Field>
          <Field label="Prénom">{user?.prenom}</Field>
          <Field label="Email">{user?.email}</Field>
          <Field label="Téléphone">{user?.numTel || "—"}</Field>
          <Field label="Adresse" className="sm:col-span-2">{user?.adresse || "—"}</Field>
          <Field label="Type de compte">{user?.accountType || "—"}</Field>
          <Field label="Rôle">{user?.role === "admin" ? "admin" : "client"}</Field>

          {user?.accountType === "personnel" && (
            <>
              <Field label="CIN">{user?.personal?.cin || "—"}</Field>
              <Field label="Poste actuel">{user?.personal?.posteActuel || "—"}</Field>
            </>
          )}

          {user?.accountType === "societe" && (
            <>
              <Field label="Société">{user?.company?.nomSociete || "—"}</Field>
              <Field label="Matricule fiscal">{user?.company?.matriculeFiscal || "—"}</Field>
              <Field label="Poste actuel" className="sm:col-span-2">{user?.company?.posteActuel || "—"}</Field>
            </>
          )}

          <Field label="Créé le" className="sm:col-span-2">{fmtDate(user?.createdAt)}</Field>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children, className = "" }: any) {
  return (
    <div className={className}>
      <div className="text-gray-500 text-xs font-semibold">{label}</div>
      <div className="mt-0.5 text-[#0B1E3A]">{children}</div>
    </div>
  );
}

function InviteUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<"personnel" | "societe" | "">("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const payload: any = {
      nom: String(fd.get("nom") || ""),
      prenom: String(fd.get("prenom") || ""),
      email: String(fd.get("email") || ""),
      numTel: String(fd.get("numTel") || ""),
      adresse: String(fd.get("adresse") || ""),
      accountType: type,
      role: String(fd.get("role") || "client"),
    };

    if (type === "personnel") {
      payload.personal = {
        cin: String(fd.get("cin") || ""),
        posteActuel: String(fd.get("posteActuelPers") || ""),
      };
    } else if (type === "societe") {
      payload.company = {
        nomSociete: String(fd.get("nomSociete") || ""),
        matriculeFiscal: String(fd.get("matriculeFiscal") || ""),
        posteActuel: String(fd.get("posteActuelSoc") || ""),
      };
    }

    try {
      // Appelle le backend admin pour inviter l’utilisateur (création + email)
      const res = await fetch(`${BACKEND}/api/admin/users/invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || `Erreur ${res.status}`);
      onCreated();
    } catch (e: any) {
      setErr(e?.message || "Erreur d’envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-[#0B1E3A]">Ajouter un utilisateur</h3>
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Fermer</button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {err && <div className="sm:col-span-2 text-red-600">{err}</div>}

          <Input name="nom" label="Nom" required />
          <Input name="prenom" label="Prénom" required />
          <Input name="email" type="email" label="Email" required />
          <Input name="numTel" label="Téléphone" />
          <Input name="adresse" label="Adresse" className="sm:col-span-2" />

          <div className="sm:col-span-2">
            <div className="text-gray-500 text-xs font-semibold mb-1">Type de compte</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="accountType" onChange={() => setType("personnel")} required />
                Personnel
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="accountType" onChange={() => setType("societe")} required />
                Société
              </label>
            </div>
          </div>

          {type === "personnel" && (
            <>
              <Input name="cin" label="CIN" />
              <Input name="posteActuelPers" label="Poste actuel" />
            </>
          )}
          {type === "societe" && (
            <>
              <Input name="nomSociete" label="Nom Société" />
              <Input name="matriculeFiscal" label="Matricule fiscal" />
              <Input name="posteActuelSoc" label="Poste actuel" className="sm:col-span-2" />
            </>
          )}

          <div className="sm:col-span-2">
            <div className="text-gray-500 text-xs font-semibold mb-1">Rôle</div>
            <select name="role" className="w-full rounded-lg border px-3 py-2">
              <option value="client">client</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#0B1E3A] text-white px-4 py-2 hover:opacity-90"
            >
              {loading ? "Envoi…" : "Créer et envoyer l’invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Input({ label, className = "", ...props }: any) {
  return (
    <label className={`flex flex-col ${className}`}>
      <span className="text-gray-500 text-xs font-semibold mb-1">{label}</span>
      <input {...props} className="rounded-lg border px-3 py-2" />
    </label>
  );
}

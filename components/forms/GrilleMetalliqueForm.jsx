"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function GrilleMetalliqueForm() {
  const t = useTranslations("auth.grilleForm");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const materialChecks = t.raw("materialChecks") || [];
  const finishChecks = t.raw("finishChecks") || [];

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk(""); setErr(""); setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.append("type", "grille");
      const res = await fetch("/api/devis", { method: "POST", body: fd });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
      if (!res.ok) return setErr(data?.message || t("sendError"));
      setOk(t("sendSuccess"));
      e.currentTarget.reset();
    } catch { setErr(t("networkError")); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <h2 className="md:col-span-2 text-xl font-bold text-[#002147]">{t("title")}</h2>

      <Input name="L"      label={t("L")} required />
      <Input name="l"      label={t("l")} required />
      <Input name="nbLong" label={t("nbLong")} required />
      <Input name="nbTrans"label={t("nbTrans")} required />
      <Input name="pas1"   label={t("pas1")} required />
      <Input name="pas2"   label={t("pas2")} required />
      <Input name="D2"     label={t("D2")} required />
      <Input name="D1"     label={t("D1")} required />
      <Input name="quantite" label={t("quantity")} required />

      <div className="md:col-span-2 flex justify-center my-2">
        <Image
          src="/devis/grille.png"
          alt={t.has("schemaAlt") ? t("schemaAlt") : "Metal grid with zoom"}
          width={500} height={500} className="rounded-lg shadow-lg" priority
        />
      </div>

      <div>
        <label className="block font-semibold text-[#002147]">{t("material")}</label>
        <div className="mt-2 space-y-1">
          {materialChecks.map(m => <Checkbox key={m} name="matiere" value={m} label={m} />)}
        </div>
      </div>

      <div>
        <label className="block font-semibold text-[#002147]">{t("finish")}</label>
        <div className="mt-2 space-y-1">
          {finishChecks.map(f => <Checkbox key={f} name="finition" value={f} label={f} />)}
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block font-semibold text-[#002147]">{t("docs")}</label>
        <input type="file" name="docs" multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
          className="mt-1 block w-full"
        />
      </div>

      <TextArea name="exigences" label={t("specialReq")} />
      <TextArea name="remarques" label={t("otherRemarks")} />

      <div className="md:col-span-2">
        {err && <p className="text-sm text-red-600 font-semibold">{err}</p>}
        {ok && <p className="text-sm text-green-600 font-semibold">{ok}</p>}
      </div>

      <div className="md:col-span-2">
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-[#002147] text-white font-bold py-3 disabled:opacity-50">
          {loading ? t("sending") : t("sendRequest")}
        </button>
      </div>
    </form>
  );
}

function Input({ label, name, required }) {
  return (
    <div className="space-y-1">
      <label className="block font-semibold text-[#002147]">{label}{required && " *"}</label>
      <input name={name} required={required} className="w-full rounded-xl border border-gray-200 px-4 py-2" />
    </div>
  );
}
function TextArea({ label, name }) {
  return (
    <div className="space-y-1 md:col-span-2">
      <label className="block font-semibold text-[#002147]">{label}</label>
      <textarea name={name} rows={4} className="w-full rounded-xl border border-gray-200 px-4 py-2" />
    </div>
  );
}
function Checkbox({ name, value, label }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} value={value} className="accent-[#002147]" />
      <span>{label}</span>
    </label>
  );
}

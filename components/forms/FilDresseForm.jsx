"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function FilDresseForm() {
  const t = useTranslations("auth.filForm");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const unitOptions = t.raw("unitOptions") || [];
  const materialChecks = t.raw("materialChecks") || [];
  const selectPlaceholder = t.has("selectPlaceholder") ? t("selectPlaceholder") : "--";

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk(""); setErr(""); setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.append("type", "fil");

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

      <Input name="longueur" label={t("length")} required />

      <div className="hidden md:flex md:row-span-4 md:col-start-2 justify-center items-start">
        <Image
          src="/devis/dresser.png"
          alt={t.has("schemaAlt") ? t("schemaAlt") : "Wire bundle"}
          width={420} height={260} className="rounded-lg shadow" priority
        />
      </div>

      <Input name="diametre" label={t("diameter")} required />
      <Select name="unite" label={t("unit")} required options={unitOptions} placeholder={selectPlaceholder} />
      <Input name="quantite" label={t("quantityWanted")} required />

      <div className="space-y-2">
        <label className="block font-semibold text-[#002147]">{t("material")}</label>
        <div className="space-y-1">
          {materialChecks.map((m) => (
            <Checkbox key={m} name="matiere" value={m} label={m} />
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block font-semibold text-[#002147]">{t("docs")}</label>
        <input
          type="file" name="docs" multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
          className="mt-1 block w-full"
        />
      </div>

      <TextArea name="exigences" label={t("specialReq")} />
      <TextArea name="remarques" label={t("otherRemarks")} />

      <Messages ok={ok} err={err} />
      <Submit loading={loading} t={t} />
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
function Select({ label, name, options = [], required, placeholder="--" }) {
  return (
    <div className="space-y-1">
      <label className="block font-semibold text-[#002147]">{label}{required && " *"}</label>
      <select name={name} required={required} className="w-full rounded-xl border border-gray-200 px-4 py-2">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
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
function Messages({ ok, err }) {
  return (
    <div className="md:col-span-2">
      {err && <p className="text-sm text-red-600 font-semibold">{err}</p>}
      {ok && <p className="text-sm text-green-600 font-semibold">{ok}</p>}
    </div>
  );
}
function Submit({ loading, t }) {
  return (
    <div className="md:col-span-2">
      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-[#002147] text-white font-bold py-3 disabled:opacity-50">
        {loading ? t("sending") : t("sendRequest")}
      </button>
    </div>
  );
}

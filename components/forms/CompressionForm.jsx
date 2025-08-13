"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";


import schemaImg from "@/public/devis/compression01.png";
import typeImg from "@/public/devis/compression02.png";



export default function CompressionForm() {
  const t = useTranslations("auth.compressionForm");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const matOptions = t.raw("materialOptions") || [];
  const windOptions = t.raw("windingOptions") || [];
  const extremityOptions = t.raw("extremityOptions") || [];
  const selectPlaceholder = t.has("selectPlaceholder") ? t("selectPlaceholder") : "--";

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk(""); setErr(""); setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.append("type", "compression");

      const res = await fetch("/api/devis", { method: "POST", body: fd });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok) return setErr(data?.message || t("sendError"));
      setOk(t("sendSuccess"));
      e.currentTarget.reset();
    } catch {
      setErr(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <h2 className="md:col-span-2 text-xl center font-bold text-[#002147]">
        {t("title")}
      </h2>

      <div className="md:col-span-2 flex justify-center">
        <Image
          src={schemaImg}
          alt={t.has("schemaAlt") ? t("schemaAlt") : "Compression spring"}
          width={400} height={250} className="rounded-lg shadow-lg"
        />
      </div>

      <Input name="d" label={t("diameterWire")} required />
      <Input name="DE" label={t("diameterExt")} required />
      <Input name="H" label={t("boreDiameter")} />
      <Input name="S" label={t("guideDiameter")} />
      <Input name="DI" label={t("diameterInt")} required />
      <Input name="Lo" label={t("freeLength")} required />
      <Input name="nbSpires" label={t("totalCoils")} required />
      <Input name="pas" label={t("pitch")} />
      <Input name="quantite" label={t("quantity")} required />

      <Select name="matiere" label={t("material")} required options={matOptions} placeholder={selectPlaceholder} />
      <Select name="enroulement" label={t("windingDirection")} required options={windOptions} placeholder={selectPlaceholder} />
      <Select name="extremite" label={t("extremityType")} required options={extremityOptions} placeholder={selectPlaceholder} />

      <div className="md:col-span-2 flex justify-center">
        <Image
          src={typeImg}
          alt={t.has("extremityAlt") ? t("extremityAlt") : "Spring ends"}
          width={400} height={200} className="rounded-lg shadow-lg mt-2"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block font-semibold text-[#002147]">{t("docs")}</label>
        <input type="file" name="docs" multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
          className="mt-1 block w-full" />
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
      <label className="block font-semibold text-[#002147]">
        {label}{required && " *"}
      </label>
      <input name={name} required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-2" />
    </div>
  );
}
function Select({ label, name, options = [], required, placeholder="--" }) {
  return (
    <div className="space-y-1">
      <label className="block font-semibold text-[#002147]">
        {label}{required && " *"}
      </label>
      <select name={name} required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-2">
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
      <textarea name={name} rows={4}
        className="w-full rounded-xl border border-gray-200 px-4 py-2" />
    </div>
  );
}

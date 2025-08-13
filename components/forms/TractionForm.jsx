// components/forms/TractionForm.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import schemaImg from "@/public/devis/traction.png";
import positionsImg from "@/public/devis/traction01.png";
import accrochesImg from "@/public/devis/traction02.png";

/* --- petite étoile rouge pour champs requis --- */
const RequiredMark = () => (
  <span className="text-red-500" aria-hidden="true"> *</span>
);

export default function TractionForm() {
  const t = useTranslations("auth.tractionForm");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);

  // Pour empêcher qu'un catch tardif écrase le succès
  const finishedRef = useRef(false);

  // Zone d'alerte sous le bouton
  const alertRef = useRef(null);

  // Dropzone
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Options i18n
  const matOptions = t.raw("materialOptions") || [];
  const windOptions = t.raw("windingOptions") || [];
  const ringOptions = t.raw("ringOptions") || [];
  const hookOptions = t.raw("hookOptions") || [];
  const selectPlaceholder = t.has("selectPlaceholder") ? t("selectPlaceholder") : "Sélectionnez…";

  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data || null))
      .catch(() => setUser(null));
  }, []);

  // Scroll vers l'alerte quand loading/ok/err change
  useEffect(() => {
    if (alertRef.current && (loading || ok || err)) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, ok, err]);

  // Masquer le succès après 5s
  useEffect(() => {
    if (!ok) return;
    const id = setTimeout(() => setOk(""), 5000);
    return () => clearTimeout(id);
  }, [ok]);

  function handleFileList(list) {
    const arr = Array.from(list || []);
    setFiles(arr);

    if (fileInputRef.current) {
      const dt = new DataTransfer();
      arr.forEach((f) => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) handleFileList(e.dataTransfer.files);
  }

  const onSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;          // ✅ capture le form AVANT l’await
    setOk("");
    setErr("");
    finishedRef.current = false;

    if (!user?.authenticated) {
      setErr("Vous devez être connecté pour envoyer un devis.");
      return;
    }
    if (user.role !== "client") {
      setErr("Seuls les clients peuvent envoyer une demande de devis.");
      return;
    }

    setLoading(true); // -> message "en cours"
    try {
      const fd = new FormData(form);
      fd.append("type", "traction");

      const userId = localStorage.getItem("id");
      if (userId) fd.append("user", userId);

      const res = await fetch("/api/devis/traction", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      // Essaye de lire le JSON SANS planter si ce n'en est pas un
      let payload = null;
      try {
        payload = await res.json();
      } catch { /* pas de JSON lisible, ignore */ }

      if (res.ok) {                         // ✅ 200/201 = succès
        finishedRef.current = true;
        setErr("");
        setOk("Demande confirmée. Merci !"); // ← ton message succès

        form.reset();                       // ✅ utiliser la variable 'form'
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Erreur HTTP
      const msg = payload?.message || `Erreur lors de l’envoi. (HTTP ${res.status})`;
      setErr(msg);
    } catch (e) {
      console.error("submit traction error:", e);
      // ⛔️ ne pas écraser un succès déjà posé
      if (!finishedRef.current) {
        const isAbort = e?.name === "AbortError";
        setErr(isAbort ? "Délai dépassé, réessayez." : "Erreur réseau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !user?.authenticated || user?.role !== "client";

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Titre */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#002147]">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t.has("subtitle") ? t("subtitle") : ""}
        </p>
      </div>

      <form onSubmit={onSubmit}>
        {/* --- Form fields --- */}
        <SectionTitle>{t.has("schemaTitle") ? t("schemaTitle") : "Schéma"}</SectionTitle>
        <div className="mb-6 flex justify-center">
          <Image
            src={schemaImg}
            alt={t.has("schemaAlt") ? t("schemaAlt") : "Traction schema"}
            width={420}
            height={380}
            className="rounded-xl ring-1 ring-gray-100"
            priority
          />
        </div>

        <SectionTitle>{t.has("mainDims") ? t("mainDims") : "Dimensions principales"}</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Input name="d" label={t("diameterWire")} required />
          <Input name="De" label={t("diameterExt")} required />
          <Input name="Lo" label={t("freeLength")} required />
          <Input name="nbSpires" label={t("totalCoils")} required />
          <Input name="quantite" label={t("quantity")} type="number" min="1" required />
          <SelectBase name="matiere" label={t("material")} options={matOptions} placeholder={selectPlaceholder} required />
          <SelectBase name="enroulement" label={t("windingDirection")} options={windOptions} placeholder={selectPlaceholder} required />
        </div>

        <SectionTitle className="mt-8">
          {t("ringPosition")} <span className="text-red-500">*</span>
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
          <div className="md:pt-4 w-full">
            <label className="block text-sm font-semibold text-[#002147] mb-2">
              {t.has("chooseRingPosition") ? t("chooseRingPosition") : "Choisir la position"}
              <RequiredMark />
            </label>
            <select
              name="positionAnneaux"
              required
              className="w-full rounded-xl border-2 border-[#002147] px-4 py-2.5 bg-white
                         text-[#002147] text-[15px] font-medium
                         focus:outline-none focus:ring-2 focus:ring-[#002147]/40 focus:border-[#002147]">
              <option value="" style={{ color: "#64748b" }}>
                {selectPlaceholder === "Sélectionnez…" ? "Sélectionnez une position…" : selectPlaceholder}
              </option>
              {ringOptions.map((o) => (
                <option key={o} value={o} style={{ color: "#002147" }}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center md:justify-start">
            <Image
              src={positionsImg}
              alt={t.has("ringPositionsAlt") ? t("ringPositionsAlt") : "Ring positions"}
              width={420}
              height={240}
              className="rounded-xl ring-1 ring-gray-100"
            />
          </div>
        </div>

        <SectionTitle className="mt-8">{t("hookType")} <span className="text-red-500">*</span></SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
          <div className="flex justify-center md:justify-start">
            <Image
              src={accrochesImg}
              alt={t.has("hookTypesAlt") ? t("hookTypesAlt") : "Hook types"}
              width={520}
              height={300}
              className="rounded-xl ring-1 ring-gray-100"
            />
          </div>
          <div className="md:pt-4 w-full">
            <label className="block text-sm font-semibold text-[#002147] mb-2">
              {t.has("chooseHookType") ? t("chooseHookType") : "Choisir un type"}
              <RequiredMark />
            </label>
            <select
              name="typeAccrochage"
              required
              className="w-full rounded-xl border-2 border-[#002147] px-4 py-2.5 bg-white
                         text-[#002147] text-[15px] font-medium
                         focus:outline-none focus:ring-2 focus:ring-[#002147]/40 focus:border-[#002147]">
              <option value="" style={{ color: "#64748b" }}>
                {selectPlaceholder === "Sélectionnez…" ? "Sélectionnez un type…" : selectPlaceholder}
              </option>
              {hookOptions.map((o) => (
                <option key={o} value={o} style={{ color: "#002147" }}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SectionTitle className="mt-8">{t("docs")} <RequiredMark /></SectionTitle>
        <p className="text-sm text-gray-500 mb-3">
          Types acceptés : .pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .gif, .txt
        </p>

        <label
          htmlFor="docs"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center cursor-pointer rounded-2xl text-center transition
                      min-h-[160px] md:min-h-[200px] p-8 bg-white
                      border-2 border-dashed ${isDragging ? "border-yellow-500 ring-2 ring-yellow-300" : "border-yellow-500"}`}
        >
          {files.length === 0 ? (
            <p className="text-base font-medium text-[#002147]">
              Cliquez ou glissez-déposez vos fichiers ici
            </p>
          ) : (
            <div className="w-full text-center">
              <p className="text-sm font-semibold text-[#002147] mb-2">
                {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""} :
              </p>
              <p className="mx-auto max-w-[900px] truncate text-[15px] text-[#002147]">
                {files.map((f) => f.name).join(", ")}
              </p>
              <p className="text-xs text-[#002147]/70 mt-1">
                {(files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0)} Ko au total
              </p>
            </div>
          )}

          <input
            id="docs"
            ref={fileInputRef}
            type="file"
            name="docs"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
            className="hidden"
            onChange={(e) => handleFileList(e.target.files)}
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:gap-6 mt-6">
          <TextArea name="exigences" label={t("specialReq")} />
          <TextArea name="remarques" label={t("otherRemarks")} />
        </div>

        {/* Bouton Submit */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={disabled}
            className={`w-full rounded-xl font-semibold py-3 transition-all
              ${disabled
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-[#002147] to-[#01346b] text-white shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px]"}`}
          >
            {loading
              ? "Envoi en cours…"
              : !user?.authenticated
                ? t("loginToSend")
                : user?.role !== "client"
                  ? t("reservedClients")
                  : t("sendRequest")}
          </button>

          {/* ALERTES SOUS LE BOUTON */}
          <div ref={alertRef} aria-live="polite" className="mt-3">
            {loading ? (
              <Alert
                type="info"
                message="Votre demande de devis est en cours d'envoi, veuillez patienter…"
              />
            ) : err ? (
              <Alert type="error" message={err} />
            ) : ok ? (
              <Alert type="success" message={ok} />
            ) : null}
          </div>
        </div>
      </form>
    </section>
  );
}

/* === UI helpers === */
function SectionTitle({ children, className = "" }) {
  return (
    <div className={`mb-3 mt-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="h-5 w-1.5 rounded-full bg-[#002147]" />
        <h3 className="text-lg font-semibold text-[#002147]">{children}</h3>
      </div>
      <div className="mt-2 h-px w-full bg-gradient-to-r from-[#002147]/20 via-gray-200 to-transparent" />
    </div>
  );
}

function Alert({ type = "info", message }) {
  const base = "w-full rounded-xl px-4 py-3 text-sm font-medium border flex items-start gap-2";
  const styles =
    type === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : type === "success"
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <div className={`${base} ${styles}`}>
      <span className="mt-0.5">•</span>
      <span>{message}</span>
    </div>
  );
}

function Input({ label, name, required, type = "text", min }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block font-medium text-[#002147]">
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      <input
        name={name}
        type={type}
        min={min}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5
                   text-[#002147] placeholder:text-gray-400
                   focus:outline-none focus:ring-2 focus:ring-[#002147]/30 focus:border-[#002147]"/>
    </div>
  );
}

function SelectBase({ label, name, options = [], required, placeholder = "Sélectionnez…" }) {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="block font-medium text-[#002147]">
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      <select
        name={name}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white
                   text-[#002147] text-[15px] font-medium
                   focus:outline-none focus:ring-2 focus:ring-[#002147]/30 focus:border-[#002147]">
        <option value="" style={{ color: "#64748b" }}>{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} style={{ color: "#002147" }}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, name }) {
  return (
    <div className="space-y-1">
      <label className="block font-medium text-[#002147]">{label}</label>
      <textarea
        name={name}
        rows={4}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5
                   text-[#002147] placeholder:text-gray-400
                   focus:outline-none focus:ring-2 focus:ring-[#002147]/30 focus:border-[#002147]"/>
    </div>
  );
}

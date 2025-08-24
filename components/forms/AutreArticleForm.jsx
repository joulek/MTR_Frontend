"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/* --- petite étoile rouge pour champs requis --- */
const RequiredMark = () => <span className="text-red-500" aria-hidden> *</span>;

export default function AutreArticleForm() {
  const t = useTranslations("auth.autreForm");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);

  const alertRef = useRef(null);
  const finishedRef = useRef(false);

  // Dropzone
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const matOptions = t.raw("materialOptions") || [];
  const selectPlaceholder = t.has("selectPlaceholder") ? t("selectPlaceholder") : "Sélectionnez…";

  // ✅ AJOUT MINIMAL : mapping des libellés anglais -> valeurs FR attendues par le backend
  // (aucun changement d’UI, on convertit seulement au moment de l’envoi)
  const EN_MAT = [
    "Galvanized steel wire",
    "Black steel wire",
    "Spring steel wire",
    "Stainless steel spring wire",
    "Galvanized steel",
    "Black steel",
    "Spring steel",
    "Stainless steel"
  ];
  const FR_MAT = [
    "Acier galvanisé",
    "Acier Noir",
    "Acier ressort",
    "Acier inoxydable"
  ];
  function normalizeMatiere(fd) {
    const v = fd.get("matiere");
    if (!v) return;
    // déjà FR ?
    if (FR_MAT.includes(v)) return;
    // cherche correspondance exacte d'abord
    let idx = EN_MAT.indexOf(String(v));
    if (idx >= 0) {
      // regrouper 8 EN vers 4 FR (par paires)
      const frIndex = Math.min(idx, 3);
      fd.set("matiere", FR_MAT[frIndex]);
      return;
    }
    // tolérer casse/espaces
    const low = String(v).toLowerCase().trim();
    const enLow = EN_MAT.map(s => s.toLowerCase());
    idx = enLow.indexOf(low);
    if (idx >= 0) {
      const frIndex = Math.min(idx, 3);
      fd.set("matiere", FR_MAT[frIndex]);
    }
  }
  // -------------------------------------------------------------------------------

  // Récup session
  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data || null))
      .catch(() => setUser(null));
  }, []);

  // Scroll vers l’alerte
  useEffect(() => {
    if (alertRef.current && (loading || ok || err)) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, ok, err]);

  // Auto-hide succès
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
      arr.forEach(f => dt.items.add(f));
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
  const form = e.currentTarget;
  setOk(""); setErr("");
  finishedRef.current = false;

  if (!user?.authenticated) {
    setErr(t.has("loginToSend") ? t("loginToSend") : "Vous devez être connecté pour envoyer un devis.");
    return;
  }
  if (user.role !== "client") {
    setErr(t.has("reservedClients") ? t("reservedClients") : "Seuls les clients peuvent envoyer une demande de devis.");
    return;
  }

  // ⚠️ petit garde-fou: au moins un fichier si tu le veux “obligatoire”
  // if (files.length === 0) { setErr("Veuillez joindre au moins un document."); return; }

  setLoading(true);
  try {
    const fd = new FormData(form);
    fd.append("type", "autre");

    // --- lecture propre + trim ---
    const designation = (fd.get("designation") || "").toString().trim();
    const dimensions  = (fd.get("dimensions")  || "").toString().trim();
    const matiere     = (fd.get("matiere")     || "").toString().trim();
    const exigences   = (fd.get("exigences")   || "").toString().trim();
    const remarques   = (fd.get("remarques")   || "").toString().trim();
    const descLibre   = (fd.get("description") || "").toString().trim();
    const qRaw        = (fd.get("quantite")    || "").toString().trim();

    // --- quantité en nombre >= 1 ---
    const qte = Math.max(1, Number.isFinite(Number(qRaw)) ? Number(qRaw) : 1);
    fd.set("quantite", String(qte)); // le back lira Number(quantite)

    // --- titre/description (compat back) ---
    const titre = designation || (matiere ? `Article (${matiere})` : "Article");
    let description = descLibre;
    if (!description) {
      const parts = [];
      if (dimensions) parts.push(`Dimensions : ${dimensions}`);
      if (exigences)  parts.push(`Exigences : ${exigences}`);
      if (remarques)  parts.push(`Remarques : ${remarques}`);
      description = parts.join("\n");
    }
    fd.set("titre", titre);
    fd.set("description", description);

    // --- S'assure que ces champs existent clairement dans le corps ---
    fd.set("designation", designation);
    fd.set("dimensions", dimensions);
    fd.set("matiere", matiere);
    fd.set("exigences", exigences);
    fd.set("remarques", remarques);

    // --- normalisation EN -> FR de "matiere" (aucun impact UI) ---
    normalizeMatiere(fd);

    // (inutile d'envoyer l'user; le back lit req.user)
    const res = await fetch("/api/devis/autre", {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    let payload = null;
    try { payload = await res.json(); } catch {}

    if (res.ok) {
      finishedRef.current = true;
      setErr("");
      setOk(t.has("sendSuccess") ? t("sendSuccess") : "Demande envoyée. Merci !");
      form.reset();
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const msg = payload?.message || `Erreur lors de l’envoi. (HTTP ${res.status})`;
    setErr(msg);
  } catch (e) {
    console.error("submit autre error:", e);
    if (!finishedRef.current) setErr("Erreur réseau.");
  } finally {
    setLoading(false);
  }
};


  const disabled = loading || !user?.authenticated || user?.role !== "client";

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#002147]">
          {t("title")}
        </h2>
      </div>

      <form onSubmit={onSubmit}>
        {/* Champs principaux */}
        <SectionTitle>{t("mainInfo")}</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Input name="designation" label={t("designation")} required />
          <Input name="dimensions" label={t("dimensions")} />
          <Input name="quantite" label={t("quantity")} type="number" min="1" required />
          <SelectBase
            name="matiere"
            label={t("material")}
            options={matOptions}
            placeholder={selectPlaceholder}
            required
          />
        </div>

        {/* Description libre */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 mt-6">
          <TextArea name="description" label={t("description")} />
        </div>

        {/* Fichiers */}
        <SectionTitle className="mt-8">{t("docs")} <RequiredMark /></SectionTitle>
        <p className="text-sm text-gray-500 mb-3">
          {t("acceptedTypes")}
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
              {t("dropHere")}
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

        {/* Textes libres complémentaires */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 mt-6">
          <TextArea name="exigences" label={t("specialReq")} />
          <TextArea name="remarques" label={t("otherRemarks")} />
        </div>

        {/* Submit + alertes */}
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
              ? t("sending")
              : !user?.authenticated
                ? t("loginToSend")
                : user?.role !== "client"
                  ? t("loginToSend")
                  : t("sendRequest")}
          </button>

          <div ref={alertRef} aria-live="polite" className="mt-3">
            {loading ? (
              <Alert type="info" message={t("sending")} />
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
          {label}{required && <RequiredMark />}
        </label>
      )}
      <input
        name={name}
        type={type}
        min={min}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5
                   text-[#002147] placeholder:text-gray-400
                   focus:outline-none focus:ring-2 focus:ring-[#002147]/30 focus:border-[#002147]" />
    </div>
  );
}
function SelectBase({ label, name, options = [], required, placeholder }) {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="block font-medium text-[#002147]">
          {label}{required && <RequiredMark />}
        </label>
      )}
      <select
        name={name}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white
                   text-[#002147] text-[15px] font-medium
                   focus:outline-none focus:ring-2 focus:ring-[#002147]/30 focus:border-[#002147] pr-10"
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23002147' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.875rem center",
          backgroundSize: "1rem 1rem",
        }}
      >
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
                   focus:outline-none focus:ring-2 focus:ring-[#002147]/30 focus:border-[#002147]" />
    </div>
  );
}

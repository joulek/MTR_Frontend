"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const API = `${BACKEND}/api`;

// ترجّع نص بالفرنسي أو الانجليزي حسب المتوفر
const pick = (obj, frKey, enKey, locale = "fr") =>
  (locale?.startsWith("en") ? obj?.[enKey] : obj?.[frKey]) ||
  obj?.[frKey] || obj?.[enKey] || "";

export default function ProductDetailPage() {
  const { locale, slug, productId } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // نحاول أولا /produits/:id وإذا ما لقاهاش نجرّب /products/:id
        let res = await fetch(`${API}/produits/${productId}`, { cache: "no-store" });
        if (!res.ok) {
          const res2 = await fetch(`${API}/products/${productId}`, { cache: "no-store" });
          if (!res2.ok) throw new Error(`HTTP ${res.status} / ${res2.status}`);
          res = res2;
        }
        const data = await res.json();
        if (!alive) return;
        setProduct(data);
      } catch (e) {
        if (alive) setErr("Impossible de charger ce produit.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [productId]);

  const name = product ? pick(product, "name_fr", "name_en", locale) : "";
  const desc = product ? pick(product, "description_fr", "description_en", locale) : "";
  const images = Array.isArray(product?.images) ? product.images : [];

  const toUrl = (src) => (src?.startsWith("http") ? src : `${BACKEND}${src?.startsWith("/") ? "" : "/"}${src || ""}`);

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-20">
          {/* Fil d’Ariane */}
          <nav className="text-sm text-slate-500 mb-6">
            <button onClick={() => router.push(`/${locale}`)} className="hover:underline">Accueil</button>
            <span className="mx-2">/</span>
            <button onClick={() => router.push(`/${locale}/produits/${slug}`)} className="hover:underline capitalize">
              {slug?.replace(/-/g, " ")}
            </button>
            <span className="mx-2">/</span>
            <span className="text-slate-700 font-semibold">{name || "Produit"}</span>
          </nav>

          {loading && <div className="h-80 rounded-2xl bg-slate-200 animate-pulse" />}

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</div>
          )}

          {!loading && !err && product && (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Galerie */}
              <section>
                <div className="relative h-[480px] rounded-2xl overflow-hidden bg-white shadow ring-1 ring-slate-200">
                  <Image
                    key={activeIdx}
                    src={toUrl(images[activeIdx] || "/placeholder.png")}
                    alt={name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                {images.length > 1 && (
                  <div className="mt-4 grid grid-cols-5 gap-3">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIdx(i)}
                        className={`relative h-24 rounded-lg overflow-hidden ring-2 transition
                          ${i === activeIdx ? "ring-[#F5B301]" : "ring-transparent hover:ring-slate-300"}`}
                        aria-label={`Image ${i + 1}`}
                      >
                        <Image
                          src={toUrl(src)}
                          alt={`${name} - ${i + 1}`}
                          fill
                          sizes="(max-width: 1024px) 20vw, 10vw"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Infos */}
              <section>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#0B2239]">{name}</h1>
                <div className="mt-3 h-1 w-20 rounded-full bg-[#F5B301]" />
                {desc && <p className="mt-5 text-slate-700 leading-relaxed">{desc}</p>}

                <div className="mt-8">
                  <a
                    href={`/${locale}/devis`}
                    className="inline-block rounded-lg bg-[#F5B301] px-5 py-3 font-semibold text-[#0B2239] shadow hover:brightness-95"
                  >
                    Demander un devis
                  </a>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

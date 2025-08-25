// app/api/login/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND =
  (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mtr-backend-fbq8.onrender.com")
    .replace(/\/$/, "");

export async function POST(request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe: remember }),
      // credentials n'a aucun effet côté serveur ; on relaie Set-Cookie ci-dessous
    });

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { message: text || "Réponse non JSON du backend" }; }

    // On renvoie le même statut/JSON
    const out = NextResponse.json(data, { status: res.status });

    // 🔁 RELAIS des cookies du backend -> navigateur
    // Certains runtimes concatènent les Set-Cookie ; on découpe proprement
    const sc = res.headers.get("set-cookie");
    if (sc) {
      const parts = sc.split(/,(?=[^;]+=[^;]+)/g); // découpe sans casser "Expires=..."
      for (const p of parts) out.headers.append("set-cookie", p);
    }

    return out;
  } catch (err) {
    console.error("Erreur /api/login:", err);
    return NextResponse.json(
      { message: "Erreur serveur interne (proxy login)" },
      { status: 500 }
    );
  }
}

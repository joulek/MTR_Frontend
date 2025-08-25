// app/api/login/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://mtr-backend-fbq8.onrender.com"
).replace(/\/$/, "");

export async function POST(request) {
  // 1) Lire le body JSON proprement
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body JSON invalide" }, { status: 400 });
  }

  // 2) Appeler le backend et capturer les erreurs réseau
  let res;
  try {
    res = await fetch(`${BACKEND}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return NextResponse.json(
      { message: "Backend unreachable", error: String(e) },
      { status: 502 }
    );
  }

  // 3) Renvoyer exactement le JSON (ou le texte brut si non-JSON)
  const raw = await res.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { data = { raw }; }

  const out = NextResponse.json(data, { status: res.status });

  // 4) RELAYER les Set-Cookie du backend → navigateur
  const sc = res.headers.get("set-cookie");
  if (sc) {
    // découpe sans casser Expires=..., puis ré-appends chaque cookie
    for (const line of sc.split(/,(?=[^;]+=[^;]+)/g)) {
      out.headers.append("set-cookie", line);
    }
  }

  return out;
}

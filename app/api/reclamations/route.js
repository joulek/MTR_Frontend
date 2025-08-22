// app/api/reclamations/route.js
import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * POST /api/reclamations
 * Proxy JSON → BACKEND /api/reclamations
 * (ton formulaire envoie du JSON: { user, commande, nature, attente, description, piecesJointes[]... })
 */
export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const payload = await request.json();

    const res = await fetch(`${BACKEND}/api/reclamations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("proxy /api/reclamations POST:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur (proxy réclamations POST)" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reclamations?page=1&pageSize=10&q=...
 * Récupère la liste (du user courant si le backend filtre par token).
 */
export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    const url = new URL(request.url);
    const qs = url.search; // conserve ?page=...&q=...

    const res = await fetch(`${BACKEND}/api/reclamations${qs}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });

    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("proxy /api/reclamations GET:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur (proxy réclamations GET)" },
      { status: 500 }
    );
  }
}

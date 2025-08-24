import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Normalise l'URL backend (supprime le '/' final)
const RAW_BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://mtr-backend-fbq8.onrender.com";
const BACKEND = RAW_BACKEND.replace(/\/$/, "");

export async function POST(req: NextRequest) {
  // Récupération body
  const body = await req.json().catch(() => ({}));

  // ✅ cookies() peut être asynchrone → on l’attend
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";

  // En-têtes vers le backend
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Appel au backend
  const upstream = await fetch(`${BACKEND}/api/order/client/commander`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  // Pass-through de la réponse backend (sans tout reparser)
  const resHeaders: Record<string, string> = {};
  const ct = upstream.headers.get("content-type");
  if (ct) resHeaders["content-type"] = ct;

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

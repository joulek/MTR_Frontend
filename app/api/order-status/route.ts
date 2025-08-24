import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Normalise l'URL backend
const RAW_BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://mtr-backend-fbq8.onrender.com";
const BACKEND = RAW_BACKEND.replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids") || "";

  // ✅ cookies() peut être asynchrone selon l’ENV
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const upstream = await fetch(
      `${BACKEND}/api/order/client/status?ids=${encodeURIComponent(ids)}`,
      { headers, cache: "no-store" }
    );

    const resHeaders: Record<string, string> = {};
    const ct = upstream.headers.get("content-type");
    if (ct) resHeaders["content-type"] = ct;

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Proxy error" },
      { status: 502 }
    );
  }
}

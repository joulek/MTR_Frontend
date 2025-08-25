// app/api/me/route.js
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mtr-backend-fbq8.onrender.com").replace(/\/$/,"");

export async function GET() {
  const cookieHeader = cookies().toString();
  const auth = headers().get("authorization") || "";
  const res = await fetch(`${BACKEND}/api/users/me`, {
    method: "GET",
    cache: "no-store",
    headers: { cookie: cookieHeader, authorization: auth }
  });
  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : {};
  return NextResponse.json(data, { status: res.status });
}

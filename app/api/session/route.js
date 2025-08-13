// app/api/session/route.js
import { NextResponse } from "next/server";

export async function GET(request) {          // <-- ajouter request
  const token = request.cookies.get("token")?.value || "";
  const role  = request.cookies.get("role")?.value || "";
  return NextResponse.json({ authenticated: !!token, role });
}

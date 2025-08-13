// app/api/logout/route.js
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Déconnexion réussie"
  });

  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // <-- identique à login
    path: "/",
    expires: new Date(0) // date expirée
  };

  // Supprimer token et role
  response.cookies.set("token", "", COOKIE_OPTIONS);
  response.cookies.set("role", "", COOKIE_OPTIONS);

  return response;
}
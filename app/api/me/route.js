// app/api/me/route.js
import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:4000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include" // important pour envoyer les cookies
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
}

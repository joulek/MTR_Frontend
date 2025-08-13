// app/api/devis/compression/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Veuillez vous connecter pour envoyer une demande." },
      { status: 401 }
    );
  }

  // const form = await request.formData(); // si multipart
  // ... envoyer au backend ou traiter

  return NextResponse.json({ success: true, message: "Demande compression envoyée." });
}

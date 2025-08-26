import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerClient } from "@/src/lib/supabaseServer"; // Asegúrate que la ruta sea correcta

// Es una buena práctica tener el redirect URI en una variable de entorno
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/oauth/callback/google-drive";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export async function GET(req: NextRequest) {
  // --- Inicia la lógica de validación de Supabase ---
  const supabase = createServerClient();

  const { searchParams } = new URL(req.url);
  const userIdFromQuery = searchParams.get('userId');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'No autorizado: sesión inválida' }, { status: 401 });
  }

  if (!userIdFromQuery) {
    return NextResponse.json({ error: 'Falta el parámetro userId' }, { status: 400 });
  }

  if (user.id !== userIdFromQuery) {
    console.warn(`Intento no autorizado: El ID de la sesión (${user.id}) no coincide con el ID de la consulta (${userIdFromQuery}).`);
    return NextResponse.json({ error: 'Conflicto de identidad de usuario' }, { status: 403 });
  }

  // Si la validación es exitosa, se procede a generar la URL de Google
  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    // ✅ Se pasa el userId validado en el parámetro 'state'
    state: userIdFromQuery, 
  });

  return NextResponse.redirect(url);
}
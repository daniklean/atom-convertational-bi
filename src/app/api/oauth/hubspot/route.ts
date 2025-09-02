import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabaseServer";

export async function GET(req: NextRequest) {
  // ✅ Cliente de Supabase (para validar la sesión)
  const supabase = createServerClient();

  const { searchParams } = new URL(req.url);
  const userIdFromQuery = searchParams.get("userId");

  // Verificación de sesión
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { error: "No autorizado: sesión inválida" },
      { status: 401 }
    );
  }

  if (!userIdFromQuery) {
    return NextResponse.json(
      { error: "Falta el parámetro userId" },
      { status: 400 }
    );
  }

  // Validación extra de seguridad
  if (user.id !== userIdFromQuery) {
    console.warn(
      `Intento no autorizado: sessionId (${user.id}) ≠ queryId (${userIdFromQuery})`
    );
    return NextResponse.json(
      { error: "Conflicto de identidad de usuario" },
      { status: 403 }
    );
  }

  // 🔑 Construcción de la URL de autorización para HubSpot
  const hubspotAuthUrl = `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    process.env.HUBSPOT_REDIRECT_URI!
  )}&scope=crm.schemas.deals.read%20oauth%20crm.objects.owners.read%20crm.objects.deals.read%20crm.objects.contacts.read&state=${userIdFromQuery}`;

  // Redirige al usuario a HubSpot para el login/consent
  return NextResponse.redirect(hubspotAuthUrl);
}

import { NextRequest, NextResponse } from "next/server";
// Importa la FUNCIÓN que acabas de crear
import { createServerClient } from "@/src/lib/supabaseServer";

export async function GET(req: NextRequest) {
  // ✅ Llama a la función para crear el cliente AQUÍ, dentro de la petición
  const supabase = createServerClient();

  const { searchParams } = new URL(req.url);
  const userIdFromQuery = searchParams.get('userId');
  
  // Usa getUser() para mayor seguridad, como te recomendó el log de Supabase
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'No autorizado: sesión inválida' }, { status: 401 });
  }

  if (!userIdFromQuery) {
    return NextResponse.json({ error: 'Falta el parámetro userId' }, { status: 400 });
  }

  // VALIDACIÓN DE SEGURIDAD
  if (user.id !== userIdFromQuery) {
    console.warn(`Intento no autorizado: El ID de la sesión (${user.id}) no coincide con el ID de la consulta (${userIdFromQuery}).`);
    return NextResponse.json({ error: 'Conflicto de identidad de usuario' }, { status: 403 });
  }

  // Si la validación pasa, se construye la URL y se redirige.
  const authorizationUrl = `${process.env.SALESFORCE_AUTH_URL}?response_type=code&client_id=${process.env.SALESFORCE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.SALESFORCE_REDIRECT_URI!)}&scope=full refresh_token&state=${userIdFromQuery}`;
  
  return NextResponse.redirect(authorizationUrl);
}
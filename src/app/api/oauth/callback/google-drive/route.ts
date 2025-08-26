import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerClient } from "@/src/lib/supabaseServer";

const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/oauth/callback/google-drive";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); 

    if (!code || !state) {
      return NextResponse.json({ error: "Missing required parameters: code or state" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || user.id !== state) {
      return NextResponse.json({ error: "Unauthorized or invalid state" }, { status: 403 });
    }
    const userId = user.id;
    
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token } = tokens;

    if (!access_token) {
        throw new Error("Failed to retrieve access token from Google.");
    }


    
    //3️⃣ Enviar a tu webhook de n8n (opcional, si lo necesitas para Google)
    //const username = 'atom';
    //const password = '1234';
    //const encodedCredentials = btoa(`${username}:${password}`);

    //await fetch("https://daniklean.tech/admin/n8n/webhook/integrations", {
       //method: "POST",
       //headers: {
          //"Content-Type": "application/json",
          //"Authorization": `Basic ${encodedCredentials}`
        //},
       //body: JSON.stringify({
         //type: "google-drive",
         //access_token,
         ///refresh_token,
       //}),
     //});

    // 4️⃣ Guardar los tokens en la tabla 'user_tokens' de Supabase
    // Usamos el cliente del servidor que ya tiene la sesión del usuario
    //const { error: insertError } = await supabase.from("user_tokens").insert({
      //user_id: userId,
      //access_token: access_token,
      //refresh_token: refresh_token || null, // refresh_token puede ser nulo en algunos flujos
      //integration_type: "google-drive",
    //});

    //if (insertError) {
      //console.error("Error saving Google tokens to Supabase:", insertError);
      //throw insertError; // Lanza el error para que sea capturado por el catch
    //}
    
    // 5️⃣ Redirigir al usuario a la página de éxito
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/chat?provider=google-drive&status=success`
    );

    response.cookies.set("google_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60, // 1h
    });

    if (refresh_token) {
      response.cookies.set("google_refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 días
      });
    }

    return response;

  } catch (err: any) {
    console.error("Google OAuth Callback Error:", err);
    // Redirigir a una página de error
    return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/chat?provider=google-drive&status=error`
      );
  }
}
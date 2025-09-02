import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/src/lib/supabaseServer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // 1️⃣ Intercambio de code por tokens en HubSpot
    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Error from HubSpot:", tokenData);
      return NextResponse.json({ error: tokenData }, { status: 400 });
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const integration_type = "hubspot";
    const username = process.env.NEXT_PUBLIC_USERNAME!;
    const password = process.env.NEXT_PUBLIC_PASSWORD!;
    const encodedCredentials = btoa(`${username}:${password}`);

    // 2️⃣ Enviar a tu webhook de n8n
    await fetch("https://daniklean.tech/admin/n8n/webhook/integrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify({
        type: "hubspot",
        access_token,
      }),
    });

    // 3️⃣ Guardar en Supabase (tabla `hubspot_tokens`)
    // create table hubspot_tokens (
    //   id uuid default gen_random_uuid() primary key,
    //   user_id uuid references auth.users(id),
    //   access_token text not null,
    //   refresh_token text not null,
    //   created_at timestamptz default now()
    // );

    // const { error } = await supabase.from("hubspot_tokens").insert({
    //   access_token,
    //   refresh_token,
    //   integration_type,
    //   user_id: user?.id || null,
    // });

    // if (error) {
    //   console.error("Error saving HubSpot tokens to Supabase:", error);
    // }

    console.log(`HubSpot access_token: ${access_token}`);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/chat/?provider=hubspot&status=success`
    );
  } catch (err: any) {
    console.error("HubSpot OAuth Callback Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

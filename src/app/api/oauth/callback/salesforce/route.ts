import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // 1️⃣ Intercambio de code por tokens en Salesforce
    const tokenRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.SALESFORCE_CLIENT_ID!,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
        redirect_uri: process.env.SALESFORCE_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Error from Salesforce:", tokenData);
      return NextResponse.json({ error: tokenData }, { status: 400 });
    }

    const { access_token, refresh_token, instance_url, id } = tokenData;
    const username = 'atom';
    const password = '1234';
    const encodedCredentials = btoa(`${username}:${password}`);

    // 2️⃣ Enviar a tu webhook de n8n
    await fetch("https://daniklean.tech/admin/n8n/webhook/integrations", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
        "Authorization": `Basic ${encodedCredentials}`
      },
      body: JSON.stringify({
        type: "salesforce",
        instance_url,
        access_token,
      }),
    });

    // 3️⃣ Guardar en Supabase (tabla `salesforce_tokens`)
    // ⚠️ Debes crear la tabla en supabase:
    // create table salesforce_tokens (
    //   id uuid default gen_random_uuid() primary key,
    //   user_id uuid references auth.users(id),
    //   access_token text not null,
    //   refresh_token text not null,
    //   instance_url text not null,
    //   created_at timestamptz default now()
    // );

    //const getUserByEmail = await supabase.from("user").select()

    //const { error } = await supabase.from("user_tokens").insert({
      //user_id:  || null,
      //access_token,
      //refresh_token,
      //instance_url,
    //});

    //if (error) {
      //console.error("Error saving to Supabase:", error);
    //}

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/chat/?provider=salesforce&status=success`
    );
  } catch (err: any) {
    console.error("OAuth Callback Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

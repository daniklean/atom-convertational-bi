// app/api/google-drive/send/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { createServerClient } from "@/src/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔑 Leer cookies del request
  const cookieStore = cookies();
  const accessToken = cookieStore.get("google_access_token")?.value;
  const { fileId } = await req.json();

  if (!accessToken || !fileId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // ✅ Crear cliente OAuth2
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({
    version: "v3",
    auth: oauth2Client,
  });

  try {
    // 1️⃣ Obtener metadata del archivo
    const metadata = await drive.files.get({
      fileId,
      fields: "id, name, mimeType",
    });

    const mimeType = metadata.data.mimeType || "";
    const fileName = metadata.data.name || "file";

    let response;
    let fileBuffer: Buffer;
    let exportMime = mimeType;

    // 2️⃣ Exportar si es Google Docs Editors
    if (mimeType.startsWith("application/vnd.google-apps")) {
      if (mimeType === "application/vnd.google-apps.document") {
        exportMime =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
        exportMime =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (mimeType === "application/vnd.google-apps.presentation") {
        exportMime =
          "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      } else {
        exportMime = "application/pdf"; // fallback
      }

      response = await drive.files.export(
        { fileId, mimeType: exportMime },
        { responseType: "arraybuffer" }
      );

      fileBuffer = Buffer.from(response.data as ArrayBuffer);
    } else {
      // 3️⃣ Archivos binarios normales
      response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );

      fileBuffer = Buffer.from(response.data as ArrayBuffer);
    }

    // 4️⃣ Convertir el buffer a base64
    const base64File = fileBuffer.toString("base64");

    // 5️⃣ Armar payload en formato JSON plano
    const payload = {
      data: base64File,
      fileName,
      mimeType: exportMime,
      fileId,
      type: "google-drive",
    };

    // 6️⃣ Enviar a n8n
    const username = "atom";
    const password = "1234";
    const encodedCredentials = Buffer.from(
      `${username}:${password}`
    ).toString("base64");

    const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: "Failed to send to n8n" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: fileName,
      mimeType: exportMime,
    });
  } catch (err: any) {
    console.error("Google Drive error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: "Google Drive request failed" },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const accessToken = cookies().get("google_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No Google access token found" },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // ✅ Filtrar solo pdf, docx, xlsx y csv
    const mimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      //"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    const query = mimeTypes.map((type) => `mimeType='${type}'`).join(" or ");

    const { data } = await drive.files.list({
      pageSize: 30,
      fields: "files(id, name, mimeType, webViewLink)",
      q: query,
    });

    return NextResponse.json(data.files || []);
  } catch (err: any) {
    console.error("Error fetching Google Drive files:", err);
    return NextResponse.json(
      { error: "Failed to fetch Google Drive files" },
      { status: 500 }
    );
  }
}

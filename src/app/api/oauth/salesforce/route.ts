import { NextResponse } from "next/server";

export async function GET() {
  const authorizationUrl = `${process.env.SALESFORCE_AUTH_URL}?response_type=code&client_id=${process.env.SALESFORCE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.SALESFORCE_REDIRECT_URI!)}&scope=full refresh_token`;

  return NextResponse.redirect(authorizationUrl);
}

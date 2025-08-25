import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

export async function POST(req: NextRequest) {
  try {
    const { id, email } = await req.json()

    if (!id || !email) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 })
    }

    // 🚀 Guarda o actualiza en tabla `users`
    const { error } = await supabase
      .from("users")
      .upsert({ id, email }, { onConflict: "id" })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Sync user error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

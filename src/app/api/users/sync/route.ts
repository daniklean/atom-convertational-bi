import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// ✅ Corrección: Añade las opciones de auth para el entorno de servidor
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
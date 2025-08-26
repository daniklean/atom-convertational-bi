import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { env } from "process"

export const supabase = createClientComponentClient({
  supabaseUrl: env.SUPABASE_URL,
  supabaseKey: env.SUPABASE_SERVICE_ROLE_KE,
});
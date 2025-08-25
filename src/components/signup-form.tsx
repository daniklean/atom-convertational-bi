"use client"

import { Auth } from "@supabase/auth-ui-react"
import { en, ThemeSupa } from "@supabase/auth-ui-shared"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/src/lib/store"
import { supabase } from "@/src/lib/supabaseClient"

export function SignupForm() {
    
  const router = useRouter()
  const setUser = useUserStore((state) => state.setUser)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { id, email } = session.user
        setUser({ id, email: email || "" })
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, email }),
        })

        router.replace("/chat")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-orange-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="2" />
                <circle cx="8" cy="16" r="2" />
                <circle cx="16" cy="16" r="2" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a ATOM</h1>
          <p className="text-gray-600">Ingresa tu email para comenzar</p>
        </div>

        {/* Componente de Supabase Auth */}
        <Auth
          supabaseClient={supabase}
          providers={[]} 
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "rgb(249, 115, 22)", 
                  brandAccent: "rgb(220, 38, 38)", 
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                email_input_placeholder: "usuario@empresa.com",
                button_label: "Continuar",
              },
              magic_link: {
                button_label: "Enviar enlace mágico",
              },
            },
          }}
        />
      </div>
    </div>
  )
}

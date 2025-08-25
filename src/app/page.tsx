"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/src/lib/store"

export default function Home() {
  const router = useRouter()
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/chat")
    } else {
      router.replace("/signup")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

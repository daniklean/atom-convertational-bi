"use client"

import { ChatInterface } from "@/components/chat-interface"
import { SignupForm } from "@/components/signup-form"
import { useUserStore } from "@/lib/store"

export default function Home() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <SignupForm />
  }

  return <ChatInterface />
}

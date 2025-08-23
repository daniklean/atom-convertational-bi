"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Settings,
  BarChart3,
  FileText,
  Download,
  Share2,
  Copy,
  Paperclip,
  ImageIcon,
  File,
  X,
  User,
  Bot,
  LogOut,
} from "lucide-react"
import { IntegrationsModal } from "@/components/integrations-modal"
import { useUserStore } from "@/lib/store"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: Attachment[]
  dashboardData?: DashboardData
}

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

interface DashboardData {
  title: string
  metrics: Array<{
    label: string
    value: string
    change?: string
    source?: string
  }>
  charts?: Array<{
    type: "line" | "pie" | "bar"
    title: string
    data: any
  }>
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "¡Hola! Soy tu asistente de análisis de datos. Puedo ayudarte a generar dashboards y análisis a partir de tus datos. ¿En qué te gustaría que te ayude hoy?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showIntegrations, setShowIntegrations] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, logout } = useUserStore()
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachments([])
    setIsLoading(true)

    // Simulate AI response with dashboard data
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "He analizado tus datos y he generado un dashboard con los insights principales. Aquí tienes un resumen de las métricas más importantes:",
        timestamp: new Date(),
        dashboardData: {
          title: "Análisis de Ventas Q1 2025",
          metrics: [
            { label: "Ventas Totales Q1", value: "$1.45M", change: "+15%", source: "SAP" },
            { label: "Nuevos Clientes", value: "237", source: "Salesforce" },
            { label: "Ticket Promedio", value: "$345", source: "SAP" },
            { label: "Crecimiento vs Q1 2024", value: "+15%", source: "SAP" },
          ],
        },
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 2000)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      }
      setAttachments((prev) => [...prev, attachment])
    })
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleLogout = () => {
    logout()
    router.push("/signup")
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-atom flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg font-montserrat">A</span>
            </div>
            <div>
              <h1 className="font-montserrat font-bold text-xl text-foreground">ATOM Analytics</h1>
              <p className="text-sm text-muted-foreground font-inter">Chat Conversacional</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                <User className="h-4 w-4" />
                <span className="font-medium">{user.email}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIntegrations(true)}
              className="gap-2 border-atom text-atom-primary hover:bg-atom-light hover:border-atom"
            >
              <Settings className="h-4 w-4" />
              Integraciones
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-background to-muted/20">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type === "assistant" && (
              <div className="w-10 h-10 rounded-full gradient-atom flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}

            <div className={`max-w-[75%] ${message.type === "user" ? "order-first" : ""}`}>
              <Card
                className={`shadow-md border-0 ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-inter">{message.content}</p>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 text-xs opacity-80">
                          {getFileIcon(attachment.type)}
                          <span>{attachment.name}</span>
                          <span>({formatFileSize(attachment.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.dashboardData && (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-atom-primary" />
                        <span className="font-semibold text-base font-montserrat">{message.dashboardData.title}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {message.dashboardData.metrics.map((metric, index) => (
                          <div key={index} className="bg-muted/50 rounded-lg p-3 border border-border">
                            <div className="text-xs text-muted-foreground font-medium mb-1">{metric.label}</div>
                            <div className="font-bold text-lg text-foreground font-montserrat">{metric.value}</div>
                            {metric.change && <div className="text-xs text-green-600 font-medium">{metric.change}</div>}
                            {metric.source && (
                              <Badge variant="outline" className="text-xs mt-2 border-atom text-atom-primary">
                                {metric.source}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs hover:bg-atom-light hover:border-atom hover:text-atom-primary bg-transparent"
                        >
                          <FileText className="h-3 w-3" />
                          Ver datos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs hover:bg-atom-light hover:border-atom hover:text-atom-primary bg-transparent"
                        >
                          <BarChart3 className="h-3 w-3" />
                          Ver dashboard
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs hover:bg-atom-light hover:border-atom hover:text-atom-primary bg-transparent"
                        >
                          <Download className="h-3 w-3" />
                          Descargar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs hover:bg-atom-light hover:border-atom hover:text-atom-primary bg-transparent"
                        >
                          <Share2 className="h-3 w-3" />
                          Compartir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs hover:bg-atom-light hover:border-atom hover:text-atom-primary bg-transparent"
                        >
                          <Copy className="h-3 w-3" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground mt-2 px-2 font-inter">
                {message.timestamp.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {message.type === "user" && (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-10 h-10 rounded-full gradient-atom flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <Card className="bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Analizando datos...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4 shadow-lg">
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-2 bg-muted rounded-md px-2 py-1">
                {getFileIcon(attachment.type)}
                <span className="text-xs">{attachment.name}</span>
                <span className="text-xs text-muted-foreground">({formatFileSize(attachment.size)})</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAttachment(attachment.id)}
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta sobre datos aquí..."
              className="min-h-[60px] resize-none pr-12 border-border focus:border-atom focus:ring-atom/20 font-inter"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-2 bottom-2 h-8 w-8 p-0 hover:bg-atom-light hover:text-atom-primary"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="gradient-atom hover:opacity-90 h-[60px] px-6 shadow-lg font-medium"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <IntegrationsModal open={showIntegrations} onOpenChange={setShowIntegrations} />
    </div>
  )
}

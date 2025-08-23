"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Send,
  BarChart3,
  Database,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  Settings,
  Paperclip,
  ImageIcon,
  FileText,
  Download,
  Share2,
  Copy,
  Check,
  LogOut,
  User,
} from "lucide-react"
import { IntegrationsModal } from "./integrations-modal"
import { useUserStore } from "@/lib/store"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  dashboardData?: DashboardData
  attachments?: Attachment[]
  isTyping?: boolean
}

interface Attachment {
  id: string
  name: string
  type: "image" | "file"
  url: string
  size?: number
}

interface DashboardData {
  title: string
  metrics: Array<{
    label: string
    value: string
    change?: string
    icon: React.ReactNode
  }>
  hasChart: boolean
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "¡Hola! Soy tu asistente de análisis de datos. Puedo ayudarte a generar dashboards y análisis a partir de tus consultas. También puedes compartir archivos e imágenes para un análisis más detallado. ¿Qué te gustaría analizar hoy?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [integrationsOpen, setIntegrationsOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useUserStore()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() && attachments.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setAttachments([])
    setIsTyping(true)

    // Simulate AI typing delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          attachments.length > 0
            ? "He analizado los archivos adjuntos junto con tu consulta. Basándome en los datos proporcionados, he generado el siguiente análisis comparativo entre Q1 2024 y Q1 2025. Se observa un incremento del 15% en ventas totales, aunque la categoría de productos electrónicos ha experimentado una ligera caída del 3%."
            : "He añadido información comparativa entre Q1 2024 y Q1 2025. Se observa un incremento del 15% en ventas totales, aunque la categoría de productos electrónicos ha experimentado una ligera caída del 3%. Por otro lado, las categorías de muebles (+19%), ropa (+25%) y otros productos (+34%) han tenido un crecimiento significativo.",
        timestamp: new Date(),
        dashboardData: {
          title: "Análisis de ventas Q1 2025",
          metrics: [
            {
              label: "Ventas Totales Q1",
              value: "$1.45M",
              change: "+15%",
              icon: <DollarSign className="h-4 w-4" />,
            },
            {
              label: "Crecimiento vs Q1 2024",
              value: "+15%",
              icon: <TrendingUp className="h-4 w-4" />,
            },
            {
              label: "Nuevos Clientes",
              value: "237",
              icon: <Users className="h-4 w-4" />,
            },
            {
              label: "Ticket Promedio",
              value: "$345",
              icon: <DollarSign className="h-4 w-4" />,
            },
          ],
          hasChart: true,
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
      setTimeout(scrollToBottom, 100)
    }, 2000)
  }, [inputValue, attachments, scrollToBottom])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "file",
        url: URL.createObjectURL(file),
        size: file.size,
      }
      setAttachments((prev) => [...prev, attachment])
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleShareMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (!message) return

      const shareData = {
        title: "ATOM Analytics - Análisis",
        text: message.content,
        url: window.location.href + `?message=${messageId}`,
      }

      if (navigator.share) {
        try {
          await navigator.share(shareData)
        } catch (err) {
          console.log("Error sharing:", err)
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
      }
    },
    [messages],
  )

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8">
              <img src="/atom-logo.svg" alt="ATOM" className="w-full h-full" />
            </div>
            <div>
              <h1 className="font-montserrat font-bold text-xl text-foreground">ATOM Analytics</h1>
              <p className="text-sm text-muted-foreground">Chat Conversacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIntegrationsOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Integraciones
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              {message.type === "assistant" && (
                <Avatar className="w-8 h-8 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-2xl ${message.type === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.type === "user" ? "bg-muted text-foreground ml-auto" : "bg-card border text-card-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          {attachment.type === "image" ? (
                            <ImageIcon className="w-4 h-4 text-primary" />
                          ) : (
                            <FileText className="w-4 h-4 text-primary" />
                          )}
                          <span className="text-xs font-medium">{attachment.name}</span>
                          {attachment.size && (
                            <span className="text-xs text-muted-foreground">({formatFileSize(attachment.size)})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyMessage(message.id, message.content)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleShareMessage(message.id)}
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Dashboard Card */}
                {message.dashboardData && (
                  <Card className="mt-4 border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-montserrat font-semibold">
                          {message.dashboardData.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-accent text-accent-foreground">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Dashboard
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {message.dashboardData.metrics.map((metric, index) => (
                          <div key={index} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-primary">{metric.icon}</div>
                              <span className="text-xs text-muted-foreground">{metric.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-montserrat font-bold text-lg">{metric.value}</span>
                              {metric.change && (
                                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                  {metric.change}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <Database className="w-4 h-4 mr-2" />
                          Ver datos
                        </Button>
                        <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {message.type === "user" && (
                <Avatar className="w-8 h-8 bg-secondary">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                    TU
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">AI</AvatarFallback>
              </Avatar>
              <div className="bg-card border rounded-lg px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">Analizando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                  {attachment.type === "image" ? (
                    <ImageIcon className="w-4 h-4 text-primary" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-sm font-medium">{attachment.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="px-3">
              <Paperclip className="w-4 h-4" />
            </Button>

            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu consulta sobre datos o análisis... También puedes adjuntar archivos."
              className="flex-1 bg-background border-border focus:border-primary resize-none min-h-[44px] max-h-32"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() && attachments.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Presiona Enter para enviar • Shift + Enter para nueva línea • Adjunta archivos para análisis más detallado
          </p>
        </div>
      </div>

      {/* Integrations Modal */}
      <IntegrationsModal open={integrationsOpen} onOpenChange={setIntegrationsOpen} />
    </div>
  )
}

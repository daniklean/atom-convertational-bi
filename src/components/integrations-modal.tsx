"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Settings } from "lucide-react"
import { useIntegrationStore } from "@/src/lib/integrationStore"
import { useUserStore } from "../lib/store"

// ---- Tipos ----
interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: string
  oauthUrl: string
}

interface FileItem {
  id: string
  name: string
  mimeType: string
  webViewLink: string
}

interface IntegrationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IntegrationsModal({ open, onOpenChange }: IntegrationsModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useUserStore().user!
  const { integrations, connectIntegration } = useIntegrationStore()

  const [showDrivePicker, setShowDrivePicker] = useState(false)
  const [driveFiles, setDriveFiles] = useState<FileItem[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  const localIntegrations: Integration[] = [
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Accede y analiza archivos almacenados en tu Google Drive para generar insights automáticos.",
      category: "Almacenamiento",
      icon: "🟡",
      oauthUrl: `/api/oauth/google-drive`,
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Conéctate a Salesforce para acceder a tus datos de CRM directamente en la app.",
      category: "CRM",
      icon: "🔵",
      oauthUrl: `/api/oauth/salesforce`,
    },
  ]

  // ✅ Cuando vuelva de OAuth callback
useEffect(() => {
  const provider = searchParams.get("provider")
  const status = searchParams.get("status")

  if (!provider || status !== "success") return

  connectIntegration(provider) // ✅ marcar cualquier provider como conectado

  if (provider === "google-drive") {
    // flujo especial para Drive
    fetchDriveFiles()
    setShowDrivePicker(true)
    onOpenChange(true)
  }

  // 🚨 importante: limpiar la URL para que no repita el efecto
  router.replace(window.location.pathname)
}, [searchParams, router, onOpenChange, connectIntegration])

  const handleConnect = (integrationId: string) => {
    const integration = localIntegrations.find((i) => i.id === integrationId)
    if (!integration) return
    const url = `${integration.oauthUrl}?userId=${encodeURIComponent(user.id)}`
    window.location.href = url
  }

  // 🔥 Fetch archivos desde API
  const fetchDriveFiles = async () => {
    setLoadingFiles(true)
    try {
      const res = await fetch("/api/oauth/google-drive/files")
      const data = await res.json()
      setDriveFiles(data || [])
    } catch (e) {
      console.error("Error fetching Drive files", e)
    } finally {
      setLoadingFiles(false)
    }
  }

  // 🔥 Cuando el usuario selecciona un archivo
  const handleSelectFile = async (file: FileItem) => {
    try {
      await fetch("/api/oauth/google-drive/send-to-n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          userId: user.id,
        }),
      })
      setShowDrivePicker(false)
      onOpenChange(false)
    } catch (err) {
      console.error("Error enviando archivo a backend:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="font-montserrat font-bold text-2xl text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-atom flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            Integraciones
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-inter leading-relaxed">
            Configura tus integraciones para realizar conexiones entre cada conversación y tus CRM de preferencia.
          </p>
        </DialogHeader>

        {showDrivePicker ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Selecciona un archivo de Google Drive</h3>
            {loadingFiles ? (
              <p className="text-sm text-muted-foreground">Cargando archivos...</p>
            ) : (
              <div className="space-y-2">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between border rounded-md px-3 py-2 hover:bg-muted/30"
                  >
                    <span className="text-sm">{file.name}</span>
                    <Button size="sm" onClick={() => handleSelectFile(file)}>
                      Seleccionar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {localIntegrations.map((integration) => {
              const isConnected = integrations.find((i) => i.id === integration.id)?.connected

              return (
                <Card
                  key={integration.id}
                  className="border-border hover:border-atom/30 transition-all duration-200 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{integration.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg font-montserrat font-semibold text-foreground">
                            {integration.name}
                          </CardTitle>
                          {isConnected && (
                            <Badge
                              variant="outline"
                              className="text-xs border-green-500 text-green-600 bg-green-50"
                            >
                              Conectado
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm text-muted-foreground font-inter">
                          {integration.category}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-6 font-inter leading-relaxed">
                      {integration.description}
                    </p>

                    <div className="flex justify-end">
                      {isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-200 text-green-600 hover:bg-green-50 bg-green-50/50 font-medium"
                          disabled
                        >
                          CONECTADO
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(integration.id)}
                          className="gradient-atom hover:opacity-90 text-white font-medium px-6"
                        >
                          CONECTAR
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

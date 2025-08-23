"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, File, Table } from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: string
  connected: boolean
  connecting?: boolean
  oauthUrl: string
  clientId?: string
}

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
}

interface IntegrationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IntegrationsModal({ open, onOpenChange }: IntegrationsModalProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Accede y analiza archivos almacenados en tu Google Drive para generar insights automáticos.",
      category: "Almacenamiento",
      icon: "🟡",
      connected: false,
      oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: "665962143391-3sjt0dn2l5243g4l37l8fnqj4gud716k.apps.googleusercontent.com",
    },
  ])

  const [showFileSelection, setShowFileSelection] = useState(false)
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const fetchGoogleDriveFiles = async (token: string) => {
    setLoadingFiles(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType='application/pdf' or mimeType='application/vnd.ms-excel' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='text/csv'&fields=files(id,name,mimeType,size,modifiedTime)`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setDriveFiles(data.files || [])
      } else {
        console.error("Error fetching files:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching Google Drive files:", error)
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleFileSelect = async (file: GoogleDriveFile) => {
    if (!accessToken) return

    setUploadingFile(true)
    try {
      // Download file from Google Drive
      const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (downloadResponse.ok) {
        const fileBlob = await downloadResponse.blob()

        // Get user email from localStorage (assuming it's stored there from signup)
        const userEmail = localStorage.getItem("userEmail") || "unknown@example.com"

        // Create FormData to send to webhook
        const formData = new FormData()
        formData.append("email", userEmail)
        formData.append("file", fileBlob, file.name)
        formData.append("fileName", file.name)
        formData.append("mimeType", file.mimeType)
        formData.append("source", "google-drive")

        // Upload to n8n webhook
        const uploadResponse = await fetch("https://daniklean.tech/admin/n8n/webhook/integrations", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          console.log("File uploaded successfully")
          // Mark Google Drive as connected
          setIntegrations((prev) =>
            prev.map((integration) =>
              integration.id === "google-drive" ? { ...integration, connected: true, connecting: false } : integration,
            ),
          )
          setShowFileSelection(false)
        } else {
          console.error("Error uploading file to webhook")
        }
      }
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setUploadingFile(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
      return <Table className="h-4 w-4 text-green-500" />
    return <File className="h-4 w-4 text-blue-500" />
  }

  const handleConnect = async (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) return

    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId ? { ...integration, connecting: true } : integration,
      ),
    )

    const redirectUri = encodeURIComponent("https://daniklean.tech/admin/n8n/rest/oauth2-credential/callback")
    const state = encodeURIComponent(JSON.stringify({ integration: integrationId, timestamp: Date.now() }))

    let oauthUrl = ""

    switch (integrationId) {
      case "google-drive":
        oauthUrl = `${integration.oauthUrl}?client_id=${integration.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&access_type=offline&state=${state}`
        break
      default:
        console.error("Unknown integration:", integrationId)
        return
    }

    const popup = window.open(
      oauthUrl,
      `oauth-${integrationId}`,
      "width=600,height=700,scrollbars=yes,resizable=yes,left=" +
        (window.screen.width / 2 - 300) +
        ",top=" +
        (window.screen.height / 2 - 350),
    )

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)

        // Simulate getting access token (in real implementation, this would come from the OAuth callback)
        // For now, we'll show the file selection interface
        if (integrationId === "google-drive") {
          // In a real implementation, you'd get the access token from the OAuth callback
          // For demo purposes, we'll simulate this
          setTimeout(() => {
            setShowFileSelection(true)
            // You would set the real access token here: setAccessToken(realToken)
            // For demo, we'll use a placeholder
            setAccessToken("demo-token")
            // fetchGoogleDriveFiles(realToken)

            // Demo files for testing
            setDriveFiles([
              {
                id: "1",
                name: "Ventas Q1 2025.xlsx",
                mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: "2.5 MB",
                modifiedTime: "2025-01-15T10:30:00Z",
              },
              {
                id: "2",
                name: "Reporte Clientes.pdf",
                mimeType: "application/pdf",
                size: "1.8 MB",
                modifiedTime: "2025-01-14T15:45:00Z",
              },
              {
                id: "3",
                name: "Datos Marketing.csv",
                mimeType: "text/csv",
                size: "850 KB",
                modifiedTime: "2025-01-13T09:20:00Z",
              },
            ])
          }, 1000)
        }

        setIntegrations((prev) =>
          prev.map((integration) =>
            integration.id === integrationId ? { ...integration, connecting: false } : integration,
          ),
        )
      }
    }, 1000)
  }

  const handleCancel = (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId ? { ...integration, connecting: false } : integration,
      ),
    )
  }

  const handleBackToIntegrations = () => {
    setShowFileSelection(false)
    setDriveFiles([])
    setAccessToken(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-montserrat font-bold text-xl">
            {showFileSelection ? "Seleccionar archivo de Google Drive" : "Integraciones"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {showFileSelection
              ? "Elige el archivo que deseas usar como fuente de datos para tus análisis."
              : "Configura tus integraciones para realizar conexiones entre cada conversación y tus CRM de preferencia."}
          </p>
        </DialogHeader>

        {showFileSelection ? (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleBackToIntegrations} disabled={uploadingFile}>
                ← Volver
              </Button>
            </div>

            {loadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando archivos...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {driveFiles.map((file) => (
                  <Card key={file.id} className="border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mimeType)}
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.size} • {new Date(file.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleFileSelect(file)}
                          disabled={uploadingFile}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {uploadingFile ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Subiendo...
                            </>
                          ) : (
                            "Seleccionar"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {driveFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron archivos compatibles (PDF, Excel, CSV)</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{integration.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base font-montserrat font-semibold">{integration.name}</CardTitle>
                        {integration.connected && (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                            Conectado
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs text-muted-foreground">
                        {integration.category}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>

                  <div className="flex justify-end">
                    {integration.connecting ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(integration.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          CANCELAR
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Conectando...
                        </div>
                      </div>
                    ) : integration.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50 bg-transparent"
                        disabled
                      >
                        CONECTADO
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(integration.id)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        CONECTAR
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAnonAadhaar, LogInWithAnonAadhaar } from "@anon-aadhaar/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, QrCode, Upload, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useFilePreview } from "@/hooks/use-file-preview"
import { ClientOnly } from "@/components/client-only"

interface AadhaarVerificationProps {
  aadhaarNumber: string
  onVerified?: (proof?: any) => void
}

export function AadhaarVerification({ aadhaarNumber, onVerified = () => {} }: AadhaarVerificationProps) {
  const [anonAadhaar] = useAnonAadhaar()
  const [isVerifying, setIsVerifying] = useState(false)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [verificationMethod, setVerificationMethod] = useState<"qr" | "manual">("qr")
  const [userName, setUserName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { previewUrl, setFile: setPreviewFile, clearPreview } = useFilePreview()

  useEffect(() => {
    // Check the verification status when the component mounts or status changes
    if (anonAadhaar.status === "logged-in") {
      setIsVerifying(false)
      // Pass the anon aadhaar state to the callback
      onVerified(anonAadhaar) 
    } else if (anonAadhaar.status === "logged-out" && isVerifying) {
      // If verification was in progress but status is logged-out, there might be an error
      setIsVerifying(false)
      toast({
        title: "Verification Issue",
        description: "There was an issue with the verification process. Please try again.",
        variant: "destructive",
      })
    }
  }, [anonAadhaar.status, onVerified, toast, isVerifying])

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setQrFile(file)

      // Update preview using the custom hook
      setPreviewFile(file)

      // Read the QR code file with error handling
      const reader = new FileReader()
      
      reader.onload = (event) => {
        if (event.target?.result) {
          toast({
            title: "QR Code uploaded",
            description: "QR code has been successfully uploaded and ready for verification",
          })
        }
      }
      
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read the uploaded file. Please try again.",
          variant: "destructive",
        })
        setQrFile(null)
        clearPreview()
      }
      
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // For test purposes, we'll simulate verification
  const handleTestVerify = async () => {
    if (!userName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name for verification",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)

    try {
      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate successful verification
      toast({
        title: "Verification successful",
        description: `Your Aadhaar has been verified for ${userName}`,
      })

      // Create a mock proof for testing
      const mockProof = {
        type: "test",
        userName: userName,
        verified: true,
        timestamp: new Date().toISOString()
      }

      onVerified(mockProof)
    } catch (error) {
      console.error("Aadhaar verification error:", error)
      toast({
        title: "Verification failed",
        description: "There was an error verifying your Aadhaar",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium">Aadhaar Verification</h3>
            {anonAadhaar.status === "logged-in" ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Pending
              </Badge>
            )}
          </div>

          {/* User Name Input */}
          <div className="space-y-2">
            <Label htmlFor="user-name">Full Name</Label>
            <Input 
              id="user-name" 
              placeholder="Enter your full name as per Aadhaar" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={anonAadhaar.status === "logged-in"}
            />
            <p className="text-xs text-muted-foreground">
              Enter your name exactly as it appears on your Aadhaar card
            </p>
          </div>

          {anonAadhaar.status !== "logged-in" && (
            <Tabs defaultValue="qr" onValueChange={(value) => setVerificationMethod(value as "qr" | "manual")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code Scanner</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 bg-muted/50">
                  <ClientOnly fallback={
                    <div className="flex flex-col items-center">
                      <QrCode className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium mb-1">Upload Aadhaar QR Code</p>
                    </div>
                  }>
                    {qrFile && previewUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-2 bg-background rounded-md flex items-center justify-center border">
                          <img
                            src={previewUrl}
                            alt="QR Code Preview"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{qrFile.name}</p>
                        <Button variant="outline" size="sm" onClick={triggerFileInput}>
                          Change QR Code
                        </Button>
                      </div>
                    ) : (
                      <>
                        <QrCode className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium mb-1">Upload Aadhaar QR Code</p>
                        <p className="text-xs text-muted-foreground text-center mb-4">
                          Take a photo or upload an image of the QR code on your Aadhaar card
                        </p>
                        <Button variant="outline" onClick={triggerFileInput}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload QR Code
                        </Button>
                      </>
                    )}
                  </ClientOnly>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleQrUpload} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="manual">
                <div className="space-y-2">
                  <Label htmlFor="aadhaar-number">Aadhaar Number</Label>
                  <Input 
                    id="aadhaar-number" 
                    placeholder="XXXX XXXX XXXX" 
                    value={aadhaarNumber} 
                    disabled 
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your 12-digit Aadhaar number without spaces or dashes
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {anonAadhaar.status !== "logged-in" && (
            <div className="space-y-4">
              {/* Use the LogInWithAnonAadhaar component from the library */}
              <ClientOnly fallback={
                <div className="flex justify-center p-4 border rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              }>
                <div className="flex justify-center">
                  <LogInWithAnonAadhaar 
                    nullifierSeed={1234567890}
                  />
                </div>
              </ClientOnly>

              {/* For testing purposes, add a test verification button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTestVerify} 
                disabled={isVerifying || !userName.trim()} 
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Test Verification (Demo Mode)"
                )}
              </Button>
            </div>
          )}

          {anonAadhaar.status === "logged-in" && (
            <div className="p-4 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Aadhaar verified successfully for {userName}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Your identity has been verified using zero-knowledge proofs
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>🔒 Your Aadhaar information is verified using zero-knowledge proofs for privacy.</p>
            <p>📱 No personal data is stored on the blockchain or our servers.</p>
            <p>✅ Only verification status is recorded for authentication.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

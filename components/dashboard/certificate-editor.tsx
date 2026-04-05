"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CertificateViewer, 
  CertificateDesignConfig, 
  Signatory 
} from "./certificate-viewer"
import { generatePDF } from "@/lib/pdf-utils"
import { 
  Palette, 
  Upload, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Award,
  Eye
} from "lucide-react"

interface CertificateEditorProps {
  onSave: (config: CertificateDesignConfig) => void
  initialConfig?: Partial<CertificateDesignConfig>
}

export function CertificateEditor({ onSave, initialConfig }: CertificateEditorProps) {
  const [config, setConfig] = useState<CertificateDesignConfig>({
    template_id: "classic",
    organization_name: "",
    logos: [],
    title: "Certificate of Achievement",
    purpose: "For outstanding performance and dedication to excellence.",
    recipient_name: "Jane Doe",
    recipient_rank: "Top Achiever",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    safe_hire_id: "SH-PREVIEW-001",
    signatories: [
      { name: "John Smith", designation: "CEO, Acme Corp" }
    ],
    ...initialConfig as any
  })

  const previewRef = useRef<HTMLDivElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const updateConfig = (updates: Partial<CertificateDesignConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (re) => {
        const url = re.target?.result as string
        updateConfig({ logos: [...(config.logos || []), url].slice(0, 3) })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignatureUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (re) => {
        const url = re.target?.result as string
        const newSignatories = [...config.signatories]
        newSignatories[index] = { ...newSignatories[index], signature_url: url }
        updateConfig({ signatories: newSignatories })
      }
      reader.readAsDataURL(file)
    }
  }

  const addSignatory = () => {
    if (config.signatories.length < 3) {
      updateConfig({ 
        signatories: [...config.signatories, { name: "", designation: "" }] 
      })
    }
  }

  const removeSignatory = (index: number) => {
    updateConfig({ 
      signatories: config.signatories.filter((_, i) => i !== index) 
    })
  }

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    const newSignatories = [...config.signatories]
    newSignatories[index] = { ...newSignatories[index], [field]: value }
    updateConfig({ signatories: newSignatories })
  }

  const handleDownloadPreview = async () => {
    if (previewRef.current) {
      const success = await generatePDF(previewRef.current, "certificate-preview.pdf")
      if (!success) alert("Failed to generate PDF. Please try again.")
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start">
      {/* Editor Controls */}
      <div className="w-full xl:w-[450px] shrink-0 space-y-6">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Certificate Builder
            </CardTitle>
            <CardDescription>
              Customize every detail of your professional certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="design">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="signatories">Signatories</TabsTrigger>
              </TabsList>

              {/* Design Tab */}
              <TabsContent value="design" className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Theme</Label>
                  <Select 
                    value={config.template_id} 
                    onValueChange={(v: any) => updateConfig({ template_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic (Ornate & Formal)</SelectItem>
                      <SelectItem value="modern">Modern (Clean & Bold)</SelectItem>
                      <SelectItem value="premium">Premium (Gold & Dark)</SelectItem>
                      <SelectItem value="academic">Academic (Traditional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Logos (Max 3)</Label>
                  <div className="flex flex-wrap gap-2">
                    {config.logos?.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="Logo" className="h-16 w-16 object-contain border rounded p-1 bg-white" />
                        <button 
                          onClick={() => updateConfig({ logos: config.logos?.filter((_, idx) => idx !== i) })}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {(config.logos?.length || 0) < 3 && (
                      <button 
                        onClick={() => logoInputRef.current?.click()}
                        className="h-16 w-16 border-2 border-dashed border-primary/20 rounded flex items-center justify-center hover:bg-primary/5 transition-colors"
                      >
                        <Upload className="h-4 w-4 text-primary/40" />
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Recommended: Transparent PNG, high resolution.</p>
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input 
                    id="orgName" 
                    value={config.organization_name} 
                    onChange={(e) => updateConfig({ organization_name: e.target.value })} 
                    placeholder="e.g. SafeHire Academy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Certificate Title</Label>
                  <Input 
                    id="title" 
                    value={config.title} 
                    onChange={(e) => updateConfig({ title: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose / Description</Label>
                  <Textarea 
                    id="purpose" 
                    value={config.purpose} 
                    onChange={(e) => updateConfig({ purpose: e.target.value })} 
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rank">Recipient Rank (Optional)</Label>
                    <Input 
                      id="rank" 
                      value={config.recipient_rank} 
                      onChange={(e) => updateConfig({ recipient_rank: e.target.value })} 
                      placeholder="e.g. Distinction"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Issue Date</Label>
                    <Input 
                      id="date" 
                      value={config.date} 
                      onChange={(e) => updateConfig({ date: e.target.value })} 
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Signatories Tab */}
              <TabsContent value="signatories" className="space-y-6">
                {config.signatories.map((sig, i) => (
                  <div key={i} className="p-4 border rounded-lg bg-muted/30 relative space-y-4">
                    <button 
                      onClick={() => removeSignatory(i)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      disabled={config.signatories.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input 
                          value={sig.name} 
                          onChange={(e) => updateSignatory(i, "name", e.target.value)} 
                          placeholder="Full Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input 
                          value={sig.designation} 
                          onChange={(e) => updateSignatory(i, "designation", e.target.value)} 
                          placeholder="Title"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div 
                        className="h-16 w-32 border rounded bg-white flex items-center justify-center cursor-pointer hover:bg-primary/5"
                        onClick={() => signatureInputRefs.current[i]?.click()}
                      >
                        {sig.signature_url ? (
                          <img src={sig.signature_url} alt="Signature" className="h-full object-contain" />
                        ) : (
                          <div className="text-[10px] text-center text-muted-foreground">
                            <Upload className="h-4 w-4 mx-auto mb-1 opacity-40" />
                            Upload Signature
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={el => { signatureInputRefs.current[i] = el }} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleSignatureUpload(i, e)} 
                      />
                    </div>
                  </div>
                ))}

                {config.signatories.length < 3 && (
                  <Button variant="outline" className="w-full" onClick={addSignatory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Signatory
                  </Button>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex gap-3">
              <Button onClick={() => onSave(config)} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finish Design
              </Button>
              <Button variant="outline" onClick={handleDownloadPreview}>
                <Download className="h-4 w-4 mr-2" />
                Sample PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <div className="flex-1 w-full sticky top-0 space-y-4 min-w-0">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4" />
            Live Preview
          </h3>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">A4 Aspect Ratio</span>
        </div>
        
        <div className="bg-muted/20 rounded-xl p-4 border border-dashed flex items-center justify-center overflow-auto max-h-[70vh]">
           <div className="scale-75 origin-top sm:scale-90 md:scale-100 transition-transform">
             <CertificateViewer config={config} containerRef={previewRef} />
           </div>
        </div>

        <Card className="bg-primary/5 border-primary/10 shadow-none">
          <CardContent className="py-3 flex items-center gap-3">
            <Award className="h-5 w-5 text-primary opacity-60" />
            <div className="text-[11px] leading-tight">
              <p className="font-bold text-primary opacity-80 decoration-primary/20 underline underline-offset-2">Pro Tip: Image Resolution</p>
              <p className="text-muted-foreground mt-0.5">Use high-resolution PNGs for the crispest PDF exports across all themes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

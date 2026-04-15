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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  CertificateViewer, 
  CertificateDesignConfig, 
  Signatory,
  RecipientNameStyle
} from "./certificate-viewer"
import { generatePDF } from "@/lib/pdf-utils"
import { uploadCertificateAsset } from "@/lib/supabase/storage-utils"
import { 
  Palette, 
  Upload, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Award,
  Eye,
  Type,
  Layout,
  Save,
  FolderOpen,
  Bold,
  Underline as UnderlineIcon,
  TextQuote
} from "lucide-react"

interface CertificateEditorProps {
  onSave: (config: CertificateDesignConfig) => void
  initialConfig?: Partial<CertificateDesignConfig>
}

export function CertificateEditor({ onSave, initialConfig }: CertificateEditorProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")

  const [config, setConfig] = useState<CertificateDesignConfig>({
    template_id: "classic",
    organization_name: "",
    logos: [],
    logo_count: 1,
    header_lines: [],
    title: "Certificate of Achievement",
    static_text: "This is to certify that",
    body_template: "Has secured {Position} in the {Event Name} held on {Date}.",
    recipient_name: "Jane Doe",
    recipient_rank: "",
    recipient_name_style: { weight: "bold", underline: true, size: "4xl" },
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    safe_hire_id: "SH-PREVIEW-001",
    signatories: [
      { name: "John Smith", designation: "CEO, Acme Corp" }
    ],
    ...initialConfig as any
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/certificates/templates")
      const data = await res.json()
      if (data.ok) setTemplates(data.templates)
    } catch (error) {
       console.error("Failed to fetch templates")
    }
  }

  const previewRef = useRef<HTMLDivElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const updateConfig = (updates: Partial<CertificateDesignConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const path = `logos/${Date.now()}_${file.name}`
        const url = await uploadCertificateAsset(file, path)
        if (url) {
          updateConfig({ logos: [...(config.logos || []), url].slice(0, 4) })
        }
      } catch (error) {
        alert("Failed to upload logo to storage")
      }
    }
  }

  const handleSignatureUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const path = `signatures/${Date.now()}_${file.name}`
        const url = await uploadCertificateAsset(file, path)
        if (url) {
          const newSignatories = [...config.signatories]
          newSignatories[index] = { ...newSignatories[index], signature_url: url }
          updateConfig({ signatories: newSignatories })
        }
      } catch (error) {
        alert("Failed to upload signature to storage")
      }
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name")
      return
    }
    setIsSavingTemplate(true)
    try {
      const res = await fetch("/api/certificates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_name: templateName,
          organization_name: config.organization_name,
          config: config
        })
      })
      const data = await res.json()
      if (data.ok) {
        alert("Template saved successfully!")
        fetchTemplates()
      } else {
        alert("Error saving template: " + data.message)
      }
    } catch (error) {
      alert("Failed to save template")
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const loadTemplate = (tpl: any) => {
    setConfig({ ...tpl.config, organization_name: tpl.organization_name })
    setTemplateName(tpl.template_name)
  }

  const addSignatory = () => {
    if (config.signatories.length < 4) {
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
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="signatories">Signatories</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              {/* Design Tab */}
              <TabsContent value="design" className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Template Theme
                  </Label>
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
                  <div className="flex items-center justify-between mb-1">
                    <Label className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Logo Configuration
                    </Label>
                    <div className="flex bg-muted rounded-md p-1 scale-90">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          onClick={() => updateConfig({ logo_count: num })}
                          className={cn(
                            "px-3 py-1 text-[10px] font-bold rounded transition-all",
                            config.logo_count === num ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-background/50"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-background/50">
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
                    {(config.logos?.length || 0) < 4 && (
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
                  <p className="text-[10px] text-muted-foreground mt-1 text-center italic">Professional Tip: Transparent PNGs look best.</p>
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization / Institution Name</Label>
                  <Input 
                    id="orgName" 
                    value={config.organization_name} 
                    onChange={(e) => updateConfig({ organization_name: e.target.value })} 
                    placeholder="e.g. SafeHire Academy"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Header lines (One per line)
                  </Label>
                  <Textarea 
                    value={config.header_lines?.join("\n")}
                    onChange={(e) => updateConfig({ header_lines: e.target.value.split("\n") })}
                    placeholder="Line 1: Main Institution\nLine 2: Sub-affiliation\nLine 3: Accreditation"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Certificate Title</Label>
                  <Select 
                    value={config.title} 
                    onValueChange={(v) => updateConfig({ title: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Certificate of Participation">Certificate of Participation</SelectItem>
                      <SelectItem value="Certificate of Achievement">Certificate of Achievement</SelectItem>
                      <SelectItem value="Certificate of Excellence">Certificate of Excellence</SelectItem>
                      <SelectItem value="Custom">Custom Title...</SelectItem>
                    </SelectContent>
                  </Select>
                  {config.title === "Custom" && (
                     <Input 
                       className="mt-2"
                       placeholder="Enter custom title"
                       onChange={(e) => updateConfig({ title: e.target.value })}
                     />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TextQuote className="h-4 w-4" />
                    Static Attribution
                  </Label>
                  <Input 
                    value={config.static_text} 
                    onChange={(e) => updateConfig({ static_text: e.target.value })} 
                  />
                </div>

                <div className="p-4 border rounded-lg bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary opacity-70">Recipient Name Style</Label>
                    <div className="flex gap-1">
                      <Button 
                        variant={config.recipient_name_style?.weight === "bold" ? "default" : "outline"} 
                        size="sm" className="h-7 w-7 p-0"
                        onClick={() => updateConfig({ recipient_name_style: { ...config.recipient_name_style, weight: config.recipient_name_style?.weight === "bold" ? "normal" : "bold" } })}
                      >
                        <Bold className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant={config.recipient_name_style?.underline ? "default" : "outline"} 
                        size="sm" className="h-7 w-7 p-0"
                        onClick={() => updateConfig({ recipient_name_style: { ...config.recipient_name_style, underline: !config.recipient_name_style?.underline } })}
                      >
                        <UnderlineIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Select 
                    value={config.recipient_name_style?.size || "4xl"} 
                    onValueChange={(v) => updateConfig({ recipient_name_style: { ...config.recipient_name_style, size: v } })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2xl">Small</SelectItem>
                      <SelectItem value="4xl">Standard</SelectItem>
                      <SelectItem value="6xl">Large</SelectItem>
                      <SelectItem value="8xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Body template (Variable Support)</Label>
                  <Textarea 
                    id="body" 
                    value={config.body_template} 
                    onChange={(e) => updateConfig({ body_template: e.target.value })} 
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2">
                    {["{Full Name}", "{Position}", "{Event Name}", "{Date}"].map(v => (
                       <code key={v} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border cursor-pointer hover:bg-primary/10" onClick={() => updateConfig({ body_template: (config.body_template || "") + " " + v })}>{v}</code>
                    ))}
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
                        className="h-16 w-32 border rounded bg-white flex items-center justify-center cursor-pointer hover:bg-primary/5 shadow-sm"
                        onClick={() => signatureInputRefs.current[i]?.click()}
                      >
                        {sig.signature_url ? (
                          <img src={sig.signature_url} alt="Signature" className="h-full object-contain p-1" />
                        ) : (
                          <div className="text-[10px] text-center text-muted-foreground">
                            <Upload className="h-4 w-4 mx-auto mb-1 opacity-40" />
                            Upload
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

                {config.signatories.length < 4 && (
                  <Button variant="outline" className="w-full" onClick={addSignatory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Signatory
                  </Button>
                )}
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-4">
                <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                   <Label className="flex items-center gap-2">
                     <Save className="h-4 w-4" />
                     Save Current as Template
                   </Label>
                   <div className="flex gap-2">
                      <Input 
                        placeholder="Template Name e.g. Annual Sports" 
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                      />
                      <Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
                        {isSavingTemplate ? "Saving..." : "Save"}
                      </Button>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="flex items-center gap-2">
                     <FolderOpen className="h-4 w-4" />
                     Saved Templates
                   </Label>
                   <div className="grid grid-cols-1 gap-2">
                      {templates.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-4 text-center border rounded">No templates saved yet.</p>
                      ) : (
                        templates.map((tpl, i) => (
                          <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => loadTemplate(tpl)}>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{tpl.template_name}</span>
                              <span className="text-[10px] text-muted-foreground">{tpl.organization_name} &bull; {new Date(tpl.created_at).toLocaleDateString()}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                               <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex gap-3">
              <Button onClick={() => onSave(config)} className="flex-1 font-bold">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finish & Apply
              </Button>
              <Button variant="outline" onClick={handleDownloadPreview}>
                <Download className="h-4 w-4 mr-2" />
                Sample PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tip Card */}
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

      {/* Preview Panel (Right Column) */}
      <Card className="lg:col-span-8 overflow-hidden bg-slate-100/50 shadow-inner flex flex-col border-2 sticky top-8">
        <CardHeader className="bg-white border-b py-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Live High-Resolution Preview
            </CardTitle>
            <CardDescription className="text-[10px]">What you see is exactly what will be issued.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">1000x707px</Badge>
            <div className="h-4 w-px bg-border mx-1" />
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={handleDownloadPreview}>
              <Download className="h-3 w-3 mr-1" />
              Test PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden relative group min-h-[600px]">
          {/* Canvas Desktop Area */}
          <div className="absolute inset-0 overflow-auto p-8 flex justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
            <div 
              className="transition-all duration-300 ease-out shadow-2xl origin-top mb-12"
              style={{ 
                transform: `scale(max(0.4, min(0.85, 1)))`, // Responsive but stable scale
                width: "1000px"
              }}
            >
              <CertificateViewer config={config} containerRef={previewRef} />
            </div>
          </div>

          {/* Interaction Overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg border rounded-full px-4 py-1.5 flex items-center gap-4 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="flex items-center gap-1"><Layout className="h-3 w-3" /> Drag to scroll</span>
            <div className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {config.template_id} theme</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

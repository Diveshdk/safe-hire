"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface DemoCertificatesButtonProps {
  totalCertificates: number
}

export function DemoCertificatesButton({ totalCertificates }: DemoCertificatesButtonProps) {
  if (totalCertificates > 0) return null

  const handleCreateDemo = async () => {
    try {
      const response = await fetch('/api/institution/seed-demo', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`Successfully created ${data.data.length} demo certificates!\n\nNFT Codes:\n${data.nft_codes.map((cert: any) => `${cert.recipient} - ${cert.nft_code}`).join('\n')}`)
        window.location.reload()
      } else {
        alert(data.message)
      }
    } catch (error) {
      alert('Failed to create demo certificates')
    }
  }

  return (
    <Button 
      className="w-full justify-start" 
      variant="outline"
      onClick={handleCreateDemo}
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Demo Certificates
    </Button>
  )
}

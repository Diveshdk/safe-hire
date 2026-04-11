"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ImagePlus,
  Loader2,
  X,
  Send,
  Sparkles,
  Globe,
  Smile,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function PostFormDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max size is 5MB", variant: "destructive" })
        return
      }
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const removeImage = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      let image_url = null

      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/posts/upload-image", {
          method: "POST",
          body: formData,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadJson.ok) throw new Error(uploadJson.message)
        image_url = uploadJson.url
      }

      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image_url }),
      })
      const json = await res.json()

      if (json.ok) {
        toast({ title: "Post published!", description: "Your social update is now live on the feed." })
        setOpen(false)
        setContent("")
        removeImage()
        router.refresh()
      } else {
        toast({ title: "Error", description: json.message, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Failed to post", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl border-[#E4E4E7] p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 py-4 border-b border-[#F4F4F6]">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#18181B]">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Create Social Post
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#F4F4F6] flex items-center justify-center font-bold text-[#18181B]">
              O
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#71717A]">
                <Globe className="h-3 w-3" /> Public Post
              </div>
              
              <Textarea
                placeholder="What's happening? Share an update with your followers..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[140px] text-lg border-none focus-visible:ring-0 p-0 resize-none placeholder:text-[#A1A1AA] text-[#18181B]"
                autoFocus
              />

              {preview && (
                <div className="relative rounded-2xl overflow-hidden group select-none border border-[#E4E4E7]">
                  <img src={preview} alt="Preview" className="w-full object-cover max-h-[300px]" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 h-8 w-8 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all sm:opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#F4F4F6]">
            <div className="flex items-center gap-1">
              <label className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#F4F4F6] transition-colors cursor-pointer text-[#71717A] hover:text-[#18181B]">
                <ImagePlus className="h-5 w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
              <button type="button" className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#F4F4F6] transition-colors text-[#71717A] hover:text-[#18181B]">
                <Smile className="h-5 w-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className={cn(
                "px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2",
                content.trim() 
                  ? "bg-[#18181B] text-white hover:bg-[#27272A]" 
                  : "bg-[#F4F4F6] text-[#A1A1AA] cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeletePostButtonProps {
  postId: string
  onDelete?: () => void
}

export function DeletePostButton({ postId, onDelete }: DeletePostButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      if (res.ok) {
        if (onDelete) {
          onDelete()
        } else {
          window.location.reload()
        }
      } else {
        const json = await res.json()
        alert(json.message || "Failed to delete post")
        setDeleting(false)
        setConfirm(false)
      }
    } catch {
      alert("Something went wrong")
      setDeleting(false)
      setConfirm(false)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleDelete()
      }}
      disabled={deleting}
      className={cn(
        "p-1.5 rounded-lg transition-all duration-200",
        confirm 
          ? "bg-red-50 text-red-600 animate-pulse" 
          : "text-[#A1A1AA] hover:text-red-500 hover:bg-red-50"
      )}
      title={confirm ? "Click again to confirm" : "Delete Post"}
    >
      {deleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

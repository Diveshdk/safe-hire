"use client"

import { useState, useEffect, useCallback } from "react"

interface UseFilePreviewReturn {
  previewUrl: string | null
  setFile: (file: File | null) => void
  clearPreview: () => void
}

/**
 * Custom hook for managing file previews with proper cleanup of blob URLs
 * Prevents memory leaks and blob resource errors
 */
export function useFilePreview(): UseFilePreviewReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const setFile = useCallback((file: File | null) => {
    // Cleanup previous URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    // Create new preview URL if file is provided
    if (file) {
      try {
        const newUrl = URL.createObjectURL(file)
        setPreviewUrl(newUrl)
      } catch (error) {
        console.error("Failed to create object URL:", error)
        setPreviewUrl(null)
      }
    }
  }, [previewUrl])

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [previewUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return {
    previewUrl,
    setFile,
    clearPreview,
  }
}

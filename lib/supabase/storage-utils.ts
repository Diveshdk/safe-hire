import { getSupabaseBrowser } from "./client"

export async function uploadCertificateAsset(file: File, path: string) {
  const supabase = getSupabaseBrowser()
  
  // Ensure we are in a browser environment
  if (typeof window === "undefined") return null

  const { data, error } = await supabase.storage
    .from("certificates")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true
    })

  if (error) {
    console.error("Error uploading to Supabase Storage:", error)
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from("certificates")
    .getPublicUrl(data.path)

  return publicUrl
}

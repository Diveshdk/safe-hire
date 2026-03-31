"use client"

import useSWR from "swr"

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    const t = await r.text()
    try {
      return t ? JSON.parse(t) : {}
    } catch {
      return { message: t }
    }
  })

export default function AadhaarVerifyCard() {
  const { data } = useSWR("/api/me/profile", fetcher)
  const verified = !!data?.aadhaar_verified
  if (verified) return null

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Aadhaar verification</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify once to show a blue tick on your profile. You can also verify later.
      </p>
      <div className="mt-3 flex gap-2">
        <a
          href="/aadhaar"
          className="inline-flex items-center rounded-md bg-[color:var(--primary)] px-3 py-2 text-[color:var(--primary-foreground)]"
        >
          Verify now
        </a>
        <a href="/dashboard" className="inline-flex items-center rounded-md border px-3 py-2">
          Verify later
        </a>
      </div>
    </div>
  )
}

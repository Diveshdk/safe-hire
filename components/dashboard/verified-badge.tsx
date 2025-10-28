"use client"

export default function VerifiedBadge() {
  return (
    <span
      aria-label="Aadhaar verified"
      title="Aadhaar verified"
      className="ml-2 inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="mr-1 fill-current">
        <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />
      </svg>
      Verified
    </span>
  )
}

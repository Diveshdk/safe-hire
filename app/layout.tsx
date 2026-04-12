import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Safe Hire — Verified Hiring Platform",
  description: "Hire with confidence. Verified professionals, zero fraud.",
  generator: "Safe Hire",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div className="min-h-dvh bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}

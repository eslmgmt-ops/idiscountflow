import type { Metadata } from "next"
import { DM_Sans, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const fontSans = DM_Sans({
  variable: "--font-idf-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "idiscountflow · Discount manager",
  description: "Discount management portal for Treez org-level discounts.",
  metadataBase: new URL("https://idiscountflow.com"),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

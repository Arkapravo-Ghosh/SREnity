import type { Metadata, Viewport } from "next";
import { Host_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@/components/site/Analytics";
import { SITE } from "@/lib/site";
import "./globals.css";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});


const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "incident context",
    "incident timeline",
    "PIR",
    "post-incident review",
    "root cause analysis",
    "IT incident management",
    "incident management",
    "shift handover",
    "incident history",
    "similar incidents",
    "MTTR",
    "time to resolve",
    "SLA",
    "NOC",
    "network operations",
    "MSP",
    "SRE",
    "ITSM",
    "ServiceNow",
  ],
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    locale: "en_US",
    title: SITE.title,
    description:
      "Fragmented data to incident clarity. One evidence-backed timeline of what happened, what was tried, who owns it and how similar incidents were fixed, plus the PIR report. Every line linked to its source. Coming soon.",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description:
      "The ticket, work notes, team chat and monitoring behind an IT incident, in one timeline where every line links to its source. Join the early-access list.",
  },
  robots: { index: true, follow: true },
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION },
  }),
};

export const viewport: Viewport = {
  themeColor: "#0b2a38",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${hostGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

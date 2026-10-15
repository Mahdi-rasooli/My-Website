import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { profile, isPlaceholder } from "@/content/profile";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description = `${profile.name} designs, models and optimizes business processes with AI. Computer Science graduate, former web developer, machine-learning practitioner.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${profile.name}, AI process engineer`,
  description,
  openGraph: {
    title: profile.name,
    description: profile.pitch,
    type: "profile",
  },
  twitter: { card: "summary_large_image", title: profile.name, description: profile.pitch },
};

export const viewport: Viewport = {
  themeColor: "#0a1628",
  colorScheme: "dark",
};

const sameAs = [profile.links.linkedin, profile.links.github].filter((url) => !isPlaceholder(url));

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "AI process engineer",
  worksFor: { "@type": "Organization", name: "Avitec" },
  description,
  url: siteUrl,
  ...(sameAs.length ? { sameAs } : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}

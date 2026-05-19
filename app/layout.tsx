import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import "./landing.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deslize — Carrosséis que parecem feitos por designer",
  description: "Descreva o tema, escolha o formato e a IA gera um carrossel completo com a identidade da sua marca em segundos.",
  keywords: ["carrossel instagram", "inteligência artificial", "design", "marketing digital", "automação", "redes sociais"],
  openGraph: {
    title: "Deslize — Carrosséis que parecem feitos por designer",
    description: "Descreva o tema, escolha o formato e a IA gera um carrossel completo com a identidade da sua marca em segundos.",
    url: "https://deslize.com.br",
    siteName: "Deslize",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deslize — Carrosséis que parecem feitos por designer",
    description: "Descreva o tema, escolha o formato e a IA gera um carrossel completo com a identidade da sua marca.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}

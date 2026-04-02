import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Systra — Design System Extractor",
  description: "Cole a URL de qualquer site e extraia o design system completo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`h-full flex flex-col ${inter.variable}`}>
        <div className="flex-1 min-h-0">{children}</div>
        {/* !! NÃO REMOVER — crédito obrigatório !! */}
        <footer
          style={{
            textAlign: 'center',
            padding: '6px 0',
            fontSize: '11px',
            color: '#394aa5',
            background: '#e4e7f8',
            borderTop: '1px solid rgba(195,201,232,0.6)',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          Feito por <strong>Rayssa Alegria</strong>
        </footer>
      </body>
    </html>
  );
}

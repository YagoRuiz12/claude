import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://siruztec.com.br"),
  title: {
    default: "SiruzTec — 144 Especialistas de IA para o Seu Negócio",
    template: "%s | SiruzTec",
  },
  description:
    "Contrate uma equipe completa de especialistas de IA: copywriters lendários, estrategistas de negócio, especialistas em tráfego pago, branding e muito mais. Sua empresa, operando 24h.",
  keywords: [
    "agentes de IA", "empresa virtual", "copywriting com IA", "estratégia de negócio IA",
    "tráfego pago IA", "branding IA", "consultoria IA", "Claude AI Brasil",
    "especialistas de IA", "automação de negócios", "IA para empresas",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://siruztec.com.br",
    siteName: "SiruzTec",
    title: "SiruzTec — 144 Especialistas de IA",
    description: "Uma equipe completa de especialistas de IA prontos para trabalhar no seu negócio 24h por dia.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://siruztec.com.br" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "SiruzTec",
              description: "Plataforma SaaS com 144 especialistas de IA em 12 departamentos para assessorar empresas 24h.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", name: "STARTUP", priceCurrency: "BRL", price: "97" },
                { "@type": "Offer", name: "SCALE", priceCurrency: "BRL", price: "297" },
                { "@type": "Offer", name: "DOMINANCE", priceCurrency: "BRL", price: "697" },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

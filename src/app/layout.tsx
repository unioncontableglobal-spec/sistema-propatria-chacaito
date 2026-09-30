import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import Sidebar from "@/components/layout/Sidebar";
import GlobalLoader from "@/components/GlobalLoader";
import AIAssistant from "@/components/AIAssistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACPCC - Unión Contable Global",
  description: "Sistema contable web integral – Asoc. Civil Propatria Chacaito",
};

// ✅ Viewport correcta para tablets y celulares
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialRole = cookieStore.get('auth_token')?.value || null;

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <GlobalLoader>
          <div className="layout-container">
            <Sidebar initialRole={initialRole} />
            {/* pt-14 en móvil: espacio para la barra superior fija */}
            <main className="main-content pt-14 md:pt-0 min-w-0 overflow-x-hidden">
              {children}
              <AIAssistant />
            </main>
          </div>
        </GlobalLoader>
      </body>
    </html>
  );
}

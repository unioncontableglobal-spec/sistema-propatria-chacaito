import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { 
  BarChart2, 
  Users, 
  FolderOpen, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  ClipboardCheck, 
  ArrowRightLeft, 
  Book, 
  BookOpen, 
  Scale,
  Receipt
} from "lucide-react";
import { cookies } from "next/headers";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import GlobalLoader from "@/components/GlobalLoader";
import GlobalMonthSelector from "@/components/layout/GlobalMonthSelector";

export const metadata: Metadata = {
  title: "Unión Contable Global",
  description: "Sistema contable web integral",
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
            <main className="main-content">
              {children}
            </main>
          </div>
        </GlobalLoader>
      </body>
    </html>
  );
}

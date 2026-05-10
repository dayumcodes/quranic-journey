import type { Metadata } from "next";
import { Amiri, DM_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Al-Rihla",
  description: "Quranic journey experience",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  }
};

const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('al_rihla_theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${dmSans.variable} ${outfit.variable} ${amiri.variable} ${jetbrainsMono.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import { I18nProvider } from "@/i18n";
import { DEFAULT_LANG } from "@/i18n/types";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ByteVoice Bangladesh — Bangla AI voice receptionist for clinics",
    template: "%s · ByteVoice Bangladesh",
  },
  description:
    "ByteVoice answers patient calls in natural Bangla, captures appointment requests, and organises every call in a secure staff portal. A StrategyByte product.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={DEFAULT_LANG}
      suppressHydrationWarning
      className={`${jakarta.variable} ${geistMono.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

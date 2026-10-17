import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist_Mono } from "next/font/google";
import { A11yProvider } from "@/components/a11y-provider";
import "./globals.css";

// Atkinson Hyperlegible was designed by the Braille Institute for low-vision readers.
const sans = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOVA · Procedure readiness",
  description: "Helps children and families get ready for medical procedures, and shows care teams who needs help.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <A11yProvider>{children}</A11yProvider>
      </body>
    </html>
  );
}

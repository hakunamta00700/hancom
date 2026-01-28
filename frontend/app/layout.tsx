import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Hancom Academy Studio",
  description: "문항 추출, 검수, 시험지 제작을 위한 통합 콘솔",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${spaceGrotesk.variable} ${fraunces.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-hero">
          <div className="bg-grid bg-grain">
            <div className="relative">
              <div className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-coral/20 blur-3xl" />
              <div className="pointer-events-none absolute top-64 -left-10 h-64 w-64 rounded-full bg-teal/20 blur-3xl" />
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

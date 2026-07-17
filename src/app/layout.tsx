
// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import HomeNav from "@/components/HomeNav";
import ThemeProvider from "./theme-provider";
import PageTransition from "./page-transition";
import DelayedFooter from "@/delayed-footer";
import { Inter, Young_Serif } from "next/font/google";
import StyledComponentsRegistry from "./registry";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-young-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jang Nuga | Developer",
  description: "장누가의 개인 포트폴리오",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/fontAwesome.min.css" />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${youngSerif.variable} antialiased px-6 hide-scrollbar`}>
        <StyledComponentsRegistry>
          <ThemeProvider>
            <HomeNav />
            <PageTransition>{children}</PageTransition>
            <DelayedFooter />
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
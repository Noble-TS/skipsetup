import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import SiteHeader from "./_components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "SkipSetup",
  description: "Production-ready fullstack foundation",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <SiteHeader />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}

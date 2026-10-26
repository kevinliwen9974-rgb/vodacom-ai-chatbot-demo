import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});

export const metadata: Metadata = {
  title: "Vodacom AI Customer Experience Demo",
  description:
    "Huawei Cloud demo — synthetic Vodacom self-service portal with proactive AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA">
      <body className={`${dm.variable} antialiased`} lang="en-ZA">
        {children}
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./layout-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LNS chitfunds",
  description: "financial distributions",
};

const RootLayout = ({ children }) => (
  <html lang="en">
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <ClientLayout>{children}</ClientLayout>
    </body>
  </html>
);

export default RootLayout;

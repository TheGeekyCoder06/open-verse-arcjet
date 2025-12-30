import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CommonLayout from "@/components/layout/layout";
import { verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Open Verse",
  description: "A platform to explore and share creative works",
};

export default async function RootLayout({ children }) {
  const token = (await cookies()).get("auth_token")?.value;
  const user = await verifyAuthToken(token);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CommonLayout>{children}</CommonLayout>
      </body>
    </html>
  );
}

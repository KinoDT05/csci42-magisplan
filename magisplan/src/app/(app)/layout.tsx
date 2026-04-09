import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import SidebarLayout from "@/components/SidebarLayout";
<<<<<<< HEAD
import LogoutButton from "@/components/LogoutButton";
=======
>>>>>>> 4c81a09 (initial fixes only)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </body>
    </html>
  );
}
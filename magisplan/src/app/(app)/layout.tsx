// import type { Metadata } from "next";
"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [expanded, setExpanded] = useState(true);
  return (
    <html lang="en">
      <body className={expanded ? "sb-expanded" : ""}>
        <aside>
          <nav>
            <ul>
              <li>
                <p className="text-2xl font-bold titleEx text-white py-5">MagisPlan</p>
              </li>
              <li>
                <a href="#">
                  <img src="/home.svg" alt="Icon" width={30} />
                  <span>Home</span>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src="/chat.svg" alt="Icon" width={30} />
                  <span>Chat</span>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src="/profile.svg" alt="Icon" width={30} />
                  <span>Profile</span>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src="/project.svg" alt="Icon" width={30} />
                  <span>My Projects</span>
                </a>
                          </li>
                          
                          <li>
                <a onClick={() => setExpanded(!expanded)}>
                    <img src="/arrow.svg" alt="Icon" width={30} className="collapsed" />
                  <span>Collapse</span>
                </a>
              </li>
                          <li>
                              <LogoutButton />
                          </li>
            </ul>
          </nav>
        </aside>
        <main  className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </main>
      </body>
    </html>
  );
}

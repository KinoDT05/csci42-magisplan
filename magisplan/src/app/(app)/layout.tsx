"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

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
}: {
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      console.log("USER:", data.user); 
      setUserId(data.user?.id ?? null);
    };

    getUser();
  }, []);

  return (
    <html lang="en">
      <body className={expanded ? "sb-expanded" : ""}>
        <aside>
          <nav>
            <ul>
              <li>
                <p className="text-2xl font-bold titleEx text-white py-5">
                  MagisPlan
                </p>
              </li>

              <li>
                <Link href="#">
                  <img src="/home.svg" alt="Icon" width={30} />
                  <span>Home</span>
                </Link>
              </li>

              <li>
                <Link href="#">
                  <img src="/chat.svg" alt="Icon" width={30} />
                  <span>Chat</span>
                </Link>
              </li>

              <li>
                  <Link href={`/profile/${userId}`}>
                    <img src="/profile.svg" alt="Icon" width={30} />
                    <span>Profile</span>
                  </Link>
              </li>

              <li>
                <Link href="#">
                  <img src="/project.svg" alt="Icon" width={30} />
                  <span>My Projects</span>
                </Link>
              </li>

              <li>
                <a onClick={() => setExpanded(!expanded)}>
                  <img
                    src="/arrow.svg"
                    alt="Icon"
                    width={30}
                    className="collapsed"
                  />
                  <span>Collapse</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </main>
      </body>
    </html>
  );
}
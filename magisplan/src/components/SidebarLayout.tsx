"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };

    getUser();
  }, []);

  return (
    <div className={`layout ${expanded ? "sb-expanded" : ""}`}>
      <aside>
        <nav>
          <ul>
            <li>
              <p className="text-2xl font-bold titleEx text-white py-5">
                MagisPlan
              </p>
            </li>

            <li>
              <Link href="/user/dashboard">
                <img src="/home.svg" width={30} />
                <span>Home</span>
              </Link>
            </li>

            <li>
              <Link href="#">
                <img src="/chat.svg" width={30} />
                <span>Chat</span>
              </Link>
            </li>

            <li>
              <Link href={userId ? `/profile/${userId}` : "#"}>
                <img src="/profile.svg" width={30} />
                <span>Profile</span>
              </Link>
            </li>

            <li>
              <Link href="#">
                <img src="/project.svg" width={30} />
                <span>My Projects</span>
              </Link>
            </li>

            <li>
              <button onClick={() => setExpanded(!expanded)}>
                <img src="/arrow.svg" width={30} />
                <span>Collapse</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main>{children}</main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default function SidebarLayout({
  children,
  mainClassName = "",
}: {
  children: React.ReactNode;
  mainClassName?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: authData } = await supabase.auth.getUser();

      const id = authData.user?.id ?? null;
      setUserId(id);

      if (!id) return;

      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("userID", id)
        .single();

      if (error) {
        console.error("Error fetching username:", error);
        return;
      }

      setUsername(data.username);
    };

    getUser();
  }, []);

  return (
    <div className={`layout ${expanded ? "sb-expanded" : ""}`}>
      <aside>
        <nav>
          <ul>
            <li>
              <div className="flex items-center px-3 py-5">
                <span className="titleEx text-2xl font-bold text-white">
                  MagisPlan
                </span>
              </div>
            </li>

            <li>
              <Link href="/user/dashboard">
                <img src="/home.svg" width={30} />
                <span>Home</span>
              </Link>
            </li>

            <li>
              <Link href={username ? `/profile/${username}` : "#"}>
                <img src="/profile.svg" width={30} />
                <span>Profile</span>
              </Link>
            </li>

            <li>
              <div className="sidebar-logout">
                <img src="/logout.svg" width={30} />
                <span>
                  <LogoutButton />
                </span>
              </div>
            </li>
           
            <li>
              <button onClick={() => setExpanded(!expanded)}>
                <img src="/arrow.svg" width={30} />
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className={mainClassName}>{children}</main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProfileData = {
  userID: string;
  fullName: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  emailAddress: string;
  contactNumber: string;
  username: string;
  profileImageUrl?: string | null;
  projects: {
    projectID: number;
    projectName: string;
    role: string;
  }[];
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[ProfilePage] username param:", username);

        setLoading(true);

        const response = await fetch(`/api/profile/username/${username}`);
        const result = await response.json();

        console.log("[ProfilePage] response status:", response.status);
        console.log("[ProfilePage] response data:", result);

        if (!response.ok) {
          console.error("[ProfilePage] fetch failed:", result.error);
          setUser(null);
          return;
        }

        setUser(result);
      } catch (error) {
        console.error("[ProfilePage] unexpected error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: authData } = await supabase.auth.getUser();

      const authUserId = authData.user?.id;
      if (!authUserId) return;

      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("userID", authUserId)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setCurrentUsername(data.username);
    };

    getCurrentUser();
  }, []);

  return (
    <div className="w-full px-6 py-6">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48 rounded-full overflow-hidden bg-[var(--txt-gray)] flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={`${user.username}'s profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-center text-white px-2">No Available Image</p>
            )}
          </div>

          <div className="flex flex-col justify-center text-[var(--main)]">
            {loading ? (
              <p>Loading...</p>
            ) : user ? (
              <>
                <p className="font-semibold text-5xl">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-2xl">@{user.username}</p>
                <p className="text-2xl">{user.contactNumber}</p>
              </>
            ) : (
              <p>User not found.</p>
            )}
          </div>
        </div>

        {currentUsername === username && (
          <div className="md:ml-auto">
            <Link href={`/profile/${username}/edit`}>
              <div className="btn-secondary font-semibold">
                Edit Details
              </div>
            </Link>
          </div>
        )}
      </div>

      <div className="flex gap-6 text-center mb-5">
        <div className="w-2/3 bg-[#E6E6E6] rounded-xl p-5 font-semibold shadow-md">
          Project
        </div>

        <div className="w-1/3 bg-[#E6E6E6] rounded-xl p-5 font-semibold shadow-md">
          Role
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-2/3 bg-[#E6E6E6] rounded-xl p-5 shadow-md text-center">
          {user?.projects?.length ? (
            user.projects.map((item, index) => (
              <div key={index} className="mb-2">
                {item.projectName}
              </div>
            ))
          ) : (
            <p>No projects found.</p>
          )}
        </div>

        <div className="w-1/3 bg-[#E6E6E6] rounded-xl p-5 shadow-md text-center">
          {user?.projects?.length ? (
            user.projects.map((item, index) => (
              <div key={index} className="mb-2">
                {item.role}
              </div>
            ))
          ) : (
            <p>No roles found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

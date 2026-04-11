"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ProfileData = {
  userID: string;
  fullName: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  emailAddress: string;
  contactNumber: string;
  username: string;
  projects: {
    projectID: number;
    projectName: string;
    role: string;
  }[];
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username]);

  return (
    <div className="w-full px-6 py-6">

      {/* profile details */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-20">

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48 flex items-center justify-center bg-[var(--txt-gray)] text-white rounded-full">
            <p className="text-center">No Available Image</p>
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

        <div className="md:ml-auto">
          <Link href={`/profile/${username}/edit`}>
            <div className="btn-secondary font-semibold">
              Edit Details
            </div>
          </Link>
        </div>
      </div>

      {/* header */}
      <div className="flex gap-6 text-center mb-5">
        <div className="w-2/3 bg-[#E6E6E6] rounded-xl p-5 font-semibold shadow-md">
          Project
        </div>

        <div className="w-1/3 bg-[#E6E6E6] rounded-xl p-5 font-semibold shadow-md">
          Role
        </div>
      </div>

      {/* list */}
      <div className="flex gap-6">
        <div className="w-2/3 bg-[#E6E6E6] rounded-xl p-5 shadow-md text-center">
          {user?.projects?.length ? (
            user.projects.map((item: any, index: number) => (
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
            user.projects.map((item: any, index: number) => (
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
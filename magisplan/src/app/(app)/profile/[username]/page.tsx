"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<any>(null);
  const [projectsData, setProjectsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("userID, firstName, lastName, contactNumber, username")
        .eq("username", username)
        .single();

      if (userError) {
        console.error("User error:", userError);
        return;
      }

      setUser(userData);

      const { data: projectData, error: projectError } = await supabase
        .from("project_members")
        .select(`
          role,
          projects (
            projectName
          )
        `)
        .eq("userID", userData.userID);

      if (projectError) {
        console.error("Projects error:", projectError);
      } else {
        setProjectsData(projectData || []);
      }
    };

    fetchData();
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
            {user ? (
              <>
                <p className="font-semibold text-5xl">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-2xl">@{user.username}</p>
                <p className="text-2xl">{user.contactNumber}</p>
              </>
            ) : (
              <p>Loading...</p>
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
          {projectsData.map((item, index) => (
            <div key={index} className="mb-2">
              {item.projects?.projectName}
            </div>
          ))}
        </div>

        <div className="w-1/3 bg-[#E6E6E6] rounded-xl p-5 shadow-md text-center">
          {projectsData.map((item, index) => (
            <div key={index} className="mb-2">
              {item.role}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
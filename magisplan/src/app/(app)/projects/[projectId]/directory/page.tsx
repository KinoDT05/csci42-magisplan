"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";

interface Member {
  userID: string;
  displayName: string;
  role: string;
  dateJoined: string;
  committeeName: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  emailAddress: string | null;
  contactNumber: string | null;
}

interface ProjectDetails {
  projectName: string;
  targetDate: string;
}

export default function ProjectDirectoryPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  const [members, setMembers] = useState<Member[]>([]);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("projectName, targetDate")
          .eq("projectID", projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        const res = await fetch(`/api/projects/${projectId}/directory`);
        if (!res.ok) {
          throw new Error("Failed to fetch directory");
        }
        
        const membersData = await res.json();
        setMembers(membersData);

      } catch (err: any) {
        console.error(err);
        setError("Failed to load directory data.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
  };

  if (loading) {
    return (
        <div className="p-10 text-black">Loading Directory...</div>
    );
  }

  return (
    <div className="bg-[#f5f5f5] w-full min-h-screen p-10 font-sans text-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-[2.5rem] font-bold text-[var(--main)] tracking-tight mb-8">
            {project?.projectName ? `${project.projectName} Directory` : "Project Directory"}
          </h1>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[var(--main)] leading-tight w-24">Target Date:</h2>
              <div className="bg-white px-8 py-3 rounded-md shadow-sm border border-gray-200 font-bold text-xl text-[var(--main)] min-w-[200px] text-center">
                {formatDate(project?.targetDate)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[var(--main)] leading-tight">Members:</h2>
              <div className="bg-white px-10 py-3 rounded-md shadow-sm border border-gray-200 font-bold text-xl text-[var(--main)] min-w-[120px] text-center">
                {members.length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-4 bg-[#e0e0e0] rounded-full px-8 py-4 text-sm font-bold text-center text-gray-800 shadow-sm border border-gray-200">
            <p>Name</p>
            <p>Contact Details</p>
            <p>Committee</p>
            <p>Role</p>
          </div>
          
          <div className="bg-[#ebebeb] rounded-[1.5rem] p-3 space-y-2 shadow-inner">
            {members.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center font-medium">No members found in this project.</p>
            ) : (
              members.map((member) => (
                <div 
                  key={member.userID} 
                  className="grid grid-cols-4 px-5 py-3 text-sm text-center items-center rounded-xl hover:bg-[#e0e0e0] transition-colors"
                >
                  <div className="flex justify-center">
                    <span className="text-gray-700 font-medium text-xs">
                      {`${member.firstName} ${member.lastName}`}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium text-xs">
                    {member.contactNumber || member.emailAddress || "No contact info"}
                  </p>
                  <p className="text-gray-800 font-bold">
                    {member.committeeName || "Moderator Core"}
                  </p>
                  <p className="text-gray-700 capitalize">
                    {member.role.toLowerCase()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
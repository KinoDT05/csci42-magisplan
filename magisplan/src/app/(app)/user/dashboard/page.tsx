"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import Link from "next/link";
import ProjectList from "@/components/ProjectList";
import InvitesList from "@/components/InvitesList";

interface Projects {
    targetDate: string;
    projectName: string;
    projectDescription: string;
    projectID: number;
    datetimeCreated?: string; 
    dateCreated?: string;
}

interface Invites {
    committeeID: number;
    role: string;
    committeeName: string;
    projectName: string;
    projectDescription: string;
}

export default function UserDashboard() {
    const [projects, setProjects] = useState<Projects[]>([]);
    const [invites, setInvites] = useState<Invites[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "active" | "archived">("all");
    const [sortBy, setSortBy] = useState("name");

    const getProjects = () => fetch("/api/user/get-projects").then(res => res.json());
    const getInvites = () => fetch("/api/user/get-invites").then(res => res.json());

    const getAll = async () => {
        try {
            const [projRes, invRes] = await Promise.all([getProjects(), getInvites()]);
            setProjects(projRes.data || []);
            setInvites(invRes.data || []);
        } catch (error) {
            console.error("Failed to fetch dashboard data");
        }
    };

    useEffect(() => {
        const init = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id ?? null);
            await getAll();
            setLoading(false);
        };
        init();
    }, []);

    const filteredProjects = projects
        .filter(p => {
            if (searchQuery && !p.projectName.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            const isArchived = new Date(p.targetDate).getTime() < new Date().getTime();
            if (activeTab === "active" && isArchived) return false;
            if (activeTab === "archived" && !isArchived) return false;
            
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "name") return a.projectName.localeCompare(b.projectName);
            if (sortBy === "target") return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
            return 0;
        });

    if (loading) return <p className="p-10 font-medium text-black">Loading Dashboard...</p>;

    return (
        <>
            <div className="flex w-full min-h-screen bg-white text-black overflow-x-hidden">
                <div className="w-3/4 p-10 space-y-8 border-r border-gray-200 flex flex-col">  
                    <div className="relative shrink-0">
                        <input 
                            type="text" 
                            placeholder="Search for project" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#f3f4f6] text-[var(--main)] font-medium rounded-full py-3 px-6 outline-none border border-transparent focus:border-[var(--main)] shadow-sm"
                        />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-4 shrink-0">
                            <div className="flex gap-6">
                                <button onClick={() => setActiveTab("all")} className={`font-bold pb-2 -mb-2.5 transition-colors ${activeTab === "all" ? "text-[var(--main)] border-b-2 border-[var(--main)]" : "text-gray-400 hover:text-[var(--main)]"}`}>All projects</button>
                                <button onClick={() => setActiveTab("active")} className={`font-bold pb-2 -mb-2.5 transition-colors ${activeTab === "active" ? "text-[var(--main)] border-b-2 border-[var(--main)]" : "text-gray-400 hover:text-[var(--main)]"}`}>Active</button>
                                <button onClick={() => setActiveTab("archived")} className={`font-bold pb-2 -mb-2.5 transition-colors ${activeTab === "archived" ? "text-[var(--main)] border-b-2 border-[var(--main)]" : "text-gray-400 hover:text-[var(--main)]"}`}>Archived</button>
                            </div>

                            <div className="flex items-center gap-4">
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border border-[var(--main)] text-[var(--main)] font-bold rounded-md px-3 py-1 text-sm bg-white cursor-pointer"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="target">Sort by Target Date</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1">
                            <ProjectList projects={filteredProjects} />
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-100 shrink-0">
                            <Link 
                                href="/moderator/create-project"
                                className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
                            >
                                Create new project <span>+</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="w-1/4 bg-white flex flex-col min-h-screen bg-gray-50 border-l border-gray-200">
                    <div className="flex-1 flex flex-col h-full">
                        <div className="py-6 px-6">
                            <h2 className="font-bold text-[var(--main)] text-xl border-b border-gray-300 pb-3">Project Invites</h2>
                        </div>
                        <div className="px-6 flex-1 overflow-y-auto pb-6">
                            {invites.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <p className="text-sm font-medium">No pending invites.</p>
                                </div>
                            ) : (
                                <InvitesList invites={invites} onRespond={getAll} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
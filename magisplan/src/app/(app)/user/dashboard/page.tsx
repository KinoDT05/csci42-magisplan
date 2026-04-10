"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client'
import ProjectList from "@/components/ProjectList";
import InvitesList from "@/components/InvitesList";
interface Projects {
    targetDate: string;
    projectName: string;
    projectDescription: string;
}

interface Invites {
    committeeID: number;
    role: string;
    committeeName: string;
    projectName: string;
    projectDescription: string;
}
export default function CreateProject() {
    const [projects, setProjects] = useState<Projects[]>([]);
    const [invites, setInvites] = useState<Invites[]>([]);

    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true)


    const getProjects = async () => {

        const res = await fetch("/api/user/get-projects", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        setProjects(json.data);
    }

    const getInvites = async () => {

        const res = await fetch("/api/user/get-invites", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        setInvites(json.data);
    }

    const getAll = async () => {

        getProjects();
        getInvites();
    }

    useEffect(() => {
        const getUser = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id ?? null)
            setLoading(false)
        }

        getUser();
        getAll();
    }, [])

    
    if (loading) return <p>Loading...</p>

    return (
        <div className="min-h-screen flex">
            <div className="w-4/5 p-6">
                <h2>Projects</h2>
                <ProjectList projects={projects}  />
            </div>
            <div className="w-1/5 flex flex-col p-4">
                <h2>Invites</h2>
                <InvitesList invites={invites} onRespond={ getAll } />
            </div>
        </div>

    );

}
"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client'
import ProjectList from "@/components/ProjectList";
import InvitesList from "@/components/InvitesList";
import GoogleSetting from "@/components/GoogleSetting";
import CreateFolderTest from "@/components/CreateFolderTest";
import LogoutButton from "@/components/LogoutButton";
interface Projects {
    targetDate: string;
    projectName: string;
    projectDescription: string;
    projectID: number;
}

interface Invites {
    committeeID: number;
    role: string;
    committeeName: string;
    projectName: string;
    projectDescription: string;
}
export default function Dashboard() {
    const [projects, setProjects] = useState<Projects[]>([]);
    const [invites, setInvites] = useState<Invites[]>([]);

    const [userId, setUserId] = useState<string | null>(null);
    const [userConnection, setUserConnection] = useState(false);
    const [loading, setLoading] = useState(true)


    const getProjects = () => fetch("/api/user/get-projects").then(res => res.json());
    const getInvites = () => fetch("/api/user/get-invites").then(res => res.json());

    const getAll = async () => {
        const [projects, invites] = await Promise.all([
            getProjects(),
            getInvites()
        ]);

        setProjects(projects.data);
        setInvites(invites.data);
    };

    useEffect(() => {
        const init = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            setUserId(user?.id ?? null);

            const { data: userObj } = await supabase.from("users").select("google_connected").eq("userID", user?.id)

            await getAll();
            setLoading(false);
            setUserConnection(userObj?.[0]?.google_connected ?? false);
        };

        init();
    }, []);

    
    if (loading) return <p>Loading...</p>

    return (
        <div className="min-h-screen flex">
            <div className="w-4/5 p-6">
                <GoogleSetting isConnected={userConnection} />
                <h2>Projects</h2>
                <ProjectList projects={projects} />
                <LogoutButton/>
            </div>
            <div className="w-1/5 flex flex-col p-4">
                <h2>Invites</h2>
                <InvitesList invites={invites} onRespond={ getAll } />
            </div>
        </div>

    );

}
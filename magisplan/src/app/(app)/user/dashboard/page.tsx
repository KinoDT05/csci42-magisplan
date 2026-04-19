"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client'
import ProjectList from "@/components/ProjectList";
import InvitesList from "@/components/InvitesList";
import UserTaskList from "@/components/UserTaskList";

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

interface Task {
    taskID: number;
    taskName: string;
    hardDeadline: string;
    priority: string;
    status: string;
    projectName: string;
}

export default function CreateProject() {
    const [projects, setProjects] = useState<Projects[]>([]);
    const [invites, setInvites] = useState<Invites[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true)


    const getProjects = () => fetch("/api/user/get-projects").then(res => res.json());
    const getInvites = () => fetch("/api/user/get-invites").then(res => res.json());
    const getTasks = () => fetch("/api/user/get-my-tasks").then(res => res.json());

    const getAll = async () => {
        const [projects, invites, tasksRes] = await Promise.all([
            getProjects(),
            getInvites(),
            getTasks()
        ]);

        setProjects(projects.data);
        setInvites(invites.data);
        setTasks(tasksRes.data);
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

                <h2>My Tasks</h2>
                <UserTaskList tasks={tasks} />
            </div>
        </div>

    );

}
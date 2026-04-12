"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import Link from "next/link";

interface Task {
    taskID: number;
    taskName: string;
    committeeID: number;
    committeeName: string;
    hardDeadline: string;
    priority: string;
    status: string;
    assignedPerson: string;
    assignedUserIDs?: string[];
}

interface Project {
    projectName: string;
    projectDescription: string;
    targetDate: string;
}

export default function Dashboard() {
    const params = useParams();
    const projectID = Array.isArray(params.projectId)
        ? params.projectId[0]
        : params.projectId;
        
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    
    const [filter, setFilter] = useState<"all" | "mine">("all");
    const [userId, setUserId] = useState<string | null>(null);
    const [daysLeft, setDaysLeft] = useState<number>(0);
    
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const initUser = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id ?? null);
        };
        initUser();
    }, []);
    
    const getProject = async () => {
        const supabase = await createClient();
        const { data } = await supabase
        .from("projects")
        .select("projectName, projectDescription, targetDate")
        .eq("projectID", projectID)
        .single();
        
        setProject(data);
    };
    
    const getTasks = async () => {
        const res = await fetch(`/api/projects/${projectID}/get-tasks?filter=${filter}`);
        const data = await res.json();
        setTasks(data.data || []);
    };
    
    useEffect(() => {
        if (!project?.targetDate) return;
        
        const update = () => {
            const now = new Date();
            const target = new Date(project.targetDate);
            const diff = target.getTime() - now.getTime();
            setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
        };
        
        update();
        const i = setInterval(update, 1000 * 60 * 60);
        return () => clearInterval(i);
    }, [project]);
    
    useEffect(() => {
        if (!projectID) return;
        const init = async () => {
            await Promise.all([getProject(), getTasks()]);
            setLoading(false);
        };
        
        init();
    }, [projectID, filter]);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        };
        return new Intl.DateTimeFormat('en-GB', options).format(new Date(dateString));
    };
    
    return (
    <SidebarLayout mainClassName="!p-0">
        <div className="w-full min-h-screen bg-white text-black font-sans pb-12">
            <div className="h-24 bg-[#e6e6e6] w-full relative mb-8"></div>
            <div className="px-10 max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-baseline gap-4 mb-2">
                            <h1 className="text-[2.5rem] font-bold text-[var(--main)]">
                                {project?.projectName || "<Project Name>"}
                            </h1>
                            <p className="text-gray-500 font-serif">
                                {formatDate(project?.targetDate)}
                            </p>
                        </div>
                        <p className="text-gray-700 max-w-2xl font-serif text-[15px]">
                            {project?.projectDescription || "No description provided."}
                        </p>
                    </div>

                    {/* Countdown */}
                    <div className="flex flex-col items-center pt-2">
                        <div className="bg-[var(--accent)] text-white w-[120px] h-[120px] flex items-center justify-center text-[4rem] font-medium">
                            {daysLeft}
                        </div>
                        <p className="text-gray-600 font-serif text-sm mt-2">days left</p>
                    </div>
                </div>

                {/* Project Features */}
                <div>
                    <h2 className="text-2xl font-bold text-[var(--main)] mb-8">Project Features</h2>
                    
                    <div className="flex flex-wrap justify-center gap-x-16 gap-y-10 px-4">
                        {[
                            ["calendar", "Calendar"],
                            ["directory", "Directory"],
                            ["docs", "Document Repository"],
                            ["tasks", "Tasks"],
                            ["budget", "Budget Tracker"],
                            ["discussion", "Discussion Page"],
                        ].map(([icon, label]) => (
                            <Link
                                key={label}
                                href={`/projects/${projectID}/${icon}`}
                                className="hover:scale-105"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <img src={`/${icon}.svg`} alt={label} className="w-16 h-16 group-hover:drop-shadow-md"/>
                                    <p className="text-[var(--main)] font-bold">{label}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                
                {/* Task Filter */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-md border text-sm ${
                            filter === "all"
                                ? "bg-blue-800 text-white"
                                : "bg-white"
                        }`}
                    >
                        All Tasks
                    </button>
                    
                    <button
                        onClick={() => setFilter("mine")}
                        className={`px-4 py-2 rounded-md border text-sm ${
                            filter === "mine"
                                ? "bg-blue-800 text-white"
                                : "bg-white"
                        }`}
                    >
                        My Tasks
                    </button>
                </div>

                {/* Tasks Table */}
                <div className="space-y-4">
                    <div className="task-table-header">
                        <p>Committee</p>
                        <p>Assigned To</p>
                        <p>Task</p>
                        <p>Hard Deadline</p>
                        <p>Priority</p>
                        <p>Status</p>
                    </div>
                    
                    <div className="bg-[#ebebeb] rounded-[1.5rem] p-3 space-y-2 shadow-inner">
                        {tasks.length === 0 ? (
                            <p className="p-6 text-sm text-gray-500 text-center">No tasks found.</p>
                        ) : (
                                    tasks.map((task) => (
                            <div key={task.taskID} className="task-table-row">
                                <div>
                                    <span className="badge-pill badge-green truncate px-3">
                                        {task.committeeName}
                                    </span>
                                </div>
                                <p className="text-gray-700">{task.assignedPerson || "None"}</p>
                                <p className="text-gray-800">{task.taskName}</p>
                                <p className="text-gray-700">{task.hardDeadline ?? "None"}</p>
                                
                                <div>
                                    <span className={`badge-pill ${
                                        task.priority === "High" ? "badge-red" : 
                                        task.priority === "Medium" ? "badge-yellow" : "badge-green"
                                        }`}>
                                            {task.priority}
                                    </span>
                                </div>
                                
                                <div>
                                    <span className={`badge-pill ${
                                        task.status === "NotStarted" ? "badge-red" : "badge-gray"
                                        }`}>
                                            {task.status === "NotStarted" ? "NOT STARTED" : task.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    </div>
                </div>
            </div>
        </div>
    </SidebarLayout>
    );
}
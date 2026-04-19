"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Committee {
    name: string;
    permissions: string;
}

export default function CreateProjectPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const today = new Date().toISOString().split('T')[0];

    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDesc] = useState("");
    const [startDate, setStartDate] = useState(today);
    const [targetDate, setTargetDate] = useState("");
    const [creatorName, setCreatorName] = useState("");
    const [committees, setCommittees] = useState<Committee[]>([{ name: "", permissions: "" }]);

    useEffect(() => {
        const getUser = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id ?? null);
        };
        getUser();
    }, []);

    const handleCommitteeChange = (index: number, value: string) => {
        setCommittees((prev) => {
            const updated = [...prev];
            updated[index].name = value;
            return updated;
        });
    };

    const addCommittee = () => setCommittees((prev) => [...prev, { name: "", permissions: "" }]);

    const removeCommittee = (indexToRemove: number) => {
        setCommittees((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/projects/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectName,
                    projectDescription,
                    startDate, 
                    targetDate,
                    userID: userId,
                    committees,
                    modDisplayName: creatorName
                }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || "Failed to create project");
            } else {
                router.push("/user/dashboard");
            }
        } catch (err) {
            setError("A network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="w-full min-h-screen p-10 font-sans flex justify-center items-start">        
                <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-4xl mt-8">
                    <div className="mb-10 border-b border-gray-200 pb-6">
                        <h1 className="text-4xl font-bold text-[var(--main)]">Create a new project</h1>
                        <p className="text-gray-500 mt-2">Set up your workspace, timeline, and committees.</p>
                    </div>

                    {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 font-medium">{error}</div>}

                    <form onSubmit={handleCreate} className="space-y-12">
    
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center shrink-0">
                                <div className="w-10 h-10 rounded-full bg-[var(--main)] text-white flex items-center justify-center font-bold">1</div>
                            </div>
                            <div className="flex-1 space-y-5 w-full">
                                <h3 className="text-2xl font-bold text-[var(--main)]">General</h3>
                                
                                <div className="flex flex-col w-full max-w-2xl">
                                    <label className="text-sm font-bold text-[var(--main)] mb-1.5">Project Name</label>
                                    <input required value={projectName} onChange={e => setProjectName(e.target.value)} className="border border-gray-300 p-3 rounded-lg focus:border-[var(--main)] outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="Project Name" />
                                </div>
                                
                                <div className="flex flex-col w-full max-w-2xl">
                                    <label className="text-sm font-bold text-[var(--main)] mb-1.5">Project Description</label>
                                    <textarea required rows={4} value={projectDescription} onChange={e => setProjectDesc(e.target.value)} className="border border-gray-300 p-3 rounded-lg resize-none focus:border-[var(--main)] outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="What is this project about?" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex flex-col items-center shrink-0">
                                <div className="w-10 h-10 rounded-full bg-[var(--main)] text-white flex items-center justify-center font-bold">2</div>
                            </div>
                            <div className="flex-1 space-y-6 w-full">
                                <h3 className="text-2xl font-bold text-[var(--main)]">Configuration</h3>
                                
                                <div className="flex flex-col w-full max-w-xl">
                                    <label className="text-sm font-bold text-[var(--main)] mb-1.5">Display Name</label>
                                    <input required placeholder="Your display name for the project" value={creatorName} onChange={e => setCreatorName(e.target.value)} className="border border-gray-300 p-3 rounded-lg focus:border-[var(--main)] outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                                </div>

                                <div className="max-w-xl">
                                    <label className="text-sm font-bold text-[var(--main)] mb-1.5 block">Timeline</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-gray-50 w-1/2 focus-within:border-[var(--main)] transition-all">
                                            <span className="text-sm px-4 py-3 font-bold text-[var(--main)] border-r border-gray-300 bg-gray-100">From</span>
                                            <input type="date" value={startDate} readOnly className="w-full text-sm outline-none px-3 text-gray-500 bg-transparent cursor-not-allowed" />
                                        </div>
                                        <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-gray-50 w-1/2 hover:bg-white focus-within:bg-white focus-within:border-[var(--main)] transition-all">
                                            <span className="text-sm px-4 py-3 font-bold text-[var(--main)] border-r border-gray-300 bg-gray-100">To</span>
                                            <input required type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full text-sm outline-none px-3 text-[var(--main)] bg-transparent" />
                                        </div>
                                    </div>
                                </div>

                                <div className="max-w-2xl">
                                    <label className="text-sm font-bold text-[var(--main)] mb-1.5 block">Project Committees</label>
                                    <div className="space-y-3 w-full p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        {committees.map((committee, index) => (
                                        <div key={index} className="flex gap-3 items-center w-full">
                                            <input 
                                                placeholder="Committee Name (e.g. Secretariat)" 
                                                value={committee.name} 
                                                onChange={(e) => handleCommitteeChange(index, e.target.value)} 
                                                className="border border-gray-300 p-2.5 rounded-md flex-1 focus:border-[var(--main)] outline-none min-w-0 bg-white" 
                                                required 
                                            />
                                            
                                            {committees.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeCommittee(index)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 shrink-0"
                                                    title="Remove committee"
                                                >
                                                    ✕
                                                </button>
                                            )}

                                            {index === committees.length - 1 && (
                                                <button type="button" onClick={addCommittee} className="bg-[var(--main)] text-white px-4 py-2.5 rounded-md text-sm font-bold hover:opacity-90 shrink-0">
                                                    Add more
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                
                                <p className="text-sm font-serif text-gray-500 italic flex items-center gap-2">
                                    NOTE: Creating this project will automatically create a folder in your Google Drive
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-4 pt-8 border-t border-gray-200">
                            <button type="button" onClick={() => router.push("/user/dashboard")} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="bg-[var(--accent)] text-white px-10 py-3 rounded-lg font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 text-lg">
                                {isSubmitting ? "Creating..." : "Create project"}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </>
    );
}
"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client'
import LogoutButton from "@/components/LogoutButton";
interface Committee {
    name: string;
    permissions: string;
}

export default function CreateProject() {

    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDesc] = useState("");
    const [startDate, setStartDate] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [driveLink, setDriveLink] = useState("");
    const [numCommittees, setNumCommittees] = useState(1);
    const [committees, setCommittees] = useState<Committee[]>(
        Array.from({ length: numCommittees }, () => ({ name: "", permissions: "" }))
    );
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("");
    const [creatorName, setCreatorName] = useState("");

    useEffect(() => {
        const getUser = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id ?? null)
            setLoading(false)
        }

        getUser()
    }, [])

    const handleNumCommitteesChange = (n: number) => {
        setNumCommittees(n);

        setCommittees((prev) => {
            const newCommittees = [...prev];
            if (n > prev.length) {
                for (let i = prev.length; i < n; i++) {
                    newCommittees.push({ name: "", permissions: "" });
                }
            } else {
                newCommittees.length = n;
            }
            return newCommittees;
        });
    };

    const handleCommitteeChange = (index: number, field: keyof Committee, value: string) => {
        setCommittees((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch("/api/projects/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectName,
                projectDescription,
                startDate,
                targetDate,
                driveLink,
                userID: userId,
                committees,
                modDisplayName: creatorName
            }),
        });

        const data = await res.json();
        setMessage(data.error || data.message);
    }

    if (loading) return <p>Loading...</p>

    return (
        <div className="min-h-screen flex">

            <div className="w-1/2 flex justify-center items-center text-center">
                <form onSubmit={handleCreate} className="p-8 w-96 space-y-4">
                    <h2 className="text-2xl font-semibold text-center mb-4">
                        Sign Up
                    </h2>

                    <input className="input-field" placeholder="Project Name" value={projectName} onChange={e => setProjectName(e.target.value)} />
                    <input className="input-field" placeholder="Project Description" value={projectDescription} onChange={e => setProjectDesc(e.target.value)} />
                    <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <input type="date" className="input-field" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                    <input className="input-field" placeholder="Insert drive link (Optional)" value={driveLink} onChange={e => setDriveLink(e.target.value)} />
                    <label>
                        Number of Committees:
                        <input
                            type="number"
                            min={1}
                            value={numCommittees}
                            onChange={(e) => handleNumCommitteesChange(Number(e.target.value))}
                        />
                    </label>

                    {committees.map((committee, index) => (
                        <div key={index}>
                            <input
                                placeholder={`Committee ${index + 1} Name`}
                                value={committee.name}
                                onChange={(e) => handleCommitteeChange(index, "name", e.target.value)}
                            />
                            <input
                                placeholder={`Committee ${index + 1} Permissions`}
                                value={committee.permissions}
                                onChange={(e) => handleCommitteeChange(index, "permissions", e.target.value)}
                            />
                        </div>
                    ))}

                    <input className="input-field" placeholder="Your display name for the Project" value={creatorName} onChange={e => setCreatorName(e.target.value)} />

                    <button type="submit" className="btn-primary">Create Project</button>

                    {message && (
                        <p className="text-center text-sm text-red-500">
                            {message}
                        </p>
                    )}
                </form>
            </div>
            <LogoutButton />
        </div>
    );

}
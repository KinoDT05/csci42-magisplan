"use client";

import { useState, useEffect, use } from "react";
import { createClient } from '@/lib/supabase/client'
import LogoutButton from "@/components/LogoutButton";
interface Committee {
    name: string;
    permissions: string;
}
interface Invite {
    email: string;
    committee: number;
    role: string;
}

export default function CreateProject({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [committees, setCommittees] = useState([]);
    const [numInvites, setNumInvites] = useState(1);
    const [invites, setInvites] = useState<Invite[]>(
        Array.from({ length: numInvites }, () => ({ email: "", committee: 0, role: "" }))
    );


    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true)


    const [message, setMessage] = useState("");
    
    useEffect(() => {
        const supabase = createClient();
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id ?? null)
            setLoading(false)
        }

        const fetchCommittees = async () => {
            const { data, error } = await supabase
                .from("committee")
                .select("committeeID, committeeName")
                .eq("projectID", projectId);

            if (!error) {
                setCommittees(data);
            }
        };

        fetchCommittees();
        getUser()
    }, [])

    const handleNumInviteChange = (n: number) => {
        setNumInvites(n);

        setInvites((prev) => {
            const newInvite = [...prev];
            if (n > prev.length) {
                for (let i = prev.length; i < n; i++) {
                    newInvite.push({ email: "", committee: 0, role: "" });
                }
            } else {
                newInvite.length = n;
            }
            return newInvite;
        });
    };

    const handleInviteChange = (
        index: number,
        field: keyof Invite,
        value: string
    ) => {
        setInvites((prev) => {
            const updated = [...prev];

            updated[index][field] =
                field === "committee" ? Number(value) : value;

            return updated;
        });
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch(`/api/projects/${projectId}/add-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                invites
            }),
        });

        const data = await res.json();
        setMessage(data.error || data.message);
    }

    if (loading) return <p>Loading...</p>

    return (
        <div className="min-h-screen flex">

            <div className="w-1/2 flex justify-center items-center text-center">
                <form onSubmit={handleInvite} className="p-8 w-96 space-y-4">
                    <h2 className="text-2xl font-semibold text-center mb-4">
                        Add members to project
                    </h2>
                 
                    <label>
                        Number of Invites:
                        <input
                            type="number"
                            min={1}
                            value={numInvites}
                            onChange={(e) => handleNumInviteChange(Number(e.target.value))}
                        />
                    </label>

                    {invites.map((invite, index) => (
                        <div key={index} className="space-y-2 border p-2">

                            {/* Email input */}
                            <input
                                type="email"
                                required
                                placeholder={`Email ${index + 1}`}
                                value={invite.email}
                                onChange={(e) =>
                                    handleInviteChange(index, "email", e.target.value)
                                }
                            />

                            {/* Committee dropdown */}
                            <select
                                required
                                value={invite.committee}
                                onChange={(e) =>
                                    handleInviteChange(index, "committee", e.target.value)
                                }
                            >
                                <option value="">Select committee</option>

                                {committees.map((committee: any) => (
                                    <option
                                        key={committee.committeeID}
                                        value={committee.committeeID}
                                    >
                                        {committee.committeeName}
                                    </option>
                                ))}
                            </select>

                            <select
                                required
                                value={invite.role}
                                onChange={(e) =>
                                    handleInviteChange(index, "role", e.target.value)
                                }
                            >
                                <option value="">Select committee</option>
                                    <option key="Head" value="Head">
                                        Head
                                    </option>
                                <option key="Member" value="Member">
                                    Member
                                </option>
                            </select>

                        </div>
                    ))}
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
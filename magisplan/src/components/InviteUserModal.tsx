"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import Modal from "@/components/Modal";

interface Committee {
    committeeID: number;
    committeeName: string;
}

interface Invite {
    email: string;
    committee: number | string;
    role: string;
}

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | number;
    onRefresh?: () => void;
}

export default function InviteUserModal({ isOpen, onClose, projectId, onRefresh }: InviteUserModalProps) {
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [invites, setInvites] = useState<Invite[]>([{ email: "", committee: "", role: "" }]);
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchCommittees = async () => {
            setLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("committee")
                    .select("committeeID, committeeName")
                    .eq("projectID", projectId);

                if (!error && data) {
                    setCommittees(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCommittees();
        setInvites([{ email: "", committee: "", role: "" }]);
        setMessage(null);
    }, [isOpen, projectId]);

    const handleInviteChange = (index: number, field: keyof Invite, value: string) => {
        setInvites((prev) => {
            const updated = [...prev];
            updated[index][field] = field === "committee" ? Number(value) : value;
            return updated;
        });
    };

    const addInvite = () => {
        setInvites((prev) => [...prev, { email: "", committee: "", role: "" }]);
    };

    const removeInvite = (indexToRemove: number) => {
        setInvites((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/projects/${projectId}/add-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invites }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                setMessage({ text: data.error || "Failed to send invites.", type: "error" });
            } else {
                setMessage({ text: data.message || "Invites sent successfully!", type: "success" });
                if (onRefresh) onRefresh();

                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (err) {
            setMessage({ text: "A network error occurred.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--main)] tracking-tight">Invite Members</h2>
                <p className="text-gray-500 text-sm mt-1">Add new members to your project committees.</p>
            </div>

            {message && (
                <div className={`p-3 rounded-md mb-4 text-sm font-medium ${
                    message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="py-10 text-center text-gray-500 font-medium">Loading committees...</div>
            ) : (
                <form onSubmit={handleInviteSubmit} className="space-y-6">
                    
                    <div className="space-y-3">
                        {invites.map((invite, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                
                                {/* Email Input */}
                                <input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    value={invite.email}
                                    onChange={(e) => handleInviteChange(index, "email", e.target.value)}
                                    className="flex-1 border border-gray-300 p-2.5 rounded-md focus:border-[var(--main)] focus:ring-1 focus:ring-[var(--main)] outline-none min-w-0 w-full bg-white text-sm"
                                />

                                {/* Committee Dropdown */}
                                <select
                                    required
                                    value={invite.committee}
                                    onChange={(e) => handleInviteChange(index, "committee", e.target.value)}
                                    className="w-full sm:w-1/3 border border-gray-300 p-2.5 rounded-md focus:border-[var(--main)] focus:ring-1 focus:ring-[var(--main)] outline-none bg-white text-sm cursor-pointer"
                                >
                                    <option value="" disabled>Committee</option>
                                    {committees.map((committee) => (
                                        <option key={committee.committeeID} value={committee.committeeID}>
                                            {committee.committeeName}
                                        </option>
                                    ))}
                                </select>

                                {/* Role Dropdown */}
                                <select
                                    required
                                    value={invite.role}
                                    onChange={(e) => handleInviteChange(index, "role", e.target.value)}
                                    className="w-full sm:w-1/4 border border-gray-300 p-2.5 rounded-md focus:border-[var(--main)] focus:ring-1 focus:ring-[var(--main)] outline-none bg-white text-sm cursor-pointer"
                                >
                                    <option value="" disabled>Role</option>
                                    <option value="Head">Head</option>
                                    <option value="Member">Member</option>
                                </select>

                                {/* Delete Button */}
                                {invites.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeInvite(index)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 rounded-md transition-colors shrink-0"
                                        title="Remove invite"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add More */}
                    <div>
                        <button 
                            type="button" 
                            onClick={addInvite} 
                            className="text-[var(--main)] font-bold text-sm hover:underline flex items-center gap-1"
                        >
                            <span>+</span> Add another invite
                        </button>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="bg-[var(--accent)] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 text-sm"
                        >
                            {isSubmitting ? "Sending..." : "Send Invites"}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
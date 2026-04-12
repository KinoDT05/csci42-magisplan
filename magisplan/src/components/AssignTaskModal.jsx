"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { useParams } from "next/navigation";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
export default function AssignTaskModal({ taskID, taskName, manpowerRequired, committeeID, onRefresh }) {
    const router = useRouter();
    const params = useParams();
    const projectID = params.projectId;
    const [isOpen, setIsOpen] = useState(false);
    const [committeeMembers, setCommitteeMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [showResponse, setShowResponse] = useState(false);
    const [responseStatus, setResponseStatus] = useState({ success: true, message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleUser = (userID) => {
        setSelectedUsers((prev) =>
            prev.includes(userID)
                ? prev.filter((id) => id !== userID)
                : [...prev, userID]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const results = await Promise.all(
                selectedUsers.map((userID) =>
                    fetch(`/api/projects/${projectID}/assign-task`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            taskID,
                            userID,
                            projectID,
                        }),
                    }).then((res) => res.json())
                )
            );

            const hasError = results.some((r) => r.error);

            if (hasError) {
                setResponseStatus({ success: false, message: "Some assignments failed." });
            } else {
                setResponseStatus({ success: true, message: "Task assigned successfully!" });
                setIsOpen(false);
                setSelectedUsers([]);
                onRefresh();
            }
        } catch (err) {
            console.log(err);
            setResponseStatus({ success: false, message: "A network error occurred." });
        } finally {
            setIsSubmitting(false);
            setShowResponse(true);
            
        }
    };


    useEffect(() => {
        if (!committeeID || !projectID) return;
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/projects/${projectID}/get-committee-members?committee=${committeeID}`);
                const json = await res.json();
                setCommitteeMembers(json.data || []);
                console.log(json.data)
            } catch (err) {
                console.error("Member fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [committeeID, projectID]);

    return (
        <div>
            <button
                className="bg-[var(--main)] rounded-lg p-1 text-white"
                onClick={() => setIsOpen(true)}
            >
                Assign
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Assign: ${taskName}`}>
                <form onSubmit={handleSubmit} className="p-8 w-96 space-y-4">
                    <p className="text-sm text-gray-500">
                        Select up to {manpowerRequired} member(s) to assign.
                    </p>

                    {loading ? (
                        <p className="text-sm text-gray-400">Loading members...</p>
                    ) : committeeMembers.length === 0 ? (
                        <p className="text-sm text-gray-400">No members found.</p>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                            {committeeMembers.map((member) => (
                                <label
                                    key={member.userID}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(member.userID)}
                                        onChange={() => handleToggleUser(member.userID)}
                                        disabled={
                                            !selectedUsers.includes(member.userID) &&
                                            selectedUsers.length >= manpowerRequired
                                        }
                                    />
                                    <span>{member.firstName} {member.lastName}</span>
                                    <span className="text-gray-400 text-xs">@{member.username}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    <button
                        disabled={isSubmitting || selectedUsers.length === 0}
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isSubmitting ? "Assigning..." : "Assign Task"}
                    </button>
                </form>
            </Modal>

            <Modal isOpen={showResponse} onClose={() => setShowResponse(false)} title="Notification">
                <div className="p-8 w-80 text-center space-y-4">
                    <p className={`text-lg font-semibold ${responseStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                        {responseStatus.success ? "Success!" : "Error!"}
                    </p>
                    <p className="text-gray-600">{responseStatus.message}</p>
                    <button
                        onClick={() => setShowResponse(false)}
                        className="w-full bg-gray-800 text-white py-2 rounded"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
}
"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { useParams } from "next/navigation";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
export default function UpdateTaskModal({ taskID, taskStatus, taskName, userRole, userComm, onRefresh }) {
    const params = useParams();
    const projectID = params.projectId;
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState("");

    const isModerator = userComm === "Moderators";
    const isHead = userRole === "Head";

    const tierMap = {
        "NotStarted": 0,
        "OnGoing": 0,
        "ForChecking": 1,
        "CommentsByHead": 1,
        "AddressedHeadComments": 1,
        "ApprovedByHead": 2,
        "CommentsByMod": 2,
        "AddressedModComments": 2,
        "ApprovedByMod": 3,
        "Complete": 4,
    };

    const tier = tierMap[taskStatus] ?? 0;

    const [showResponse, setShowResponse] = useState(false);
    const [responseStatus, setResponseStatus] = useState({ success: true, message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (tier === 3) {
                setStatus("Complete");
            } else if (tier === 2 && isModerator) {
                setStatus("CommentsByMod");
            } else if (tier === 1 && (isHead || isModerator)) {
                setStatus("CommentsByHead");
            } else if (tier <= 0) {
                setStatus("NotStarted");
            } else {
                setStatus("");
            }
        }
    }, [isOpen, tier, isHead, isModerator]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            console.log("Updating task:", { taskID, status });
            const res = await fetch(`/api/projects/${projectID}/update-task`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskID, status }),
            });

            const result = await res.json();
            if (res.ok) {
                setResponseStatus({ success: true, message: "Task assigned successfully!" });
                setIsOpen(false);
                onRefresh();
            } else {
                setResponseStatus({ success: false, message: "Failed to update task." });
            }
        } catch (err) {
            console.log(err);
            setResponseStatus({ success: false, message: "A network error occurred." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <button
                className="bg-[var(--main)] rounded-lg p-1 text-white"
                onClick={() => setIsOpen(true)}
            >
                Update
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Update: ${taskName}`}>
                <form onSubmit={handleSubmit} className="p-8 w-96 space-y-4">
                    
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="border rounded-lg p-2"
                        >
                            {/* Tier 0 */}
                            {tier <= 0 && <option value="NotStarted">Not Started</option>}
                            {tier <= 0 && <option value="OnGoing">On Going</option>}

                            {/* Tier 0 and 1 */}
                            {tier <= 0 && <option value="ForChecking">For Checking</option>}

                            {/* Tier 1 - Head and Moderator only */}
                            {tier === 1 && (isModerator || isHead) && (
                                <option value="CommentsByHead">Comments by Head</option>
                            )}
                            {tier === 1 && taskStatus === "CommentsByHead" && (
                                <option value="AddressedHeadComments">Addressed Head Comments</option>
                            )}

                            {/* Tier 1 -> 2 - Head and Moderator only */}
                            {tier === 1 && (isModerator || isHead) && (
                                <option value="ApprovedByHead">Approved by Head</option>
                            )}

                            {/* Tier 2 - Moderator only */}
                            {tier === 2 && isModerator && (
                                <option value="CommentsByMod">Comments by Moderator</option>
                            )}
                            {tier === 2 && (isModerator || isHead || taskStatus === "CommentsByMod") && (
                                <option value="AddressedModComments">Addressed Moderator Comments</option>
                            )}

                            {/* Tier 2 -> 3 - Moderator only */}
                            {tier === 2 && isModerator && (
                                <option value="ApprovedByMod">Approved by Moderator</option>
                            )}

                            {/* Tier 3 - Anyone if approved by mod */}
                            {tier === 3 && (
                                <option value="Complete">Complete</option>
                            )}
                        </select>
                        </div>
                  

                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isSubmitting ? "Updating..." : "Update Task"}
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
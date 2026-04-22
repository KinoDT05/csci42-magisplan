"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client'
import { useParams } from "next/navigation";
import Modal from "@/components/Modal";

export default function AddTaskModal({ committeeOfAdder, onRefresh }) {
    const params = useParams();
    const projectID = params.projectId;
    const [isOpen, setIsOpen] = useState(false);
    const [committees, setCommittees] = useState([]);
    const [loading, setLoading] = useState(true)

    const [showResponse, setShowResponse] = useState(false);
    const [responseStatus, setResponseStatus] = useState({ success: true, message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        taskName: "",
        committeeID: -1,
        softDeadline: "",
        hardDeadline: "",
        hasBlastDate: false,
        blastDate: "",
        priority: "",
        manpowerRequired: 1,
        documentType: "none"
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault(); // Prevent page refresh
        setIsSubmitting(true);

        const soft = new Date(form.softDeadline);
        const hard = new Date(form.hardDeadline);

        if (hard < soft) {
            setResponseStatus({
                success: false,
                message: "Error: The Hard Deadline must be after the Soft Deadline."
            });
            setShowResponse(true);
            return; // Stop the function here
        }

        try {
            const response = await fetch(`/api/projects/${projectID}/create-task`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    projectID: projectID 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setResponseStatus({ success: true, message: "Task created successfully!" });
                setIsOpen(false);
                onRefresh();// Close the input modal
            } else {
                setResponseStatus({ success: false, message: result.error || "Failed to create task." });
            }
        } catch (err) {
            setResponseStatus({ success: false, message: "A network error occurred." });
        } finally {
            setIsSubmitting(false);
            setShowResponse(true); // Open the response modal
        }
    }

    useEffect(() => {
        const supabase = createClient();
        
        const init = async () => {
            try {
                if (committeeOfAdder == "Moderators") {
                    const [committeeRes] = await Promise.all([
                        supabase
                            .from("committee")
                            .select("committeeID, committeeName")
                            .eq("projectID", projectID)
                    ]);

                    if (!committeeRes.error) {
                        setCommittees(committeeRes.data);
                    }
                } else {
                    const [committeeRes] = await Promise.all([
                        supabase
                            .from("committee")
                            .select("committeeID, committeeName")
                            .eq("projectID", projectID)
                            .eq("committeeName", committeeOfAdder)
                    ]);

                    console.log(committeeRes.data)

                    if (!committeeRes.error) {
                        setCommittees(committeeRes.data);
                    }
                }
                

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [committeeOfAdder]);

    return (
        <div>
            <button
                className="bg-[var(--main)] btn-primary"
                onClick={() => setIsOpen(true)}
            >
                Create Task
            </button>
            
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Tasks">
                <form onSubmit={handleSubmit} className="p-8 w-96 space-y-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Task Name</label>
                        <input name="taskName" value={form.taskName} onChange={handleChange} className="border p-2 rounded" type="text" required />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Committee</label>
                        <select name="committeeID" value={form.committeeID} onChange={handleChange} className="border p-2 rounded" required>
                            <option value="">Select committee</option>
                            {committees.map((c) => (
                                <option key={c.committeeID} value={c.committeeID}>{c.committeeName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium">Soft Deadline</label>
                            <input name="softDeadline" value={form.softDeadline} onChange={handleChange} className="border p-2 rounded" type="date" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-red-500">Hard Deadline</label>
                            <input name="hardDeadline" value={form.hardDeadline} onChange={handleChange} className="border p-2 rounded border-red-200" type="date" required />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Has Blast Date?</label>
                        <select
                            name="hasBlastDate"
                            value={form.hasBlastDate ? "yes" : "no"}
                            onChange={(e) => setForm(p => ({ ...p, hasBlastDate: e.target.value === "yes" }))}
                            className="border p-2 rounded"
                        >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                        </select>
                    </div>

                    {form.hasBlastDate && (
                        <div className="flex flex-col">
                            <label className="text-sm font-medium">Blast Date</label>
                            <input name="blastDate" value={form.blastDate} onChange={handleChange} className="border p-2 rounded" type="date" />
                        </div>
                    )}

                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Priority</label>
                        <select name="priority" value={form.priority} onChange={handleChange} className="border p-2 rounded" required>
                            <option value="">Select Priority</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Manpower Required</label>
                        <input name="manpowerRequired" type="number" className="border p-2 rounded" min={1} value={form.manpowerRequired} onChange={handleChange} />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Document Needed</label>
                        <select name="documentType" value={form.documentType} onChange={handleChange} className="border p-2 rounded" required>
                            <option value="none">None</option>
                            <option value="doc">Docs</option>
                            <option value="sheet">Sheets</option>
                            <option value="slide">Slides</option>
                        </select>
                    </div>

                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isSubmitting ? "Processing..." : "Create Task"}
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
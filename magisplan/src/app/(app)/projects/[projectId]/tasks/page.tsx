"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { useParams } from "next/navigation";
import AddTaskModal from "@/components/AddTaskModal";

export default function TaskPage() {
    const params = useParams();
    const projectID = params.projectId;
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [committeeOfUser, setCommitteeOfUser] = useState(null);
    const [committees, setCommittees] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [committeeTask, setCommitteeTask] = useState("");

    // 1. Initial Load: User data and Committee list
    useEffect(() => {
        const supabase = createClient();
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from("project_members")
                    .select(`committee ( committeeName )`)
                    .eq("userID", user.id)
                    .eq("projectID", projectID)
                    .single();

                if (data) setCommitteeOfUser(data.committee.committeeName);

                const { data: committeeData, error } = await supabase
                    .from("committee")
                    .select("committeeID, committeeName")
                    .eq("projectID", projectID);

                if (!error) setCommittees(committeeData);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [projectID]);

    // 2. Task Fetching: Runs when projectID or committeeTask changes
    useEffect(() => {
        if (!projectID) return;
        const fetchTasks = async () => {
            setTasksLoading(true);
            try {
                const res = await fetch(`/api/projects/${projectID}/get-tasks?committee=${committeeTask}`);
                const json = await res.json();
                setTasks(json.data || []);
            } catch (err) {
                console.error("Task fetch error:", err);
            } finally {
                setTasksLoading(false);
            }
        };
        fetchTasks();
    }, [projectID, committeeTask]); 

    return (
        <div>
            {!loading && committeeOfUser && (
                <AddTaskModal committeeOfAdder={committeeOfUser} />
            )}

            <select
                value={committeeTask}
                onChange={(e) => setCommitteeTask(e.target.value)}
            >
                <option value="">All</option>
                {committees.map((committee) => (
                    <option key={committee.committeeID} value={committee.committeeID}>
                        {committee.committeeName}
                    </option>
                ))}
            </select>

            {tasksLoading ? (
                <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
                <p>No tasks found.</p>
                ) : (

                // can you like make this a component because i still need to add more backend stuff to it 
                tasks.map((task) => (
                    <div key={task.taskID}>
                        <h3>{task.taskName}</h3>
                        <p>Status: {task.status}</p>
                        <p>Priority: {task.priority}</p>
                        <p>Assigned To: {task.assignedPerson}</p>
                        <p>Soft Deadline: {task.softDeadline ?? "None"}</p>
                        <p>Hard Deadline: {task.hardDeadline ?? "None"}</p>
                        <p>Blast Date: {task.blastDate}</p>
                    </div>
                ))
            )}
        </div>
    );
}

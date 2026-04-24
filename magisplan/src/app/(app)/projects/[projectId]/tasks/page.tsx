"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from '@/lib/supabase/client';
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"
import AddTaskModal from "@/components/AddTaskModal";
import TaskCard from "@/components/TaskCard";
import DashboardButton from "@/components/BackToDashboard";

export default function TaskPage() {
    const params = useParams();
    const projectID = params.projectId;
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [committeeOfUser, setCommitteeOfUser] = useState(null);
    const [roleOfUser, setRoleOfUser] = useState("");
    const [committees, setCommittees] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [committeeTask, setCommitteeTask] = useState("");
    const [userID, setUserID] = useState("");
    const [projectName, setProjectName] = useState(""); 
    const [canEdit, setCanEdit] = useState(false); 
    // get project name
    useEffect(() => {
        const fetchProject = async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("projectName")
                .eq("projectID", projectID)
                .single();
            
            if (error) {
                console.error(error);
            } else {
                setProjectName(data.projectName);
            }
        };

        fetchProject();
    }, [projectID]);

    // 1. Initial Load: User data and Committee list
    useEffect(() => {
        const supabase = createClient();
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from("project_members")
                    .select(`committee ( committeeName ), role`)
                    .eq("userID", user.id)
                    .eq("projectID", projectID)
                    .single();

                if (data) {
                    setCommitteeOfUser(data.committee.committeeName);

                    setRoleOfUser(data.role);

                    if (data.role === "Head" || data.committee.committeeName === "Moderators") {
                        setCanEdit(true);
                    }

                    setUserID(user.id)
                } 

                const { data: committeeData, error } = await supabase
                    .from("committee")
                    .select("committeeID, committeeName")
                    .eq("projectID", projectID);
                console.log(committeeData)
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
    const fetchTasks = useCallback(async () => {
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
    }, [projectID, committeeTask]);

    useEffect(() => {
        if (!projectID) return;
        fetchTasks();
    }, [projectID, committeeTask, fetchTasks]);
 

    return (
        <div className="bg-white w-ful min-h-screen -mx-8 -my-4 p-7">

            <div className="text-5xl font-semibold text-[var(--main)] mb-7">
                <DashboardButton projectID={projectID} />
                {projectName} Tasks Page
            </div>

            {/* create task and filtering */}
            <div className="flex my-5">
                {!loading && canEdit && committeeOfUser && (
                    <AddTaskModal committeeOfAdder={committeeOfUser} onRefresh={fetchTasks} />
                )}

                <select
                    value={committeeTask}
                    onChange={(e) => setCommitteeTask(e.target.value)} className="border px-2 text-[var(--main)] ml-auto font-bold"
                >
                    <option value="">All</option>
                    {committees.map((committee) => (
                        <option key={committee.committeeID} value={committee.committeeID}>
                            {committee.committeeName}
                        </option>
                    ))}
                </select>
            </div>
            
            {/* header */}
            <div className="task-table-header grid-cols-8 mb-3">
                <div>Task</div>
                <div>Assigned To</div>
                <div>Soft Deadline</div>
                <div>Hard Deadline</div>
                <div>Blast Date</div>
                <div>Priority</div>
                <div>Status</div>
                <div>Edit</div>
            </div>
            
            {/* task details */}
            <div className="bg-[#ebebeb] rounded-[1.5rem] p-3 space-y-2 shadow-inner">
                {tasksLoading ? (
                    <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks found.</p>
                    ) : (

                            tasks.map((task, index) => (
                                <TaskCard key={task.taskID} task={task} num={index} userRole={roleOfUser} userComm={committeeOfUser} userID={userID } onRefresh={fetchTasks} />
                    ))
                )}
            </div>
            
        </div>
    );
}

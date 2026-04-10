"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client'
import { useParams } from "next/navigation";
import AddTaskModal from "@/components/AddTaskModal";

export default function tasks() {
    const params = useParams();
    const projectID = params.projectId;
    const [loading, setLoading] = useState(true);
    const [committeeOfUser, setCommitteeOfUser] = useState(null);

    useEffect(() => {
        const supabase = createClient();

        const init = async () => {
            try {
                console.log("Effect is running!");
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                const { data, error } = await supabase
                    .from("project_members")
                    .select(`
                        committee (
                          committeeName
                        )
                      `)
                    .eq("userID", user.id)
                    .eq("projectID", projectID)
                    .single();

                if (data) {
                    setCommitteeOfUser(data.committee.committeeName);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [projectID]);

    return (
        <div>
            
            {!loading && committeeOfUser && (
                <AddTaskModal committeeOfAdder={committeeOfUser} />
            )}
        </div>
    );
}
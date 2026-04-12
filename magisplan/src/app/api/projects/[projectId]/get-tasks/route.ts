import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    
    const supabase = await createClient();
    
    const { searchParams } = new URL(req.url);
    const { projectId: projectIdStr } = await params;
    const projectID = Number(projectIdStr);

    if (isNaN(projectID)) {
        throw new Error("Invalid projectId");
    }

    const committee = searchParams.get('committee');
    const committeeID = committee ? Number(committee) : null;

    let taskData = null;

    if (committeeID) {
        console.log("yes");
        const { data, error } = await supabase
            .from("tasks")
            .select(`
            taskID,
            taskName,
            committeeID,
            projectID,
            softDeadline,
            hardDeadline,
            blastDate,
            priority,
            status,
            tasks_assignment (
              userID,
              users (
                userID,
                firstName,
                lastName,
                username
              )
            )
          `)
            .eq("projectID", projectID)
            .eq("committeeID", committeeID);

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        taskData = data;
    } else {
        console.log("no");
        const { data, error } = await supabase
            .from("tasks")
            .select(`
            taskID,
            taskName,
            committeeID,
            projectID,
            softDeadline,
            hardDeadline,
            blastDate,
            priority,
            status,
            tasks_assignment (
              userID,
              users (
                userID,
                firstName,
                lastName,
                username
              )
            )
          `)
            .eq("projectID", projectID);

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        taskData = data;
    }
    
    const mapped = taskData?.map(task => {
        const assignedUsers = task.tasks_assignment?.length
            ? task.tasks_assignment.map(ta => ta.users)
            : [];
            
        const names = assignedUsers.length
            ? assignedUsers
                .map(user => user ? `${user.firstName} ${user.lastName}` : null)
                .filter(Boolean)
                .join(", ")
            : "None";
        
        const userIDs = task.tasks_assignment?.length
            ? task.tasks_assignment.map(ta => ta.userID)
            : [];
        
        const { tasks_assignment, ...rest } = task;
        
        return {
            ...rest,
            blastDate: rest.blastDate ?? "None",
            assignedPerson: names,
            assignedUserIDs: userIDs
        };
    });

    
    return new Response(
        JSON.stringify({ data: mapped }),
        { status: 201 }
    );
}

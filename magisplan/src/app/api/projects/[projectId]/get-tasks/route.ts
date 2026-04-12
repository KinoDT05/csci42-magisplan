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

    const userID = searchParams.get('userID');
    let taskData = null;

    if (userID) {
        if (userID == "All") {
            const { data, error } = await supabase
                .from("tasks")
                .select(`
                    taskName,
                    hardDeadline,
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
                    committee (
                        committeeName
                    )
                `)
                .eq("projectID", projectID);

            if (error) {
                console.error("Supabase error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            taskData = data;
        } else {
            const { data, error } = await supabase
                .from("tasks")
                .select(`
                    taskName,
                    hardDeadline,
                    priority,
                    status,
                    tasks_assignment!inner (
                      userID,
                      users (
                        userID,
                        firstName,
                        lastName,
                        username
                      )
                    ),
                    committee (
                      committeeName
                    )
                  `)
                .eq("projectID", projectID)
                .eq("tasks_assignment.userID", userID);
            if (error) {
                console.error("Supabase error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            taskData = data;
        }

        const mapped = taskData?.map(({ tasks_assignment, committee, ...rest }) => {
            const assignedPerson = tasks_assignment?.length
                ? tasks_assignment
                    .map(ta => ta.users
                        ? `${ta.users.firstName} ${ta.users.lastName}`
                        : null
                    )
                    .filter(Boolean)
                    .join(", ")
                : "None";

            return {
                ...rest,
                hardDeadline: rest.hardDeadline ?? "None",
                committeeName: committee?.committeeName ?? "None",
                assignedPerson
            };
        });

        return new Response(
            JSON.stringify({ data: mapped }),
            { status: 201 }
        );

    } else {
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
            manpowerRequired,
            tasks_assignment (
              userID,
              users (
                userID,
                firstName,
                lastName,
                username
              )
            ),
            committee (
                committeeID,
                committeeName
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
            manpowerRequired,
            tasks_assignment (
              userID,
              users (
                userID,
                firstName,
                lastName,
                username
              )
            ),
            committee (
                committeeID,        
                committeeName
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
            const names = task.tasks_assignment?.length
                ? task.tasks_assignment
                    .map(ta => {
                        const user = ta.users;
                        return user ? `${user.firstName} ${user.lastName}` : null;
                    })
                    .filter(Boolean)
                    .join(", ")
                : "None";

            const { tasks_assignment, ...rest } = task;

            return {
                ...rest,
                blastDate: rest.blastDate ?? "None",
                committeeID: rest.committee?.committeeID,
                committeeName: rest.committee?.committeeName,
                assignedPerson: names
            };
        });
    }
}

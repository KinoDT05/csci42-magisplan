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

    const filter = searchParams.get('filter');
    let taskData = null;

    console.log(filter);
    const { data: userData, error } = await supabase.auth.getUser();

    if (!userData.user) {
        return NextResponse.json(
            { error: "User does not exist" },
            { status: 400 }
        );
    }

    const userID = userData.user.id;


    if (filter) {
        if (filter == "all") {
            const { data, error } = await supabase
                .from("tasks")
                .select(`
                    taskName,
                    hardDeadline,
                    priority,
                    status,
                    driveLink,
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
                        committeeName
                    )
                `)
                .eq("projectID", projectID).order("hardDeadline", { ascending: true });

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
                    driveLink,
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
                .eq("tasks_assignment.userID", userID).order("hardDeadline", { ascending: true });
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

            const { tasks_assignment, committee, ...rest } = task;

            return {
                ...rest,
                committeeName: committee?.committeeName ?? "None",
                assignedPerson: names
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
            driveLink,
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
                .eq("committeeID", committeeID).order("hardDeadline", { ascending: true });

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
            driveLink,
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
                .eq("projectID", projectID).order("hardDeadline", { ascending: true });

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

            const userIDs = task.tasks_assignment?.length
                ? task.tasks_assignment.map(ta => ta.userID).filter(Boolean)
                : [];

            const { tasks_assignment, committee, ...rest } = task;

            return {
                ...rest,
                blastDate: rest.blastDate ?? "None",
                committeeID: committee?.committeeID ?? null,
                committeeName: committee?.committeeName ?? "None",
                assignedPerson: names,
                assignedUserIDs: userIDs, // ✅ ["uuid1", "uuid2"]
            };
        });


        return new Response(
            JSON.stringify({ data: mapped }),
            { status: 201 }
        );
    }

    
}

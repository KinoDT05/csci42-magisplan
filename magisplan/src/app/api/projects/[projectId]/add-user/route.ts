import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


async function checkUserInProject(userID: string, projectID: number, supabase) {
    const { data, error } = await supabase
        .from("committee")
        .select("*")
        .eq("userID", userID)
        .eq("projectID", projectID)
        .maybeSingle();
    if (error) {
        console.error("Supabase error checking user in project:", error.message);
        return false; // or throw error if you want to fail hard
    }

    // If data exists, user is in the project ? return true
    return data !== null;
        
}

async function checkUserInvited(userID: string, projectID: number, supabase ) {
    const { data: committees, error: committeeError } = await supabase
        .from("committee")
        .select("committeeID")
        .eq("projectID", projectID);

    if (committeeError) throw new Error(committeeError.message);

    const committeeIDs = committees.map(c => c.committeeID);

    if (committeeIDs.length === 0) return false;

    const { data: invites, error: inviteError } = await supabase
        .from("project_invites")
        .select("*")
        .eq("userID", userID)
        .in("committeeID", committeeIDs)
        .limit(1);

    if (inviteError) throw new Error(inviteError.message);

    return invites.length > 0;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const supabase = await createClient();
    const {
        invites
    } = await req.json();
    const { projectId: projectIdStr } = await params;
    const projectID = Number(projectIdStr);

    if (isNaN(projectID)) {
        throw new Error("Invalid projectId");
    }
    for (let i = 0; i < invites.length; i++) {
        const { data: userData, error: userGetError } = await supabase
            .from("users") 
            .select("*")
            .eq("emailAddress", invites[i].email)
            .maybeSingle();

        if (userGetError) {
            
            return NextResponse.json(
                { error: userGetError.message },
                { status: 500 }
            );
        }

        if (!userData) {
            
            return NextResponse.json(
                { error: "User with this email " + invites[i].email  + " does not exist" },
                { status: 404 }
            );
        }

        try {
            
            const isInProject = await checkUserInProject(userData.userID, projectID,supabase);

            if (isInProject) {
                return NextResponse.json(
                    { error: "User " + userData.firstName + " is already in the project" },
                    { status: 400 }
                );
            }

            const isInvited = await checkUserInvited(userData.userID, projectID, supabase)

            if (isInvited) {
                return NextResponse.json(
                    { error: "User " + userData.firstName + " is already invited in the project" },
                    { status: 400 }
                );
            }

            // adding user to project
            const { error: insertErrorComm } = await supabase.from("project_invites").insert({
                userID: userData.userID,
                committeeID: invites[i].committee,
                Role: invites[i].role
            });

            if (insertErrorComm) {
                return NextResponse.json(
                    { error: insertErrorComm.message },
                    { status: 400 }
                );
            }
        } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        
    }

    return NextResponse.json(
        { message: "Users Invited" },
        { status: 201 }
    );
}

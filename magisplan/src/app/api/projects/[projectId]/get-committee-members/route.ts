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

    let proj_member = null;

    if (committeeID) {
        console.log("yes");
        const { data, error } = await supabase
            .from("project_members")
            .select(`
            userID,
            projectID,
            committeeID,
            role,
            displayName,
            users (
                firstName,
                lastName,
                username
            )
          `)
            .eq("projectID", projectID)
            .eq("committeeID", committeeID);

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        proj_member = data;
    } 
    

    

    const mapped = proj_member?.map(({ users, ...rest }) => {
        return {
            ...rest,
            fullName: users ? `${users.firstName} ${users.lastName}` : "Unknown",
            username: users?.username ?? "None",
        };
    });

    
    return new Response(
        JSON.stringify({ data: mapped }),
        { status: 201 }
    );
}

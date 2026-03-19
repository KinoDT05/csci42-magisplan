import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET() {
    const supabase = await createClient();
    const {data, error} = await supabase.auth.getUser();

    if (!data.user) {
        return NextResponse.json(
            { error: "User does not exist" },
            { status: 400 }
        );
    }

    const userID = data.user.id;

    const { data: projectInvites, error: errorInGet } = await supabase
        .from("project_invites")
        .select(`
        committeeID, 
        Role,
        committee (
            committeeName,
            projects (
                projectName,
                projectDescription
            )
        )
    `)
        .eq("userID", userID);

    
    

    if (errorInGet) {
        return NextResponse.json(
            { error: errorInGet.message },
            { status: 500 }
        );
    }

    const invites = projectInvites?.map((invite) => ({
        committeeID: invite.committeeID,
        role: invite.Role,
        committeeName: invite.committee?.committeeName,
        projectName: invite.committee?.projects?.projectName,
        projectDescription: invite.committee?.projects?.projectDescription,
    }));

    console.log(invites);

    return new Response(
        JSON.stringify({ data: invites }),
        { status: 201 }
    );
}

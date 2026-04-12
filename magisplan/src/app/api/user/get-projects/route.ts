import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET() {
    const supabase = await createClient();
    const {data: userData, error} = await supabase.auth.getUser();

    if (!userData.user) {
        return NextResponse.json(
            { error: "User does not exist" },
            { status: 400 }
        );
    }

    const userID = userData.user.id;
    
    const { data, error: errorInGet } = await supabase
        .from("project_members")
        .select(`projects (
              projectID,
              projectName,
              projectDescription,
              targetDate
            )
        `)
        .eq("userID", userID);

    const projects = data?.map((member) => member.projects);


    if (errorInGet) {
        return NextResponse.json(
            { error: errorInGet.message },
            { status: 500 }
        );
    }

    return new Response(
        JSON.stringify({ data: projects }),
        { status: 201 }
    );
}

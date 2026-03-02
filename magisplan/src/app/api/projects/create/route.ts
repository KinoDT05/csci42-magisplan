import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    const {
        projectName,
        projectDescription,
        startDate,
        targetDate,
        driveLink,
        projectStatus,
        userID,
    } = await req.json();

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
            projectName,
            projectDescription,
            startDate,
            targetDate,
            driveLink,
            projectStatus,
        })
        .select()
        .single();

    if (projectError || !project) {
        return NextResponse.json(
        { error: projectError?.message },
        { status: 400 }
        );
    }

    const { error: memberError } =await supabase.from("project_members").insert({
        projectID: project.projectID,
        userID: userID,
        role: "moderator"
    });

    if (memberError) {
        return NextResponse.json(
            { error: memberError.message },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { message: "User created" },
        { status: 201 }
    );
}

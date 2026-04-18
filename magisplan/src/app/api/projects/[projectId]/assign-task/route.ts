import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const { taskID, userID, projectID } = await req.json();

    if (!taskID || !userID) {
        return NextResponse.json(
            { error: "taskID and userID are required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("tasks_assignment")
        .insert([{ taskID, userID }])
        .select();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    return NextResponse.json({ data }, { status: 201 });
}
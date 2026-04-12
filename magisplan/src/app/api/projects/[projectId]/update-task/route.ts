import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
    ) {
    const supabase = await createClient();
    const { projectId } = await params;
    const { taskID, status } = await req.json();

    console.log("Received:", { taskID, status });

    if (!taskID || !status) {
        return NextResponse.json({ error: "taskID and status are required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("taskID", taskID)
        .eq("projectID", Number(projectId))
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

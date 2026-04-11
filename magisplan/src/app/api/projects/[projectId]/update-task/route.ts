import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function PATCH(
    req: NextRequest,
    ) {
    const supabase = await createClient();
    
    const { searchParams } = new URL(req.url);

    const task = searchParams.get('task');
    const status = searchParams.get('status');

    const taskID = task ? Number(task) : null;

    if (!taskID || !status) {
        return NextResponse.json(
            { error: 'Things required' },
            { status: 400 }
        );
    }


    const { data, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("taskID", taskID)
        .select();

    if (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
    

    return NextResponse.json(
        { message
            : "Task Assigned" },
        { status: 201 }
    );
}

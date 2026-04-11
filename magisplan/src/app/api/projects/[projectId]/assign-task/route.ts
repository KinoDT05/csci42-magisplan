import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST(
    req: NextRequest,
    ) {
    const supabase = await createClient();
    
    const { searchParams } = new URL(req.url);

    const task = searchParams.get('task');
    const assignedUser = searchParams.get('user');

    const taskID = task ? Number(task) : null;

    if (!taskID || !assignedUser) {
        return NextResponse.json(
            { error: 'Things required' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("tasks_assignment")
        .insert([
            {
                taskID: taskID,
                userID: assignedUser,
            }
        ])
        .select();

    if (error) {
        return NextResponse.json(
            { error: error },
            { status: 400 }
        );
    }

    
    

    return NextResponse.json(
        { message
            : "Task Assigned" },
        { status: 201 }
    );
}

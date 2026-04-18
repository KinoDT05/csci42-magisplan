import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("task_assignment")
      .select(`
        taskID,
        tasks (
          taskID,
          committeeID,
          projectID,
          taskName,
          softDeadline,
          hardDeadline,
          blastDate,
          manpowerRequired,
          priority,
          status,
          projects (
            projectName
          )
        )
      `)
      .eq("userID", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const tasks = data?.map((row) => row.tasks) ?? [];

    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
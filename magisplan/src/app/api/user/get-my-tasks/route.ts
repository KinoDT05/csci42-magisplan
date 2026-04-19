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
      .from("tasks_assignment")
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
          status
        )
      `)
      .eq("userID", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const tasks = data?.map((row: any) => ({
      ...row.tasks,
      projectID: row.tasks?.projectID ?? null,
    })) ?? [];

    const projectIDs = [...new Set(tasks.map((t: any) => t.projectID).filter(Boolean))];

    const { data: projects } = await supabase
      .from("projects")
      .select("projectID, projectName")
      .in("projectID", projectIDs);

    const projectMap = Object.fromEntries(
      (projects ?? []).map((p: any) => [p.projectID, p.projectName])
    );

    const tasksWithProject = tasks.map((task: any) => ({
      ...task,
      projectName: projectMap[task.projectID] ?? null,
    }));

    return NextResponse.json({ data: tasksWithProject }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
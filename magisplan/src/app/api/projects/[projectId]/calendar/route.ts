import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// tasks is not yet included
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const numericProjectId = Number(projectId);

    if (!Number.isInteger(numericProjectId)) {
      return NextResponse.json(
        { error: "Invalid projectId" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to are required" },
        { status: 400 }
      );
    }

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

    const { data: membership, error: membershipError } = await supabase
      .from("project_members")
      .select("projectID")
      .eq("projectID", numericProjectId)
      .eq("userID", user.id)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      ); 
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ); 
    }

    const { data, error } = await supabase
      .from("events")
      .select(`
        eventID,
        projectID,
        createdBy,
        eventName,
        eventDescription,
        startAt,
        endAt,
        location,
        eventKind,
        meetings (
          eventID,
          modality,
          meetingLink
        ),
        activities (
          eventID,
          activityType,
          blastRequired
        )
      `)
      .eq("projectID", numericProjectId)
      .lt("startAt", to)
      .gt("endAt", from)
      .order("startAt", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const events = (data ?? []).map((row) => ({
      eventID: row.eventID,
      projectID: row.projectID,
      createdBy: row.createdBy,
      eventName: row.eventName,
      eventDescription: row.eventDescription,
      startAt: row.startAt,
      endAt: row.endAt,
      location: row.location,
      eventKind: row.eventKind,
      meeting: Array.isArray(row.meetings) ? row.meetings[0] ?? null : row.meetings ?? null,
      activity: Array.isArray(row.activities) ? row.activities[0] ?? null : row.activities ?? null,
    }));

    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch calendar events"},
      { status: 500 }
    );
  }
}

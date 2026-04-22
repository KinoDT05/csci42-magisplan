import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type MeetingBody = {
  eventKind: "meeting";
  eventName: string;
  eventDescription?: string;
  startAt: string;
  endAt: string;
  location?: string | null;
  modality?: "onsite" | "online";
  meetingLink?: string | null;
};

type ActivityBody = {
  eventKind: "activity";
  eventName: string;
  eventDescription?: string;
  startAt: string;
  endAt: string;
  location?: string | null;
  activityType?: string;
  blastRequired?: boolean;
}

type CreateEventBody = MeetingBody | ActivityBody;

function validateEvent(body: CreateEventBody) {
  const starts = new Date(body.startAt);
  const ends = new Date(body.endAt);

  if (!body.eventKind || !["meeting", "activity"].includes(body.eventKind)) {
    return "eventKind must be either 'meeting' or 'activity'.";
  }

  if (!body.eventName?.trim()) return "Event name is required.";
  if (Number.isNaN(starts.getTime())) return "Invalid start date.";
  if (Number.isNaN(ends.getTime())) return "Invalid end date.";
  if (ends <= starts) return "End date must be after start date.";

  if (body.eventKind === "meeting") {
    if (!body.modality || !["onsite", "online"].includes(body.modality)) {
      return "The modality must be 'onsite' or 'online' for meetings.";
    }

    if (body.modality === "online" && !body.meetingLink?.trim()) {
      return "The meeting link is required for online or hybrid meetings.";
    }
  }

  if (body.eventKind === "activity") {
    if (body.activityType !== undefined && typeof body.activityType !== "string") {
      return "activityType must be a string.";
    }

    if (body.blastRequired !== undefined && typeof body.blastRequired !== "boolean") {
      return "blastRequired must be a boolean.";
    }
  }

  return null;
}

function reshapeEvent(fullEvent: any) {
  return {
    ...fullEvent,
    meeting: Array.isArray(fullEvent.meetings)
      ? fullEvent.meetings[0] ?? null
      : fullEvent.meetings ?? null,
    activity: Array.isArray(fullEvent.activities)
      ? fullEvent.activities[0] ?? null
      : fullEvent.activities ?? null,
    meetings: undefined,
    activities: undefined,
  };
}

export async function POST(
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

    const body = (await req.json()) as CreateEventBody;

    const validationError = validateEvent(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
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

    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .insert({
          projectID: numericProjectId,
          createdBy: user.id,
          eventName: body.eventName.trim(),
          eventDescription: body.eventDescription?.trim() || null,
          startAt: body.startAt,
          endAt: body.endAt,
          location: body.location?.trim() || null,          
          eventKind: body.eventKind,
      })
      .select("eventID")
      .single();

    if (eventError || !eventRow) {
      return NextResponse.json(
        { error: eventError?.message ?? "Failed to create event." },
        { status: 500 }
      );
    }

    if (body.eventKind === "meeting") {
      const { error: meetingError } = await supabase
        .from("meetings")
        .insert({
          eventID: eventRow.eventID,
          modality: body.modality,
          meetingLink: body.meetingLink?.trim() || null,
        });

      if (meetingError) {
        await supabase.from("events").delete().eq("eventID", eventRow.eventID);
        return NextResponse.json({ error: meetingError.message }, { status: 500 });
      }
    }

    if (body.eventKind === "activity") {
      const { error: activityError } = await supabase
        .from("activities")
        .insert({
          eventID: eventRow.eventID,
          activityType: body.activityType?.trim() || null,
          blastRequired: body.blastRequired ?? false,
        });

      if (activityError) {
        await supabase.from("events").delete().eq("eventID", eventRow.eventID);
        return NextResponse.json({ error: activityError.message }, { status: 500 });
      }
    }

    const { data: fullEvent, error: fetchError } = await supabase
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
      .eq("eventID", eventRow.eventID)
      .eq("projectID", numericProjectId)
      .single();

    if (fetchError || !fullEvent) {
      return NextResponse.json(
        { error: fetchError?.message ?? "Failed to load created event." },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: reshapeEvent(fullEvent) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

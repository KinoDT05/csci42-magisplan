import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UpdateEventBody = {
    eventName?: string;
    eventDescription?: string | null;
    startAt?: string;
    endAt?: string;
    location?: string | null;
    eventKind?: "meeting" | "activity";

    // meeting fields
    modality?: "onsite" | "online" | null;
    meetingLink?: string | null;

    // activity fields
    activityType?: string | null;
    blastRequired?: boolean;
};

function validateUpdate(body: UpdateEventBody) {
    if (body.startAt && Number.isNaN(new Date(body.startAt).getTime())) {
        return "Invalid start date";
    }

    if (body.endAt && Number.isNaN(new Date(body.endAt).getTime())) {
        return "Invalid end date";
    }

    if (body.startAt && body.endAt) {
        const starts = new Date(body.startAt);
        const ends = new Date(body.endAt);

        if (ends <= starts) {
            return "End date must be after start date.";
        }
    }

    if (body.eventName !== undefined && !body.eventName.trim()) {
        return "Event name cannot be empty.";
    }

    if (
        body.modality !== undefined &&
        body.modality !== null &&
        !["onsite", "online"].includes(body.modality)
    ) {
        return "The modality must be 'onsite' or 'online'.";
    }

    if (
        body.modality !== undefined &&
        body.modality === "online" &&
        body.meetingLink !== undefined &&
        !body.meetingLink?.trim()
    ) {
        return "The meeting link cannot be empty for online meetings.";
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

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ projectId: string; eventId: string }> }
) {
    const { projectId, eventId } = await params;
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
        .eq("eventID", Number(eventId))
        .eq("projectID", Number(projectId))
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ event: reshapeEvent(data) });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string; eventId: string }> }
) {
    const { projectId, eventId } = await params;
    const body = (await req.json()) as UpdateEventBody;

    const validationError = validateUpdate(body);
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

    // First, fetch current event so we know which child table to update
    const { data: existingEvent, error: fetchExistingError } = await supabase
        .from("events")
        .select(`
        eventID,
        projectID,
        eventKind,
        startAt,
        endAt
        `)
        .eq("eventID", Number(eventId))
        .eq("projectID", Number(projectId))
        .single();

    if (fetchExistingError || !existingEvent) {
        return NextResponse.json(
        { error: fetchExistingError?.message ?? "Event not found." },
        { status: 404 }
        );
    }

    const effectiveStartAt = body.startAt ?? existingEvent.startAt;
    const effectiveEndAt = body.endAt ?? existingEvent.endAt;

    if (new Date(effectiveEndAt).getTime() <= new Date(effectiveStartAt).getTime()) {
        return NextResponse.json(
        { error: "endAt must be after startAt." },
        { status: 400 }
        );
    }

  // Update parent/shared fields
  const eventUpdateData: Record<string, unknown> = {};

  if (body.eventName !== undefined) eventUpdateData.eventName = body.eventName.trim();
  if (body.eventDescription !== undefined) eventUpdateData.eventDescription = body.eventDescription;
  if (body.startAt !== undefined) eventUpdateData.startAt = body.startAt;
  if (body.endAt !== undefined) eventUpdateData.endAt = body.endAt;
  if (body.location !== undefined) eventUpdateData.location = body.location;

  if (Object.keys(eventUpdateData).length > 0) {
    const { error: eventUpdateError } = await supabase
      .from("events")
      .update(eventUpdateData)
      .eq("eventID", Number(eventId))
      .eq("projectID", Number(projectId));

    if (eventUpdateError) {
      return NextResponse.json({ error: eventUpdateError.message }, { status: 500 });
    }
  }

  // Update child table based on current subtype
  if (existingEvent.eventKind === "meeting") {
    const meetingUpdateData: Record<string, unknown> = {};

    if (body.modality !== undefined) meetingUpdateData.modality = body.modality;
    if (body.meetingLink !== undefined) {
      meetingUpdateData.meetingLink = body.meetingLink?.trim() || null;
    }

    const finalModality =
      body.modality !== undefined ? body.modality : undefined;

    const finalMeetingLink =
      body.meetingLink !== undefined ? body.meetingLink?.trim() || null : undefined;

    if (
      finalModality !== undefined &&
      finalModality === "online" &&
      finalMeetingLink !== undefined &&
      !finalMeetingLink
    ) {
      return NextResponse.json(
        { error: "The meeting link is required for online meetings." },
        { status: 400 }
      );
    }

    if (Object.keys(meetingUpdateData).length > 0) {
      const { error: meetingUpdateError } = await supabase
        .from("meetings")
        .update(meetingUpdateData)
        .eq("eventID", Number(eventId));

      if (meetingUpdateError) {
        return NextResponse.json({ error: meetingUpdateError.message }, { status: 500 });
      }
    }
  }

  if (existingEvent.eventKind === "activity") {
    const activityUpdateData: Record<string, unknown> = {};

    if (body.activityType !== undefined) {
      activityUpdateData.activityType = body.activityType?.trim() || null;
    }
    if (body.blastRequired !== undefined) {
      activityUpdateData.blastRequired = body.blastRequired;
    }

    if (Object.keys(activityUpdateData).length > 0) {
      const { error: activityUpdateError } = await supabase
        .from("activities")
        .update(activityUpdateData)
        .eq("eventID", Number(eventId));

      if (activityUpdateError) {
        return NextResponse.json({ error: activityUpdateError.message }, { status: 500 });
      }
    }
  }

  // Fetch updated full event
  const { data: fullEvent, error: finalFetchError } = await supabase
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
    .eq("eventID", Number(eventId))
    .eq("projectID", Number(projectId))
    .single();

  if (finalFetchError || !fullEvent) {
    return NextResponse.json(
      { error: finalFetchError?.message ?? "Failed to load updated event." },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: reshapeEvent(fullEvent) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; eventId: string }> }
) {
  const { projectId, eventId } = await params;
  const supabase = await createClient();

  const numericProjectId = Number(projectId);
  const numericEventId = Number(eventId);

  if (!Number.isInteger(numericProjectId) || !Number.isInteger(numericEventId)) {
    return NextResponse.json({ error: "Invalid projectId or eventId." }, { status: 400 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("eventID", numericEventId)
    .eq("projectID", numericProjectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Event deleted successfully." },
    { status: 200 }
  );
}

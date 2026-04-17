import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UpdateEventBody = {
  eventName?: string;
  eventDescription?: string | null;
  startAt?: string;
  endAt?: string;
  location?: string | null;

  // meeting fields
  modality?: "onsite" | "online" | null;
  meetingLink?: string | null;

  // activity fields
  activityType?: string | null;
  blastRequired?: boolean;
};

function validateUpdate(body: UpdateEventBody) {
  if (body.startAt && Number.isNaN(new Date(body.startAt).getTime())) {
    return "Invalid start date.";
  }

  if (body.endAt && Number.isNaN(new Date(body.endAt).getTime())) {
    return "Invalid end date.";
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
  try {
    const { projectId, eventId } = await params;
    const numericProjectId = Number(projectId);
    const numericEventId = Number(eventId);

    if (!Number.isInteger(numericProjectId) || !Number.isInteger(numericEventId)) {
      return NextResponse.json({ error: "Invalid projectId or eventId." }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("project_members")
      .select("projectID")
      .eq("projectID", numericProjectId)
      .eq("userID", user.id)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
      .eq("eventID", numericEventId)
      .eq("projectID", numericProjectId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ event: reshapeEvent(data) });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch event." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; eventId: string }> }
) {
  try {
    const { projectId, eventId } = await params;
    const numericProjectId = Number(projectId);
    const numericEventId = Number(eventId);

    if (!Number.isInteger(numericProjectId) || !Number.isInteger(numericEventId)) {
      return NextResponse.json({ error: "Invalid projectId or eventId." }, { status: 400 });
    }

    const body = (await req.json()) as UpdateEventBody;

    const validationError = validateUpdate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: existingEvent, error: existingError } = await supabase
      .from("events")
      .select(`
        eventID,
        projectID,
        createdBy,
        eventKind,
        startAt,
        endAt,
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
      .eq("eventID", numericEventId)
      .eq("projectID", numericProjectId)
      .single();

    if (existingError || !existingEvent) {
      return NextResponse.json(
        { error: existingError?.message ?? "Event not found." },
        { status: 404 }
      );
    }

    if (existingEvent.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const effectiveStartAt = body.startAt ?? existingEvent.startAt;
    const effectiveEndAt = body.endAt ?? existingEvent.endAt;

    if (new Date(effectiveEndAt).getTime() <= new Date(effectiveStartAt).getTime()) {
      return NextResponse.json(
        { error: "End date must be after start date." },
        { status: 400 }
      );
    }

    const eventUpdateData: Record<string, unknown> = {};

    if (body.eventName !== undefined) eventUpdateData.eventName = body.eventName.trim();
    if (body.eventDescription !== undefined) {
      eventUpdateData.eventDescription = body.eventDescription?.trim() || null;
    }
    if (body.startAt !== undefined) eventUpdateData.startAt = body.startAt;
    if (body.endAt !== undefined) eventUpdateData.endAt = body.endAt;
    if (body.location !== undefined) eventUpdateData.location = body.location?.trim() || null;

    if (Object.keys(eventUpdateData).length > 0) {
      const { error: eventUpdateError } = await supabase
        .from("events")
        .update(eventUpdateData)
        .eq("eventID", numericEventId)
        .eq("projectID", numericProjectId)
        .eq("createdBy", user.id);

      if (eventUpdateError) {
        return NextResponse.json({ error: eventUpdateError.message }, { status: 500 });
      }
    }

    if (existingEvent.eventKind === "meeting") {
      const currentMeeting = Array.isArray(existingEvent.meetings)
        ? existingEvent.meetings[0] ?? null
        : existingEvent.meetings ?? null;

      const finalModality =
        body.modality !== undefined ? body.modality : currentMeeting?.modality ?? null;

      const finalMeetingLink =
        body.meetingLink !== undefined
          ? body.meetingLink?.trim() || null
          : currentMeeting?.meetingLink ?? null;

      if (finalModality === "online" && !finalMeetingLink) {
        return NextResponse.json(
          { error: "The meeting link is required for online meetings." },
          { status: 400 }
        );
      }

      const meetingUpdateData: Record<string, unknown> = {};
      if (body.modality !== undefined) meetingUpdateData.modality = body.modality;
      if (body.meetingLink !== undefined) {
        meetingUpdateData.meetingLink = body.meetingLink?.trim() || null;
      }

      if (Object.keys(meetingUpdateData).length > 0) {
        const { error: meetingError } = await supabase
          .from("meetings")
          .update(meetingUpdateData)
          .eq("eventID", numericEventId);

        if (meetingError) {
          return NextResponse.json({ error: meetingError.message }, { status: 500 });
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
        const { error: activityError } = await supabase
          .from("activities")
          .update(activityUpdateData)
          .eq("eventID", numericEventId);

        if (activityError) {
          return NextResponse.json({ error: activityError.message }, { status: 500 });
        }
      }
    }

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
      .eq("eventID", numericEventId)
      .eq("projectID", numericProjectId)
      .single();

    if (finalFetchError || !fullEvent) {
      return NextResponse.json(
        { error: finalFetchError?.message ?? "Failed to load updated event." },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: reshapeEvent(fullEvent) });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update event." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; eventId: string }> }
) {
  try {
    const { projectId, eventId } = await params;
    const numericProjectId = Number(projectId);
    const numericEventId = Number(eventId);

    if (!Number.isInteger(numericProjectId) || !Number.isInteger(numericEventId)) {
      return NextResponse.json({ error: "Invalid projectId or eventId." }, { status: 400 });
    }

    const supabase = await createClient();

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
      .eq("projectID", numericProjectId)
      .eq("createdBy", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Event deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete event." },
      { status: 500 }
    );
  }
}

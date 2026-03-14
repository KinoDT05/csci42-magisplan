import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UpdateEventBody = {
    eventName?: string;
    eventDescription?: string | null;
    startAt?: string;
    endAt?: string;
    location?: string | null;

    eventKind?: "meeting" | "activity";

    // meeting
    modality?: "onsite" | "online" | null;
    meetingLink?: string | null;

    // activity
    eventTypeID?: number | null;
    isPostingDate?: boolean;
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

    return null;
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
            eventName,
            eventDescription,
            startAt,
            endAt,
            location,
            eventKind,
            modality,
            meetingLink,
            eventTypeID,
            isPostingDate
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

    return NextResponse.json({ event: data });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string; eventId: string }> }
) {
    const { projectId, eventId } = await params;
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
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const updateData: Record<string, unknown> = {};

    if (body.eventName !== undefined) updateData.eventName = body.eventName.trim();
    if (body.eventDescription !== undefined) updateData.eventDescription = body.eventDescription;
    if (body.startAt !== undefined) updateData.startAt = body.startAt;
    if (body.endAt !== undefined) updateData.endAt = body.endAt;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.eventKind !== undefined) updateData.eventKind = body.eventKind;
    if (body.modality !== undefined) updateData.modality = body.modality;
    if (body.meetingLink !== undefined) updateData.meetingLink = body.meetingLink;
    if (body.eventTypeID !== undefined) updateData.eventTypeID = body.eventTypeID;
    if (body.isPostingDate !== undefined) updateData.isPostingDate = body.isPostingDate;

    const { data, error } = await supabase
        .from("events")
        .update(updateData)
        .eq("eventID", Number(eventId))
        .eq("projectID", Number(projectId))
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ event: data });
}

export async function DELETE(
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
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("events")
        .delete()
        .eq("eventID", Number(eventId))
        .eq("projectID", Number(projectId));

    if (error) {
    return NextResponse.json(
        { error: error.message },
        { status: 500 }
    );
    }

    return NextResponse.json(
        { message: "Event deleted successfully." },
        { status : 201 }
    );
}

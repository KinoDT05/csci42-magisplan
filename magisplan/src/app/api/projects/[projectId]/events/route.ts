import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CreateEventBody = {
  eventName: string;
  eventDescription?: string;
  startAt: string;
  endAt: string;
  location?: string | null;

  eventKind: 'meeting' | 'activity';

  // meeting
  modality?: 'onsite' | 'online';
  meetingLink?: string | null;

  // activity
  eventTypeId?: string | null;
  isPostingDate?: boolean;
}

function validateEvent(body: CreateEventBody) {
  const starts = new Date(body.startAt);
  const ends = new Date(body.endAt);

  if (!body.eventName?.trim()) return 'Event name is required.';
  if (Number.isNaN(starts.getTime())) return 'Invalid start date';
  if (Number.isNaN(ends.getTime())) return 'Invalid end date';
  if (ends <= starts) return 'End date must be after start date.';

  if (body.eventKind === 'meeting') {
    if (!body.modality) return 'Meeting modality is required.';

    if (body.modality === 'onsite' && !body.location?.trim()) {
      return 'Location is required for onsite meetings.';
    }

    if (body.modality === 'online' && !body.meetingLink?.trim()) {
      return 'Meeting link is required for online meetings.';
    }
  }

  if (body.eventKind === 'activity') {
    if (!body.eventTypeId) return 'Activity type is required.';
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
        projectID: Number(projectId),
        eventName: body.eventName.trim(),
        eventDescription: body.eventDescription ?? null,
        startAt: body.startAt,
        endAt: body.endAt,
        location: body.location ?? null,
        
        eventKind: body.eventKind,
        modality: body.eventKind === 'meeting' ? body.modality ?? null : null,
        meeting_link: body.eventKind === 'meeting' ? body.meetingLink ?? null : null,

        eventTypeID:
          body.eventKind === 'activity' ? body.eventTypeId ?? null : null,
        isPostingDate:
          body.eventKind === 'activity' ? !!body.isPostingDate : false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: data }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from and to are required' },
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
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // overlap query: starts before range end AND ends after range start
  const { data, error } = await supabase
    .from('events')
    .select(`
      eventID,
      projectID,
      eventName,
      eventDescription,
      startAt,
      endAt,
      location,
      eventKind
    `)
    .eq('projectID', Number(projectId))
    .lt('startAt', to)
    .gt('endAt', from)
    .order('startAt', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ events: data });
}

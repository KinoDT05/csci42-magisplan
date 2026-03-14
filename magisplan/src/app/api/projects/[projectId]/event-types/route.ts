import { NextResponse } from 'next/server'
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_types')
    .select('eventTypeID, typeName')
    .eq('projectID', Number(projectId))
    .eq('isActive', true)
    .order('typeName');

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ eventTypes: data });
}

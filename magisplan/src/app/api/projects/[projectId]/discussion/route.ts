import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { projectId } = await params;

  const { data, error } = await supabase
    .from("discussion_topic")
    .select(
      `
      topicID,
      topicName,
      topicDescription,
      isArchived,
      dateCreated
    `
    )
    .eq("projectId", projectId)
    .eq("isArchived", false)
    .order("dateCreated", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const topics = (data ?? []).map((row: any) => ({
    topicID: row.topicID,
    topicName: row.topicName,
    topicDescription: row.topicDescription,
    isArchived: row.isArchived,
    dateCreated: row.dateCreated,
  }));

  return NextResponse.json(topics);
}
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { projectId } = await params;

  const { data, error } = await supabase
    .from("discussion_topic")
    .select(`
      topicID,
      projectID,
      userID,
      topicName,
      topicDescription,
      isArchived,
      dateCreated
    `)
    .eq("projectID", projectId)
    .eq("isArchived", false)
    .order("dateCreated", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const topics = await Promise.all(
    (data ?? []).map(async (row: any) => {
      const { data: author } = await supabase
        .from("project_members")
        .select("displayName, committeeID, role")
        .eq("userID", row.userID)
        .eq("projectID", projectId)
        .single();

      return {
        topicID: row.topicID,
        topicName: row.topicName,
        topicDescription: row.topicDescription,
        isArchived: row.isArchived,
        dateCreated: row.dateCreated,
        userID: row.userID,
        author: author ?? null,
      };
    })
  );

  return NextResponse.json(topics);
}
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string; topicId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { projectId, topicId } = await params;
  const topicID = Number(topicId);

  if (isNaN(topicID)) {
    return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member, error: memberError } = await supabase
    .from("project_members")
    .select("displayName, committeeID, role")
    .eq("userID", user.id)
    .eq("projectID", projectId)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Member not found in project" }, { status: 403 });
  }

  const { replyContent } = await req.json();

  if (!replyContent) {
    return NextResponse.json({ error: "replyContent is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("discussion_reply")
    .insert({
      topicID,
      replyContent,
      userID: user.id,
      dateCreated: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
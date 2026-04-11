import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string; topicId: string; replyId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { topicId, replyId } = await params;
  const topicID = Number(topicId);
  const replyID = Number(replyId);

  if (isNaN(topicID) || isNaN(replyID)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: replyData, error: replyError } = await supabase 
    .from("discussion_reply")
    .select("userID")
    .eq("replyID", replyID)
    .eq("topicID", topicID)
    .single();

  if (replyError || !replyData) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
  }
  if (replyData.userID !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: memberData } = await supabase
  .from("project_members")
  .select("displayName")
  .eq("userID", replyData.userID)
  .single();

  const { replyContent } = await req.json();

  if (!replyContent) {
    return NextResponse.json({ error: "replyContent is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("discussion_reply")
    .update({ replyContent })
    .eq("replyID", replyID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    displayName: memberData?.displayName ?? "Unknown",
    replyContent,
  });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { topicId, replyId } = await params;
  const topicID = Number(topicId);
  const replyID = Number(replyId);

  if (isNaN(topicID) || isNaN(replyID)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: reply } = await supabase
    .from("discussion_reply")
    .select("userID")
    .eq("replyID", replyID)
    .eq("topicID", topicID)
    .single();

  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
  }

  if (reply.userID !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("discussion_reply")
    .delete()
    .eq("replyID", replyID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
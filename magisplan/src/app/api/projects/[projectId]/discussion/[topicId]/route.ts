import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string; topicId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { projectId, topicId } = await params;
  const topicID = Number(topicId);

  if (isNaN(topicID)) {
    return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
  }

  const { data: topic, error: topicError } = await supabase
    .from("discussion_topic")
    .select(`
      topicID,
      projectID,
      topicName,
      topicDescription,
      isArchived,
      dateCreated,
      userID
    `)
    .eq("topicID", topicID)
    .eq("projectID", projectId)
    .single();

  if (topicError || !topic) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  const { data: author } = await supabase
    .from("project_members")
    .select("displayName, committeeID, role")
    .eq("userID", topic.userID)
    .eq("projectID", projectId)
    .single();

  const { data: replies, error: repliesError } = await supabase
    .from("discussion_reply")
    .select(`
      replyID,
      replyContent,
      dateCreated,
      userID
    `)
    .eq("topicID", topicID)
    .order("dateCreated", { ascending: true });

  if (repliesError) {
    return NextResponse.json({ error: repliesError.message }, { status: 500 });
  }

  const repliesWithAuthors = await Promise.all(
    (replies ?? []).map(async (reply) => {
      const { data: replyAuthor } = await supabase
        .from("project_members")
        .select("displayName, committeeID, role")
        .eq("userID", reply.userID)
        .eq("projectID", projectId)
        .single();

      return { ...reply, author: replyAuthor ?? null };
    })
  );

  return NextResponse.json({
    ...(topic as Record<string, unknown>),
    author: author ?? null,
    replies: repliesWithAuthors,
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

  const { data: topic } = await supabase
    .from("discussion_topic")
    .select("userID")
    .eq("topicID", topicID)
    .eq("projectID", projectId)
    .single();

  if (!topic) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  if (topic.userID !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { topicName, topicDescription } = await req.json();
  console.log("topicName:", topicName, "topicDescription:", topicDescription);

  if (!topicName || !topicDescription) {
    return NextResponse.json({ error: "topicName and topicDescription are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("discussion_topic")
    .update({ topicName, topicDescription })
    .eq("topicID", topicID)
    .select();

    console.log("update error:", error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
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

  const { data: topic } = await supabase
    .from("discussion_topic")
    .select("userID")
    .eq("topicID", topicID)
    .eq("projectID", projectId)
    .single();

  if (!topic) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  if (topic.userID !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("discussion_topic")
    .delete()
    .eq("topicID", topicID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();
  const topicID = Number(slug);
  
  if (isNaN(topicID)) {
    return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
  }

  const { data: topic, error: topicError } = await supabase
    .from("discussion_topic")
    .select(`
      topicID,
      topicName,
      topicDescription,
      isArchived,
      dateCreated
    `)
    .eq("topicID", topicID)
    .single();

  if (topicError || !topic) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  const { data: replies, error: repliesError } = await supabase
    .from("discussion_reply")
    .select(`
      replyID,
      replyContent,
      dateCreated
    `)
    .eq("topicID", topic.topicID)
    .order("dateCreated", { ascending: true });

  if (repliesError) {
    return NextResponse.json({ error: repliesError.message }, { status: 500 });
  }

  return NextResponse.json({
    topicID: topic.topicID,
    topicName: topic.topicName,
    topicDescription: topic.topicDescription,
    isArchived: topic.isArchived,
    dateCreated: topic.dateCreated,
    replies: (replies ?? []).map((r: any) => ({
      replyID: r.replyID,
      replyContent: r.replyContent,
      dateCreated: r.dateCreated,
    })),
  });
}
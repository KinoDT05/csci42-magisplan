import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string; slug: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { slug } = await params;
  const topicID = Number(slug);

  if (isNaN(topicID)) {
    return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
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
      dateCreated: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
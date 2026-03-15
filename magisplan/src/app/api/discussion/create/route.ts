import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { topicName, topicDescription } = await req.json();

  if (!topicName || !topicDescription) {
    return NextResponse.json(
      { error: "topicName and topicDescription are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("discussion_topic")
    .insert({
      topicName,
      topicDescription,
      // committeeID,
      // userID: userID,
      isArchived: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
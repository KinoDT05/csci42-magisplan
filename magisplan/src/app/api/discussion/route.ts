import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

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
    committeeID: row.committeeID,
    committeeName: row.committee?.committeeName ?? null,
    userName: row.users?.firstName ?? null,
    dateCreated: row.dateCreated,
  }));

  return NextResponse.json(topics);
}
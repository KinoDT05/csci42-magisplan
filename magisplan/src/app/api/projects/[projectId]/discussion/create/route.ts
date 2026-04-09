import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { projectId } = await params;

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

  const { topicName, topicDescription } = await req.json();

  if (!topicName || !topicDescription) {
    return NextResponse.json(
      { error: "topicName and topicDescription are required" },
      { status: 400 }
    );
  }

  // console.log("Inserting with:", {
  //   userID: user.id,
  //   committeeID: member.committeeID,
  //   projectID: projectId,
  // });

  const { data, error } = await supabase
    .from("discussion_topic")
    .insert({
      topicName,
      topicDescription,
      projectID: projectId,
      userID: user.id,
      committeeID: member.committeeID,
      isArchived: false,
      dateCreated: new Date().toISOString(),
    })
    .select()
    .single();

  // console.log("Insert result:", data);
  // console.log("Insert error:", error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
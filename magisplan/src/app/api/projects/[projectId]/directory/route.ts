import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { projectId } = await params;

  const { data, error } = await supabase
    .from("project_members")
    .select(`
      userID,
      projectID,
      committeeID,
      displayName,
      role,
      dateJoined,
      user:users(firstName, middleName, lastName, username, emailAddress, contactNumber),
      committee:committee(committeeName)
    `)
    .eq("projectID", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const members = (data ?? []).map((row: any) => ({
    userID: row.userID,
    displayName: row.displayName,
    role: row.role,
    dateJoined: row.dateJoined,
    committeeName: row.committee?.committeeName ?? null,
    firstName: row.user?.firstName ?? null,
    middleName: row.user?.middleName ?? null,
    lastName: row.user?.lastName ?? null,
    username: row.user?.username ?? null,
    emailAddress: row.user?.emailAddress ?? null,
    contactNumber: row.user?.contactNumber ?? null,
  }));

  return NextResponse.json(members);
}
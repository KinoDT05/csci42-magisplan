import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProjectInfo = {
  projectID: number;
  projectName: string;
};

type MembershipRow = {
  projectID: number;
  role: string;
  projects: ProjectInfo | ProjectInfo[] | null;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { username } = await context.params;

    console.log("[GET /api/profile/username/[username]] username:", username);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        userID,
        emailAddress,
        firstName,
        middleName,
        lastName,
        contactNumber,
        username,
        profileImageUrl
      `)
      .eq("username", username)
      .maybeSingle();

    console.log("[GET profile by username] user:", user);
    console.log("[GET profile by username] userError:", userError);

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from("project_members")
      .select(`
        projectID,
        role,
        projects (
          projectID,
          projectName
        )
      `)
      .eq("userID", user.userID);

    console.log("[GET profile by username] memberships:", memberships);
    console.log("[GET profile by username] membershipsError:", membershipsError);

    if (membershipsError) {
      return NextResponse.json(
        { error: membershipsError.message },
        { status: 500 }
      );
    }

    const typedMemberships: MembershipRow[] = (memberships ?? []).map((member: any) => ({
      projectID: member.projectID,
      role: member.role,
      projects: member.projects,
    }));

    const fullName = [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const formattedProjects = typedMemberships.map((member) => ({
      projectID: member.projectID,
      projectName: Array.isArray(member.projects)
        ? member.projects[0]?.projectName ?? ""
        : member.projects?.projectName ?? "",
      role: member.role,
    }));

    console.log("[GET profile by username] formattedProjects:", formattedProjects);

    return NextResponse.json(
      {
        userID: user.userID,
        fullName,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        contactNumber: user.contactNumber,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        projects: formattedProjects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/profile/username/[username] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

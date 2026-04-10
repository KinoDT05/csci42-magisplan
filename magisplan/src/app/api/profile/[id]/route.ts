import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// shape of the related row selected from the "projects" table
type ProjectInfo = {
  projectID: number;
  projectName: string;
}

// shape of one row sreturned from "project_members" with joined "projects" data
type MembershipRow = {
  projectID: number;
  role: string;
  projects: ProjectInfo[] | null;
};

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const { data: { user: authUser}, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authUser.id !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // get details of the user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        userID,
        emailAddress,
        firstName,
        middleName,
        lastName,
        contactNumber,
        username
      `)
      .eq("userID", id)
      .single();

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
    
    // get rows from "project_members" entity, and for each row, fetch the
    // related project's projectID and projectName from "projects" entity
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
    .eq("userID", id);
    
    if (membershipsError) {
      return NextResponse.json(
        { error: membershipsError.message },
        { status: 500 }
      );
    }
    
    const typedMemberships = (memberships ?? []) as MembershipRow[];
    
    const fullName = [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
    .filter(Boolean)
    .join(" ");
    
    // map() goes through each item of typedMembership array and returns a new array
    const formattedProjects = typedMemberships.map((member) => ({
      projectID: member.projectID,
      projectName: member.projects?.[0]?.projectName ?? "",
      role: member.role,
    }));

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
        projects: formattedProjects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/profile/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const { data: { user: authUser}, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authUser.id !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const firstName = body.firstName?.trim();
    const middleName = body.middleName?.trim() || null;
    const lastName = body.lastName?.trim();
    const contactNumber = body.contactNumber?.trim();
    const username = body.username?.trim() || null;
    
    if (!firstName || !lastName || !contactNumber) {
      return NextResponse.json(
        { error: "firstName, lastName, and contactNumber are required" },
        { status: 400 }
      );
    }
    
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        firstName,
        middleName,
        lastName,
        contactNumber,
        username,
      })
      .eq("userID", id)
      .select(`
        userID,
        emailAddress,
        firstName,
        middleName,
        lastName,
        contactNumber,
        username
      `)
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const fullName = [
      updatedUser.firstName,
      updatedUser.middleName,
      updatedUser.lastName,
    ]
      .filter(Boolean)
      .join(" ");
    
    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          userID: updatedUser.userID,
          fullName,
          firstName: updatedUser.firstName,
          middleName: updatedUser.middleName,
          lastName: updatedUser.lastName,
          emailAddress: updatedUser.emailAddress,
          contactNumber: updatedUser.contactNumber,
          username: updatedUser.username,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/profile/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

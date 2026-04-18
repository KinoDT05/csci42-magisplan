import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    console.log("[PATCH /api/profile/[id]] param id:", id);

    const {
      data: { user: authUser},
      error: authError
    } = await supabase.auth.getUser();

    console.log("[PATCH /api/profile/[id]] authUser:", authUser);
    console.log("[PATCH /api/profile/[id]] authError:", authError);

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
      console.log("[PATCH /api/profile/[id]] Forbidden:", {
        authUserId: authUser.id,
        paramId: id,
      });

      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("[PATCH /api/profile/[id]] request body:", body);
    
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

    if (!firstName || !lastName || !contactNumber) {
      return NextResponse.json(
        { error: "firstName, lastName, and contactNumber are required" },
        { status: 400 }
      );
    }

    if (username) {
      const { data: existingUser, error: usernameError } = await supabase
        .from("users")
        .select("userID")
        .eq("username", username)
        .maybeSingle();

      console.log("[PATCH /api/profile/[id]] existingUser:", existingUser);
      console.log("[PATCH /api/profile/[id]] usernameError:", usernameError);

      if (usernameError) {
        return NextResponse.json({ error: usernameError.message }, { status: 500 });
      }

      if (existingUser && existingUser.userID !== id) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
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
      .eq("userID", authUser.id)
      .select(`
        userID,
        emailAddress,
        firstName,
        middleName,
        lastName,
        contactNumber,
        username
      `)
      .maybeSingle();
    
    
    console.log("[PATCH /api/profile/[id]] updatedUser:", updatedUser);
    console.log("[PATCH /api/profile/[id]] updateError:", updateError);
    
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

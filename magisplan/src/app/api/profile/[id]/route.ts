import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    console.log("[PATCH /api/profile/[id]] param id:", id);

    const {
      data: { user: authUser },
      error: authError,
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
        { error: "Unauthorized" },
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

    const formData = await request.formData();

    const firstName = formData.get("firstName")?.toString().trim();
    const middleName = formData.get("middleName")?.toString().trim() || null;
    const lastName = formData.get("lastName")?.toString().trim();
    const contactNumber = formData.get("contactNumber")?.toString().trim();
    const username = formData.get("username")?.toString().trim() || null;
    const photo = formData.get("photo") as File | null;

    console.log("[PATCH /api/profile/[id]] form values:", {
      firstName,
      middleName,
      lastName,
      contactNumber,
      username,
      photoName: photo?.name,
      photoSize: photo?.size,
      photoType: photo?.type,
    });

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
        return NextResponse.json(
          { error: usernameError.message },
          { status: 500 }
        );
      }

      if (existingUser && existingUser.userID !== id) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    let profileImageUrl: string | undefined = undefined;

    if (photo && photo.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, and WEBP files are allowed" },
          { status: 400 }
        );
      }

      const fileExt = photo.name.split(".").pop() || "jpg";
      const filePath = `${authUser.id}/profile-${Date.now()}.${fileExt}`;

      const arrayBuffer = await photo.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("profile pictures")
        .upload(filePath, fileBuffer, {
          contentType: photo.type,
          upsert: true,
        });

      console.log("[PATCH /api/profile/[id]] uploadError:", uploadError);

      if (uploadError) {
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("profile pictures")
        .getPublicUrl(filePath);

      profileImageUrl = publicUrlData.publicUrl;
    }

    const updatePayload: {
      firstName: string;
      middleName: string | null;
      lastName: string;
      contactNumber: string;
      username: string | null;
      profileImageUrl?: string;
    } = {
      firstName,
      middleName,
      lastName,
      contactNumber,
      username,
    };

    if (profileImageUrl) {
      updatePayload.profileImageUrl = profileImageUrl;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("userID", authUser.id)
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
          profileImageUrl: updatedUser.profileImageUrl,
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

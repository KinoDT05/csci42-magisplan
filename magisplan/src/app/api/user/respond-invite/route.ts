import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shareFolderWithUser } from '@/lib/google-drive';

export async function POST(
    req: NextRequest,
    ) {
    const supabase = await createClient();
    const {data, error} = await supabase.auth.getUser();

    if (!data.user) {
        return NextResponse.json(
            { error: "User does not exist" },
            { status: 400 }
        );
    }

    const userID = data.user.id;

    const { searchParams } = new URL(req.url);

    const committee = searchParams.get('committee');
    const role = searchParams.get('role');
    const response = searchParams.get('response');

    if (!committee || !response || !role) {
        return NextResponse.json(
            { error: 'from and to are required' },
            { status: 400 }
        );
    }

    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("firstName, google_email")
        .eq("userID", userID)
        .single();

    if (userError) {
        return NextResponse.json(
            { error: userError },
            { status: 400 }
        );
    }

    const displayName = userData?.firstName;

    const committeeID = Number(committee);

    const { data: projData, error: projError } = await supabase
        .from("committee")
        .select("projectID")
        .eq("committeeID", committeeID)
        .single();

    if (projError) {
        return NextResponse.json(
            { error: projError },
            { status: 400 }
        );
    }

    const projectID = projData?.projectID;

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("ownerID, driveID")
        .eq("projectID", projectID)
        .single();

    if (response === "accept") {
        try {
            // 1. Share the folder FIRST
            // We use the ownerID from the projects table to get the correct refresh token
            await shareFolderWithUser(
                project.ownerID,
                project.driveID,
                userData.google_email,
                "writer"
            );

            // 2. Update Database
            const { error: deleteError } = await supabase
                .from("project_invites")
                .delete()
                .eq("userID", userID)
                .eq("committeeID", committeeID);

            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase
                .from("project_members")
                .insert({
                    userID: userID,
                    projectID: projectID,
                    committeeID: committeeID,
                    role: role,
                    displayName: displayName,
                    dateJoined: new Date()
                });

            if (insertError) throw insertError;

            return NextResponse.json({ message: "Invite accepted and Drive folder shared" }, { status: 200 });

        } catch (err: any) {
            console.error("Critical Error in Invite Accept:", err.message);
            return NextResponse.json(
                { error: err.message || "An unexpected error occurred" },
                { status: 500 }
            );
        }
    }

    if (response === "deny") {
        console.log("deny it")

        const { error: deleteError } = await supabase
            .from("project_invites")
            .delete()
            .eq("userID", userID)
            .eq("committeeID", committeeID);


        if (deleteError) {
            return NextResponse.json(
                { error: deleteError },
                { status: 400 }
            );
        }

        return NextResponse.json({ message: "Invite denied" }, { status: 200 });

    }

    return NextResponse.json(
        { error: "Response Error" },
        { status: 400 }
    );
}

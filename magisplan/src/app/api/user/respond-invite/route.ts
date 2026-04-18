import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


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
        .select("firstName")
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

    if (response === "accept") {
        const { error:deleteError } = await supabase
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

        const { error: insertError } = await supabase
            .from("project_members").
            insert({
                userID: userID,
                projectID: projectID,
                committeeID: committeeID,
                role: role,
                displayName: displayName,
                dateJoined: new Date()
            });

        if (insertError) {
            return NextResponse.json(
                { error: insertError },
                { status: 400 }
            );
        }

        return NextResponse.json({ message: "Invite accepted" }, { status: 200 });

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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const supabase = await createClient();
    const {
        inviteDetails
    } = await req.json();
    
    for (let i = 0; i < inviteDetails.length; i++) {
        const { error: insertErrorComm } = await supabase.from("project_invites").insert({
            userID: inviteDetails.userID,
            committeeID: inviteDetails[i].committeeID,
        });

        if (insertErrorComm) {
            return NextResponse.json(
                { error: insertErrorComm.message },
                { status: 400 }
            );
        }
    }

    return NextResponse.json(
        { message: "Users Invited" },
        { status: 201 }
    );
}

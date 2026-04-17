import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGoogleFile } from '@/lib/google-drive';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const supabase = await createClient();
    
    const { projectId: projectIdStr } = await params;
    const projectID = Number(projectIdStr);

    if (isNaN(projectID)) {
        throw new Error("Invalid projectId");
    }



    const body = await req.json();
    const {
        taskName,
        committeeID,
        softDeadline,
        hardDeadline,
        hasBlastDate,
        blastDate,
        priority,
        manpowerRequired,
        documentType
    } = body;

    // 1. Required Fields Check (Presence)
    if (!taskName?.trim()) return new Response("Task name is required", { status: 400 });
    if (!committeeID) return new Response("Committee is required", { status: 400 });
    if (!softDeadline || !hardDeadline) return new Response("Both deadlines are required", { status: 400 });
    if (!priority) return new Response("Priority is required", { status: 400 });



    const { data: commData, error: commError } = await supabase
        .from("committee")
        .select("driveID, driveLink")
        .eq("committeeID", committeeID)
        .single();

    if (commError) { return NextResponse.json({ error: commError }, { status: 400 }); }

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("ownerID, driveID")
        .eq("projectID", projectID)
        .single();

    if (projectError) { return NextResponse.json({ error: projectError },{ status: 400 });}


    
    let newDoc;

    console.log("projectOwnerID: " + project?.ownerID);
    console.log("commData driveID: " + commData?.driveID);
    console.log("taskName: " + taskName);
    console.log("document Type: " + documentType);

    if (documentType != "none") {
        // We create a new empty Google Doc
        newDoc = await createGoogleFile(
            project?.ownerID,
            commData?.driveID,
            taskName,
            documentType
        );
    }
    
    console.log("New Doc: " + newDoc);

    // 2. Logic Check: Deadlines
    const soft = new Date(softDeadline);
    const hard = new Date(hardDeadline);

    if (isNaN(soft.getTime()) || isNaN(hard.getTime())) {
        return new Response("Invalid date format", { status: 400 });
    }

    if (soft > hard) {
        return new Response("Soft deadline cannot be after the hard deadline", { status: 400 });
    }

    // 3. Conditional Check: Blast Date
    if (hasBlastDate && !blastDate) {
        return new Response("Blast date is required if 'Has Blast Date' is selected", { status: 400 });
    }

    // 4. Type Check: Manpower
    const manpower = Number(manpowerRequired);
    if (isNaN(manpower) || manpower < 1) {
        return new Response("Manpower must be a number greater than 0", { status: 400 });
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert([
            {
                taskName: taskName,
                committeeID: committeeID,
                projectID: projectID, 
                softDeadline: softDeadline,
                hardDeadline: hardDeadline, // Matching the 'hardDeadlinee' typo in your schema
                blastDate: hasBlastDate ? blastDate : null,
                manpowerRequired: Number(manpowerRequired),
                priority: priority,
                status: "NotStarted",
                driveID: newDoc?.id,
                driveLink: newDoc?.webViewLink
            },
        ])
        .select();

    if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
        { message: "Task Created", data },
        { status: 201 }
    );
}

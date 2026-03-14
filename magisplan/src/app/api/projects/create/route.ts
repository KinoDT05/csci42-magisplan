import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



export async function POST(req: Request) {
    const supabase = await createClient();
    const {
        projectName,
        projectDescription,
        startDate,
        targetDate,
        driveLink,
        userID,
        committees,
        modDisplayName
    } = await req.json();

    console.log(projectName);
    console.log(projectDescription);
    console.log(startDate);
    console.log(targetDate);
    console.log(driveLink);
    console.log(userID);
    console.log(committees);

    if (!projectName ||
        !projectDescription ||
        !startDate ||
        !targetDate ||
        !userID ||
        !committees
    ) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        );
    }

    console.log("Test 1")
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
            projectName,
            projectDescription,
            startDate,
            targetDate,
            driveLink,
        })
        .select()
        .single();
    console.log("Test 2")
    if (projectError || !project) {
        return NextResponse.json(
        { error: projectError?.message },
        { status: 400 }
        );
    }

    // Get projectID to be passed down to the next entities to be madee
    const projectID = project.projectID;
    const moderatorComm = "Moderators";

    // Creates a committee for moderator and gets and stores data to modCommData
    const { data: modCommData, error: insertErrorModCommittee } = await supabase.from("committee").insert({
        projectID: projectID,
        committeeName: moderatorComm
    }).select().single();

    if (insertErrorModCommittee) {
        return NextResponse.json(
            { error: insertErrorModCommittee.message },
            { status: 400 }
        );
    }

    const modCommID = modCommData.committeeID;


    // Make the creator a moderator of the project
    const {error: insertErrorMod } = await supabase.from("project_members").insert({
        userID: userID,
        projectID: projectID,
        committeeID: modCommID,
        role: "Moderator",
        displayName: modDisplayName
    });

    if (insertErrorMod) {
        return NextResponse.json(
            { error: insertErrorMod.message },
            { status: 400 }
        );
    }


    for (let i = 0; i < committees.length; i++) {
        const { error: insertErrorComm } = await supabase.from("committee").insert({
            projectID: project.projectID,
            committeeName: committees[i].name,
            permission: committees[i].permissions
        });

        if (insertErrorComm) {
            return NextResponse.json(
                { error: insertErrorComm.message },
                { status: 400 }
            );
        }
    }

    return NextResponse.json(
        { message: "Project created" },
        { status: 201 }
    );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

import bcrypt from 'bcryptjs';


export async function POST(req: Request) {
    const supabase = await createClient();
    const {
        emailAddress,
        password,
        firstName,
        middleName,
        lastName,
        contactNumber,
        username
    } = await req.json();

    if (!emailAddress ||
        !password ||
        !firstName ||
        !middleName ||
        !lastName ||
        !contactNumber
    ) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailAddress,
        password: password,
        options: {
            data: {
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
            },
        },
    });

    if (authError) {
        return NextResponse.json(
        { error: authError.message },
        { status: 400 }
        );
    }

    if (!authData.user) {
        return NextResponse.json(
            { error: "User creation failed" },
            { status: 400 }
        );
    }

    const { error: insertError } = await supabaseAdmin.from("users").upsert({
        userID: authData.user.id,
        emailAddress,
        firstName,
        middleName,
        lastName,
        contactNumber,
        password: hashedPassword,
        username
    });

    if (insertError) {
        return NextResponse.json(
            { error: insertError.message },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { message: "User created! Check your email to verify!" },
        { status: 201 }
    );
}

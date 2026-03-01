import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    const {
        emailAddress,
        password,
        firstName,
        middleName,
        lastName,
        contactNumber,
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

    const { error: insertError } = await supabase.from("users").upsert({
        userID: authData.user.id,
        emailAddress,
        firstName,
        middleName,
        lastName,
        contactNumber,
        password: hashedPassword
    });

    if (insertError) {
        return NextResponse.json(
            { error: insertError.message },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { message: "User created" },
        { status: 201 }
    );
}

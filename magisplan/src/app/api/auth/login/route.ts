import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    const { email, password } = await req.json();

    if (!email || !password ) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        );
    }

    const { data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return NextResponse.json(
        { error: error.message },
        { status: 401 }
        );
    }

    return NextResponse.json(
        { message: "Login successful", session: data.session },
        { status: 200 }
    );
}

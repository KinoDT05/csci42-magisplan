import { getOAuthClient } from '@/lib/google-drive';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) return new Response("No code provided", { status: 400 });

    try {
        const client = await getOAuthClient();
        const { tokens } = await client.getToken(code);

        // This is where we extract the email
        // verifyIdToken ensures the token is actually from Google and hasn't been tampered with
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleEmail = payload?.email;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const updateData = {
            google_connected: true,
            google_email: googleEmail, 
        };

        if (tokens.refresh_token) {
            updateData.google_refresh_token = tokens.refresh_token;
        }

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('userID', user.id);

        if (error) throw error;

    } catch (error) {
        console.error("Google Callback Error:", error.message);
        redirect('/user/dashboard?error=google_auth_failed');
    }

    redirect('/user/dashboard?success=google_connected');
}
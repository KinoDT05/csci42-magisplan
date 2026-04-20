import { getOAuthClient } from '@/lib/google-drive';

export async function GET() {
    const client = await getOAuthClient();

    const url = client.generateAuthUrl({
        access_type: 'offline', // REQUIRED for refresh_token
        prompt: 'consent',     // Forces Google to give a refresh_token every time
        scope: [
            'openid',
            'https://www.googleapis.com/auth/drive.file', // Access only files created by THIS app
            'https://www.googleapis.com/auth/userinfo.email'
        ],
    });

    return Response.redirect(url);
}
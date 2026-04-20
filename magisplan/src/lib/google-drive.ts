'use server'

import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

/**
 * 1. Initializer: Creates a "clean" OAuth2 client
 * We use a function here so we can call it in different contexts.
 */
export async function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

/**
 * 2. Authorized Client: Injects a specific user's credentials
 * This is the workhorse of your service.
 */
export async function getAuthorizedDriveClient(userId: string) {
    const supabase = await createClient();
    const oauth2Client = await getOAuthClient();

    // Fetch the user's refresh token from your database
    const { data, error } = await supabase
        .from('users')
        .select('google_refresh_token')
        .eq('userID', userId)
        .single();

    if (error || !data?.google_refresh_token) {
        throw new Error('User has not connected their Google Drive account.');
    }

    // Set the credentials. The library will automatically handle
    // refreshing the access_token if it has expired.
    oauth2Client.setCredentials({
        refresh_token: data.google_refresh_token
    });

    // Listen for 'tokens' events to update the DB if a new refresh token is issued
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            await supabase
                .from('profiles')
                .update({ google_refresh_token: tokens.refresh_token })
                .eq('id', userId);
        }
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * 3. Feature: Create a Folder
 */
export async function createDriveFolder(userId: string, name: string, parentId?: string) {
    try {
        const drive = await getAuthorizedDriveClient(userId);

        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : [],
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, webViewLink',
        });

        return response.data;
    } catch (error) {
        console.error('OAuth Folder Creation Error:', error.message);
        throw new Error(error.message || 'Failed to create folder in user Drive');
    }
}

/**
 * 4. Feature: Delete/Trash a Folder (Optional but helpful)
 */
export async function deleteDriveFolder(userId: string, folderId: string) {
    const drive = await getAuthorizedDriveClient(userId);
    await drive.files.update({
        fileId: folderId,
        requestBody: { trashed: true },
    });
}

export async function shareFolderWithUser(
    ownerId: string,
    folderId: string,
    userEmail: string,
    role: 'reader' | 'writer' = 'writer'
) {
    try {
        const drive = await getAuthorizedDriveClient(ownerId);

        await drive.permissions.create({
            fileId: folderId,
            requestBody: {
                type: 'user',
                role: role, // 'writer' is equivalent to 'Editor'
                emailAddress: userEmail,
            },
            // Notifies the person via email that they now have access
            sendNotificationEmail: true,
        });

        return { success: true };
    } catch (error: any) {
        console.error('Sharing Error:', error.message);
        throw new Error('Could not share folder with the new member.');
    }
}

type GoogleDocType = 'doc' | 'sheet' | 'slide';

const MIME_TYPES: Record<GoogleDocType, string> = {
    doc: 'application/vnd.google-apps.document',
    sheet: 'application/vnd.google-apps.spreadsheet',
    slide: 'application/vnd.google-apps.presentation',
};

export async function createGoogleFile(
    ownerId: string,
    folderId: string,
    fileName: string,
    type: GoogleDocType
) {
    try {
        const drive = await getAuthorizedDriveClient(ownerId);

        const normalizedType = type.toLowerCase() as GoogleDocType;
        const selectedMimeType = MIME_TYPES[normalizedType] || MIME_TYPES.doc;

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: selectedMimeType,
                parents: [folderId], // The ID from your committee table
            },
            supportsAllDrives: true,
            fields: 'id, name, webViewLink',


        });

        console.log("--- GOOGLE FILE DEBUG ---");
        console.log("Created Name:", response.data.name);
        console.log("MimeType used:", MIME_TYPES[type]);
        console.log("Parent ID used:", folderId);
        console.log("Link:", response.data.webViewLink);

        return response.data;
    } catch (error) {
        console.error(`Error creating Google ${type}:`, error.message);
        throw new Error(`Failed to create ${type}`);
    }
}
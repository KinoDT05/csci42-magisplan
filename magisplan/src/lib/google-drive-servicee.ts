'use server'

import { google } from 'googleapis';

const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// This replace logic handles both literal newlines and escaped \n strings
const serviceKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// 1. Initialize Auth using the Options Object pattern
const auth = new google.auth.JWT({
    email: serviceEmail,
    key: serviceKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth: auth });

export async function createDriveFolder(name: string, parentId?: string) {
    
    try {
        // Force a token refresh to check if credentials work before calling the API
        await auth.getAccessToken();

        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : [process.env.ROOT_APP_FOLDER_ID!],
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, webViewLink',
        });

        return response.data;
    } catch (error: any) {
        // Detailed logging: this will tell us if it's an Auth error or a Permission error
        console.error('Detailed Google Error:', error.response?.data || error.message);
        throw new Error(error.message || 'Could not create folder in Google Drive');
    }
}
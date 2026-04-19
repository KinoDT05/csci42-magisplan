'use client'

import { useState } from 'react';
import { createDriveFolder } from '@/lib/google-drive';

export default function CreateFolderTest({ userId, isConnected }) {
    const [loading, setLoading] = useState(false);
    const [folderInfo, setFolderInfo] = useState(null);
    const [error, setError] = useState(null);

    const handleCreate = async () => {
        if (!isConnected) {
            setError("Please connect your Google Drive first!");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createDriveFolder(userId, "MagisPlan Test Folder");

            setFolderInfo({
                id: result.id,
                link: result.webViewLink
            });
        } catch (err) {
            setError(err?.message || "Failed to create folder");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 border rounded-xl bg-white shadow-sm max-w-md">
            <h3 className="text-lg font-semibold mb-2">Drive Integration Test</h3>

            {!isConnected ? (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm mb-4">
                    ⚠️ Your Google account is not linked.
                </div>
            ) : (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4">
                    ✅ Google Drive Linked
                </div>
            )}

            <button
                onClick={handleCreate}
                disabled={loading || !isConnected}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${loading || !isConnected
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {loading ? 'Creating in your Drive...' : 'Create "MagisPlan Test Folder"'}
            </button>

            {error && (
                <p className="mt-3 text-red-500 text-sm font-medium">❌ {error}</p>
            )}

            {folderInfo && (
                <div className="mt-4 p-3 bg-gray-50 border rounded-md">
                    <p className="text-sm text-gray-600 font-bold">Success!</p>
                    <p className="text-xs text-gray-500 truncate">ID: {folderInfo.id}</p>
                    <a
                        href={folderInfo.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm underline mt-2 inline-block"
                    >
                        Open Folder in Drive ↗
                    </a>
                </div>
            )}
        </div>
    );
}
export default function GoogleSettings({ isConnected }) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">Google Drive Ownership</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect your Drive so projects are created in your account.
      </p>
      
      {isConnected ? (
        <span className="text-green-600 font-bold">✅ Account Linked</span>
      ) : (
        <a 
          href="/api/auth/google" 
          className="bg-blue-600 text-white px-4 py-2 rounded shadow-md"
        >
          Connect Google Drive
        </a>
      )}
    </div>
  );
}
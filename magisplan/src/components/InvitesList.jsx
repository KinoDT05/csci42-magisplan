export default function InvitesList({ invites, onRespond, isConnected, onRequireGoogle }) {
    const respondToInvite = async (committeeID, role, response) => {
        const res = await fetch(`/api/user/respond-invite?committee=${committeeID}&role=${role}&response=${response}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        console.log(json);
        if (res.ok) {
            onRespond();
        }
    };

    return (
        <ul className="space-y-4">
            {invites.map((invite, index) => (
                <li key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-2">
                    <div>
                        <p className="font-bold text-[var(--main)] text-lg">{invite.projectName}</p>
                        <p className="text-gray-500 text-xs mt-1">{invite.projectDescription}</p>
                    </div>
                    
                    <div className="pt-1">
                        <p className="text-sm text-gray-600">Committee: <span className="font-bold text-gray-900">{invite.committeeName}</span></p>
                        <p className="text-sm text-gray-600">Role: <span className="font-bold text-gray-900">{invite.role}</span></p>
                    </div>
                    
                    <div className="flex gap-3 pt-3">
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors flex-1 shadow-sm"
                            onClick={() => {
                                if (!isConnected) {
                                    onRequireGoogle();
                                } else {
                                    respondToInvite(invite.committeeID, invite.role, "accept");
                                    onRespond();
                                }
                            }}
                        >
                            Accept
                        </button>
                        
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors flex-1 shadow-sm"
                            onClick={() => respondToInvite(invite.committeeID, invite.role, "deny")}
                        >
                            Deny
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}
export default function InvitesList({ invites, onRespond }) {
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
        <ul className="space-y-3">
            {invites.map((invite, index) => (
                <li key={index} className="rounded-xl p-4 shadow-sm space-y-1">
                    <p className="font-bold text-lg">{invite.projectName}</p>
                    <p className="text-gray-500 text-sm">{invite.projectDescription}</p>
                    <p className="text-sm">Committee: <span className="font-medium">{invite.committeeName}</span></p>
                    <p className="text-sm">Role: <span className="font-medium">{invite.role}</span></p>
                    <button
                        style={{ backgroundColor: "#16a34a" }}
                        className="text-white px-4 py-1 rounded-lg text-sm"
                        onClick={() => respondToInvite(invite.committeeID, invite.role, "accept")}
                    >
                        Accept
                    </button>
                    <button
                        style={{ backgroundColor: "#dc2626" }}
                        className="text-white px-4 py-1 rounded-lg text-sm"
                        onClick={() => respondToInvite(invite.committeeID, invite.role, "deny")}
                    >
                        Deny
                    </button>
                </li>
            ))}
        </ul>
    );
}
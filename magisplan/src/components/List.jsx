export default function List({ data = [] }) {
    return (
        <ul className="space-y-1">
            {data.map((event) => (
                <li key={event.eventID} className="text-[10px] leading-tight bg-blue-100 text-blue-800 p-1 rounded truncate">
                    {event.eventName}
                </li>
            ))}
        </ul>
    );
}
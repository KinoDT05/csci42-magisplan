export default function ProjectList({ projects } ) {
    const rows = [];
    console.log(projects);
    for (let i = 0; i < projects.length; i += 3) {
        rows.push(projects.slice(i, i + 3));
    }
    return (
        <table className="w-full border-separate border-spacing-4">
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((item, colIndex) => (
                            <td key={colIndex} className="p-0 rounded-2xl shadow-md overflow-hidden">
                                <div className="bg-gray-300 h-32" />
                                <div className="bg-blue-900 p-3">
                                    <p className="font-bold text-black text-sm">hi</p>
                                    <p className="font-bold text-black text-sm">{item.projectName}</p>
                                    <p className="text-blue-300 text-xs">{item.targetDate}</p>
                                </div>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
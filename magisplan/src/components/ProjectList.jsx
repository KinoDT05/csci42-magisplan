import Link from "next/link";

export default function ProjectList({ projects }) {
    return (
        <div className="grid grid-cols-3 gap-4 p-4">
            {projects.map((item, index) => (
                <Link key={index} href={`/projects/${item.projectID}/dashboard`}>
                <div
                    
                    className="rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="bg-gray-300 h-32" />
                    <div className="bg-blue-900 p-3">
                        <p className="font-bold text-white text-sm">{item.projectName}</p>
                        <p className="font-bold text-white text-sm">{item.projectDescription}</p>
                        <p className="text-blue-300 text-xs">{item.targetDate}</p>
                    </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

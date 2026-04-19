import { motion } from "framer-motion";
import Link from "next/link";

export default function ProjectList({ projects }) {
    if (!projects || projects.length === 0) {
        return <p className="text-gray-500 py-8 px-4 text-sm font-medium">No projects found.</p>;
    }
    
    return (
        <div className="grid grid-cols-3 gap-6 py-4">
            {projects.map((item, index) => (
                <Link key={item.projectID || index} href={`/projects/${item.projectID}/dashboard`}>
                    <motion.div
                        className="rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-48 bg-white"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -4 }}
                    >
                        {/* Top Gray Area */}
                        <div className="bg-[#dcdcdc] flex-grow" />
                        
                        {/* Bottom Dark Blue Area */}
                        <div className="bg-[#023e7d] p-4 flex flex-col justify-center h-20">
                            <p className="font-bold text-white text-base truncate">{item.projectName}</p>
                            {/* In a real app, calculate actual 'updated ago' time. Using targetDate as placeholder */}
                            <p className="text-blue-200 text-xs mt-0.5 truncate">
                                Target: {new Date(item.targetDate).toLocaleDateString()}
                            </p>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </div>
    );
}

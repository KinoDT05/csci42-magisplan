import { motion } from "framer-motion";
import Link from "next/link";

export default function ProjectList({ projects }) {
    return (
        <div className="grid grid-cols-3 gap-4 p-4">
            {projects.map((item, index) => (
                <Link key={index} href={`/projects/${item.projectID}/dashboard`}>
                    <motion.div
                    className="rounded-2xl shadow-xl overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                    <div className="bg-gray-300 h-32" />
                    <div className="bg-blue-900 p-3">
                        <p className="font-bold text-white text-sm">{item.projectName}</p>
                        <p className="font-bold text-white text-sm">{item.projectDescription}</p>
                        <p className="text-blue-300 text-xs">{item.targetDate}</p>
                    </div>
                    </motion.div>
                </Link>
            ))}
        </div>
    );
}

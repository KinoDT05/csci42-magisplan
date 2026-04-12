import { motion } from "framer-motion";
import AssignTaskModal from "@/components/AssignTaskModal";
export default function TaskCard({ task, num, userRole, userComm, onRefresh}) {
    const canAssign = userComm === "Moderators" || (userComm === task.committeeName && userRole === "Head");
    const isAssigned = task.assignedPerson && task.assignedPerson !== "None";

  return (
      <motion.div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr_0.25fr] gap-4  bg-white p-3 items-center shadow-lg rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: num * 0.2 }}
      >
      
        <div className="font-semibold">{task.taskName}</div>
        <div>
              {isAssigned ? (
                  task.assignedPerson
              ) : canAssign ? (
                  
                      <AssignTaskModal taskID={task.taskID} taskName={task.taskName} manpowerRequired={task.manpowerRequired} committeeID={task.committeeID} onRefresh={onRefresh} />
              ) : (
                  <span>None</span>
              )}
        </div>
        <div>{task.softDeadline ?? "None"}</div>
        <div>{task.hardDeadline ?? "None"}</div>
        <div>{task.blastDate ?? "None"}</div>
        <div>{task.priority}</div>
        <div>{task.status}</div>

        {/* edit/delete button goes here */}
        <div></div>

    </motion.div>

    
  );
}
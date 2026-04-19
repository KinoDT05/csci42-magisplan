import { motion } from "framer-motion";
import AssignTaskModal from "@/components/AssignTaskModal";
import UpdateTaskModal from "@/components/UpdateTaskModal";
import Link from "next/link";

export default function TaskCard({ task, num, userRole, userComm, userID, onRefresh}) {
    const canAssign = userComm === "Moderators" || (userComm === task.committeeName && userRole === "Head");
    const isAssigned = task.assignedPerson && task.assignedPerson !== "None";
    const userTask = task.assignedUserIDs?.includes(userID);
    const canUpdate = canAssign || userTask;

    const formatDate = (dateString) => {
        if (!dateString) return "None";

        const date = new Date(dateString + "T00:00:00");

        if (isNaN(date.getTime())) return "None"; 

        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    const formatStatus = (status) => {
        return status
            .replace(/([A-Z])/g, " $1")
            .trim();
    };

  return (
    <motion.div className="grid grid-cols-8 gap-4 px-5 py-3 text-sm text-center items-center rounded-xl hover:bg-white/40 transition-colors"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: num * 0.2 }}
    >

        <Link href={task.driveLink ?? "#"}>
            <div className="font-semibold text-center">{task.taskName}</div>
        </Link>
        
        <div>
                {isAssigned ? (
                    task.assignedPerson
                ) : (
                    <span>None</span>
                )}
        </div>

        <div>{task.softDeadline ? formatDate(task.softDeadline) : "None"}</div>
        <div>{task.hardDeadline ? formatDate(task.hardDeadline) : "None"}</div>
        <div>{task.blastDate ? formatDate(task.blastDate) : "None"}</div>
        <div>
            <span
                className={`badge-pill ${
                task.priority === "High"
                    ? "badge-red"
                    : task.priority === "Medium"
                    ? "badge-yellow"
                    : "badge-green"
                }`}
            >
                {task.priority}
            </span>
        </div>
        <div className="flex justify-center">
            <span
                className={`badge-pill text-[9px] px-2 max-w-full ${
                task.status === "NotStarted"
                    ? "badge-red"
                    : task.status === "Complete"
                    ? "badge-green"
                    : "badge-gray"
                }`}
            >
                {formatStatus(task.status)}
            </span>
        </div>

        {/* edit/delete button goes here */}
          <div>
              {task.status === "Complete" ? (
                  <span>...</span>
              ) : isAssigned ? (
                  canUpdate ? (
                      <UpdateTaskModal
                          taskID={task.taskID}
                          taskName={task.taskName}
                          userRole={userRole}
                          userComm={userComm}
                          taskStatus={task.status}
                          onRefresh={onRefresh}
                      />
                  ) : (
                      <span>...</span>
                  )
              ) : canAssign ? (
                  <AssignTaskModal
                      taskID={task.taskID}
                      taskName={task.taskName}
                      manpowerRequired={task.manpowerRequired}
                      committeeID={task.committeeID}
                      onRefresh={onRefresh}
                  />
              ) : (
                  <span>...</span>
              )}
          </div>

    </motion.div>

    
  );
}
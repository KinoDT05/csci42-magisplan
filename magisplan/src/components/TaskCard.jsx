export default function TaskCard({ task }) {
  return (
    <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr_0.25fr] gap-4  bg-white p-3 items-center shadow-lg rounded-lg">
      
        <div className="font-semibold">{task.taskName}</div>
        <div>
            {task.assignedPerson && task.assignedPerson !== "None" ? (
                task.assignedPerson
            ) : (
                <button className="bg-[var(--main)] rounded-lg p-1 text-white">
                    Assign Task
                </button>
            )}
        </div>
        <div>{task.softDeadline ?? "None"}</div>
        <div>{task.hardDeadline ?? "None"}</div>
        <div>{task.blastDate ?? "None"}</div>
        <div>{task.priority}</div>
        <div>{task.status}</div>

        {/* edit/delete button goes here */}
        <div></div>

    </div>

    
  );
}
export default function TasksList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <p className="text-sm text-gray-500 mt-4 text-center">No tasks assigned.</p>;
  }

  return (
    <ul className="flex flex-col">
      {tasks.map((task) => {
        const date = new Date(task.hardDeadline);
        const day = date.toLocaleString("en-US", { weekday: "short" });
        const dayNum = date.getDate().toString().padStart(2, "0");

        return (
          <li key={task.taskID} className="flex items-center gap-5 py-4 border-b border-gray-300 last:border-0">
            {/* date */}
            <div className="text-center w-10 shrink-0 flex flex-col leading-tight text-gray-500">
              <span className="text-sm">{day}</span>
              <span className="text-base">{dayNum}</span>
            </div>

            {/* task info */}
            <div className="flex-1 flex flex-col">
              <span className="text-sm font-normal text-gray-600">
                {task.projectName ?? "No project"}
              </span>
              <span className="text-base font-bold text-gray-900 mt-0.5">
                {task.taskName}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
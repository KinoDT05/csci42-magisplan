export default function TasksList({ tasks }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-gray-500 mt-2">No tasks assigned.</p>;
  }

  return (
    <ul className="flex flex-col mt-2">
      {tasks.map((task) => {
        const date = new Date(task.hardDeadline);
        const day = date.toLocaleString("en-US", { weekday: "short" });
        const dayNum = date.getDate().toString().padStart(2, "0");

        return (
          <li key={task.taskID} className="flex items-center gap-4 py-4 border-b last:border-0">
            {/* date */}
            <div className="text-center text-sm w-10">
              <p>{day}</p>
              <p>{dayNum}</p>
            </div>

            {/* task info */}
            <div className="flex-1">
              <p className="text-sm font-semibold">{task.projectName ?? "No project"}</p>
              <p className="font-bold">{task.taskName}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
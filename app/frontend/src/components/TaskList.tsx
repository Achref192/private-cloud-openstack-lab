import { Task } from '../types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, updates: Partial<Task>) => void;
}

export default function TaskList({ tasks, onEdit, onDelete, onStatusChange }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500 dark:text-gray-400 py-12">
        Aucune tâche. Créez-en une pour commencer.
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task._id)}
          onStatusChange={(status) => onStatusChange(task._id, { status })}
        />
      ))}
    </div>
  );
}

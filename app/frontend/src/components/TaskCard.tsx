import { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}

const priorityColors = {
  low: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  medium: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
};

const statusLabels = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {task.title}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
        {task.description}
      </p>

      <div className="mb-4">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="todo">{statusLabels.todo}</option>
          <option value="in_progress">{statusLabels.in_progress}</option>
          <option value="done">{statusLabels.done}</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Supprimer
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Créé le {new Date(task.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
}

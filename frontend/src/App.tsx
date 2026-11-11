import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import { Task } from './types';
import { api } from './services/api';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (task: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.createTask(task);
      await loadTasks();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await api.updateTask(id, updates);
      await loadTasks();
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
      await api.deleteTask(id);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            CloudMetrics Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />

        <div className="mt-8 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tâches de déploiement
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + Nouvelle tâche
          </button>
        </div>

        {loading ? (
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
            Chargement...
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onDelete={handleDeleteTask}
            onStatusChange={handleUpdateTask}
          />
        )}
      </main>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? (updates) => handleUpdateTask(editingTask._id, updates) : handleCreateTask}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

export default App;

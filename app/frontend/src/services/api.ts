import { Task, Stats, HealthCheck } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  getTasks: () => fetchApi<Task[]>('/tasks'),
  
  getTask: (id: string) => fetchApi<Task>(`/tasks/${id}`),
  
  createTask: (task: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  
  updateTask: (id: string, task: Partial<Task>) =>
    fetchApi<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
  
  deleteTask: (id: string) =>
    fetchApi<void>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
  
  getStats: () => fetchApi<Stats>('/tasks/stats'),
  
  getHealth: () => fetchApi<HealthCheck>('/health'),
};

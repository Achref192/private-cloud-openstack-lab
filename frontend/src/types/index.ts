export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  total: number;
  byStatus: {
    todo: number;
    in_progress: number;
    done: number;
  };
  completionRate: number;
}

export interface HealthCheck {
  status: string;
  hostname: string;
  db: 'connected' | 'disconnected';
  uptime: number;
  version: string;
}

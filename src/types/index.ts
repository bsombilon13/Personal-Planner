export type ActivityStatus = 'upcoming' | 'completed' | 'in-progress';
export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Recurrence {
  frequency: RecurrenceFrequency;
  endDate?: Date;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  date: Date;
  startTime: string; // ISO or simple time string
  duration: number; // in minutes
  category: string;
  status: ActivityStatus;
  recurrence?: Recurrence;
}

export type CalendarViewType = 'month' | 'week' | 'day';

export type CategoryColors = Record<string, string>;

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Comment {
  id: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignee?: string;
  createdAt: Date;
  subTasks: SubTask[];
  comments: Comment[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
}

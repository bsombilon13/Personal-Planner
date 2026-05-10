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
  endDate?: Date;
  startTime: string; // ISO or simple time string
  duration: number; // in minutes
  category: string;
  status: ActivityStatus;
  recurrence?: Recurrence;
}

export type CalendarViewType = 'month' | 'week' | 'day' | 'list';

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

export type ProjectTaskStatus = 'todo' | 'in-progress' | 'completed' | 'pending' | 'under-review' | 'follow-up';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignee?: string;
  creatorName: string;
  createdAt: Date;
  subTasks: SubTask[];
  comments: Comment[];
  attachments: ProjectAsset[];
  order: number;
}

export interface ProjectAsset {
  id: string;
  name: string;
  url: string;
  type: 'link' | 'file';
  fileType?: string;
  size?: number;
  createdAt: Date;
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

export interface GlobalNote {
  id: string;
  title: string;
  content: string;
  category: 'Brainstorming' | 'Meeting' | 'Personal' | 'Strategy' | 'Other';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  coverImage?: string;
  createdAt: Date;
  category?: string;
  assets?: ProjectAsset[];
  notes?: ProjectNote[];
}

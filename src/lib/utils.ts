import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isSameDay, startOfDay, isBefore, isAfter } from 'date-fns';
import { Activity, ProjectTask } from '@/src/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isActivityOnDay = (activity: Activity, day: Date) => {
  const targetDay = startOfDay(day);
  const activityStart = startOfDay(activity.date);

  if (isSameDay(activityStart, targetDay)) return true;
  if (!activity.recurrence || activity.recurrence.frequency === 'none') return false;
  
  if (isBefore(targetDay, activityStart)) return false;
  
  if (activity.recurrence.endDate && isAfter(targetDay, startOfDay(activity.recurrence.endDate))) return false;
  
  const frequency = activity.recurrence.frequency;
  
  if (frequency === 'daily') return true;
  
  if (frequency === 'weekly') {
    return activityStart.getDay() === targetDay.getDay();
  }
  
  if (frequency === 'monthly') {
    return activityStart.getDate() === targetDay.getDate();
  }
  
  return false;
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const calculateEndTime = (startTime: string, duration: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  return minutesToTime(endMinutes);
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return Math.max(0, endMinutes - startMinutes);
};

export const generateGoogleCalendarUrl = (activity: Activity): string => {
  const title = encodeURIComponent(activity.title);
  const description = encodeURIComponent(activity.description || '');
  const location = encodeURIComponent(activity.location || '');
  
  // Format dates: YYYYMMDDTHHmmSS
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const formatDate = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(hours)}${pad(minutes)}00`;
  };
  
  const start = formatDate(activity.date, activity.startTime);
  const end = formatDate(activity.date, calculateEndTime(activity.startTime, activity.duration));
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}`;
};

export const generateGoogleCalendarUrlForTask = (task: ProjectTask): string => {
  const title = encodeURIComponent(task.title);
  const description = encodeURIComponent(task.description || '');
  
  // Format dates: YYYYMMDD
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  };

  const dueDate = task.dueDate || task.createdAt;
  const start = formatDate(dueDate);
  // For all-day events, the end date should be the next day
  const endD = new Date(dueDate);
  endD.setDate(endD.getDate() + 1);
  const end = formatDate(endD);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}`;
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Sidebar from '@/src/components/Sidebar';
import Dashboard from '@/src/components/Dashboard';
import Calendar from '@/src/components/Calendar';
import ProjectDashboard from '@/src/components/ProjectDashboard';
import ActivityModal from '@/src/components/ActivityModal';
import { Activity, CategoryColors, Project, ProjectTask } from '@/src/types';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';

const DEFAULT_CATEGORY_COLORS: CategoryColors = {
  'Work': '#4f46e5',    // indigo-600
  'Design': '#3b82f6',   // blue-500
  'Meeting': '#10b981',  // emerald-500
  'Personal': '#f59e0b', // amber-500
};

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '1',
    title: 'Brand Strategy Review',
    description: 'Quarterly review of current brand positioning and future goals. Team brainstorm session on visual identity.',
    location: 'Conference Room Alpha',
    category: 'Work',
    date: new Date(),
    startTime: '10:00',
    duration: 90,
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'UI/UX Design Sprint',
    description: 'Rapid prototyping session for the mobile application. Focusing on the onboarding flow and user transitions.',
    location: 'Design Studio Lab',
    category: 'Design',
    date: new Date(),
    startTime: '14:00',
    duration: 120,
    status: 'in-progress'
  },
  {
    id: '3',
    title: 'Weekly Team Sync',
    description: 'Alignment meeting to discuss progress, blockers, and upcoming milestones for the next sprint.',
    location: 'Zoom Meeting',
    category: 'Meeting',
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    startTime: '09:00',
    duration: 60,
    status: 'upcoming'
  },
  {
    id: '4',
    title: 'Fitness Session',
    description: 'High-intensity interval training. Remember to bring water and a towel.',
    location: 'Local Gym / Park',
    category: 'Personal',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    startTime: '17:30',
    duration: 60,
    status: 'completed'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [categoryColors, setCategoryColors] = useState<CategoryColors>(DEFAULT_CATEGORY_COLORS);
  
  // Project Management State
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Brand Identity', description: 'Visual refresh for the 2026 launch.', color: '#4f46e5', createdAt: new Date() },
    { id: 'p2', name: 'Mobile App', description: 'Rebuilding the core customer experience.', color: '#10b981', createdAt: new Date() },
  ]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([
    { id: 't1', projectId: 'p1', title: 'Logo Design', status: 'completed', priority: 'high', subTasks: [{ id: 'st1', title: 'Brainstorming', isCompleted: true }, { id: 'st2', title: 'Sketching', isCompleted: true }] },
    { id: 't2', projectId: 'p1', title: 'Color Palette', status: 'in-progress', priority: 'medium', subTasks: [] },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>(undefined);

  const handleSaveActivity = (activityData: Omit<Activity, 'id'> | Activity) => {
    if ('id' in activityData) {
      // Update
      setActivities(activities.map(a => a.id === activityData.id ? activityData as Activity : a));
    } else {
      // Create
      const newActivity: Activity = {
        ...(activityData as Omit<Activity, 'id'>),
        id: Math.random().toString(36).substr(2, 9)
      };
      
      if (!categoryColors[newActivity.category]) {
        setActivities([...activities, newActivity]);
        setCategoryColors(prev => ({
          ...prev,
          [newActivity.category]: '#6366f1' 
        }));
      } else {
        setActivities([...activities, newActivity]);
      }
    }
  };

  const openAddModal = (date?: Date, startTime?: string) => {
    setEditingActivity(null);
    setDefaultDate(date);
    setDefaultStartTime(startTime);
    setIsModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setIsModalOpen(true);
  };

  const deleteActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const updateCategoryColor = (category: string, color: string) => {
    setCategoryColors(prev => ({
      ...prev,
      [category]: color
    }));
  };

  // Project Handlers
  const addProject = (name: string, description: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      createdAt: new Date()
    };
    setProjects([...projects, newProject]);
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    setProjectTasks(projectTasks.filter(t => t.projectId !== id));
  };

  const addProjectTask = (taskData: Omit<ProjectTask, 'id' | 'subTasks'>) => {
    const newTask: ProjectTask = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      subTasks: []
    };
    setProjectTasks([...projectTasks, newTask]);
  };

  const updateProjectTask = (task: ProjectTask) => {
    setProjectTasks(projectTasks.map(t => t.id === task.id ? task : t));
  };

  const deleteProjectTask = (id: string) => {
    setProjectTasks(projectTasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onAddEvent={() => openAddModal()} />
      
      <main className="ml-16 transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">
               {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab === 'calendar' ? 'Calendarization' : 'Project Management'}
             </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => openAddModal()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
            >
              <Plus size={16} />
              Add Event
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard activities={activities} categoryColors={categoryColors} />
            </motion.div>
          ) : activeTab === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Calendar 
                activities={activities} 
                categoryColors={categoryColors}
                onAddActivity={(date, startTime) => openAddModal(date, startTime)}
                onEditActivity={openEditModal}
                onSaveActivity={handleSaveActivity}
                onDeleteActivity={deleteActivity}
                onUpdateCategoryColor={updateCategoryColor}
                onAddCategory={(category, color) => {
                  setCategoryColors(prev => ({ ...prev, [category]: color }));
                }}
              />
            </motion.div>
          ) : activeTab === 'projects' ? (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ProjectDashboard 
                projects={projects}
                tasks={projectTasks}
                onAddProject={addProject}
                onDeleteProject={deleteProject}
                onAddTask={addProjectTask}
                onUpdateTask={updateProjectTask}
                onDeleteTask={deleteProjectTask}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <ActivityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveActivity}
        onAddCategory={(category, color) => {
          setCategoryColors(prev => ({ ...prev, [category]: color }));
        }}
        editingActivity={editingActivity}
        categoryColors={categoryColors}
        defaultDate={defaultDate}
        defaultStartTime={defaultStartTime}
      />
    </div>
  );
}

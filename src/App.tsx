/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent } from 'react';
import Sidebar from '@/src/components/Sidebar';
import Dashboard from '@/src/components/Dashboard';
import Calendar from '@/src/components/Calendar';
import ProjectDashboard from '@/src/components/ProjectDashboard';
import ActivityModal from '@/src/components/ActivityModal';
import { Activity, CategoryColors, Project, ProjectTask, GlobalNote } from '@/src/types';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Download, Upload, StickyNote } from 'lucide-react';
import NotesView from '@/src/components/NotesView';

const STORAGE_KEYS = {
  ACTIVITIES: 'event_master_activities',
  PROJECTS: 'event_master_projects',
  TASKS: 'event_master_tasks',
  COLORS: 'event_master_colors',
  NOTES: 'event_master_global_notes'
};

const revivifyDates = (key: string, value: any) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?Z$/.test(value)) {
    return new Date(value);
  }
  return value;
};

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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // Load initial state from localStorage
  const [activities, setActivities] = useState<Activity[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return stored ? JSON.parse(stored, revivifyDates) : INITIAL_ACTIVITIES;
  });
  
  const [categoryColors, setCategoryColors] = useState<CategoryColors>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.COLORS);
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORY_COLORS;
  });
  
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return stored ? JSON.parse(stored, revivifyDates) : [
      { id: 'p1', name: 'Brand Identity', description: 'Visual refresh for the 2026 launch.', color: '#4f46e5', icon: 'Sparkles', createdAt: new Date(), category: 'Branding' },
      { id: 'p2', name: 'Mobile App', description: 'Rebuilding the core customer experience.', color: '#10b981', icon: 'Smartphone', createdAt: new Date(), category: 'Development' },
    ];
  });

  // Initialize activeProjectId if not set
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects]);
  
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    return stored ? JSON.parse(stored, revivifyDates) : [
      { id: 't1', projectId: 'p1', title: 'Logo Design', status: 'completed', priority: 'high', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), assignee: 'Bryan Sombilon', creatorName: 'Bryan Sombilon', createdAt: new Date(new Date().setDate(new Date().getDate() - 5)), subTasks: [{ id: 'st1', title: 'Brainstorming', isCompleted: true }, { id: 'st2', title: 'Sketching', isCompleted: true }], comments: [{ id: 'c1', authorName: 'Bryan Sombilon', text: 'Great first pass on the sketches!', createdAt: new Date() }], order: 0, attachments: [] },
      { id: 't2', projectId: 'p1', title: 'Color Palette', status: 'in-progress', priority: 'medium', dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), assignee: 'Bryan Sombilon', creatorName: 'Bryan Sombilon', createdAt: new Date(new Date().setDate(new Date().getDate() - 3)), subTasks: [], comments: [], order: 1, attachments: [] },
    ];
  });

  const [globalNotes, setGlobalNotes] = useState<GlobalNote[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (stored) return JSON.parse(stored, revivifyDates);
    return [
      {
        id: 'n1',
        title: 'Q4 Strategy Brainstorming',
        content: '# Q4 Goals\n\n- Expand market reach\n- Launch new mobile features\n- Improve retention by 15%\n\n### Key Pillars\n1. **Innovation**: Focus on AI-driven planning tools.\n2. **Community**: Build stronger user forums and feedback loops.',
        category: 'Brainstorming',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'n2',
        title: 'Weekly Sync Notes - May 7',
        content: '## Attendees\n- Bryan Sombilon\n- Sarah\n- Mike\n\n## Discussion\n- Discussed the new dashboard layout.\n- Decided to move forward with the Apple Notes style for the global journal.\n- Action item: Update the sidebar to include the new entry point.',
        category: 'Meeting',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(projectTasks));
  }, [projectTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLORS, JSON.stringify(categoryColors));
  }, [categoryColors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(globalNotes));
  }, [globalNotes]);
  const [isAddingProject, setIsAddingProject] = useState(false);

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
    const activity = activities.find(a => a.id === id);
    if (window.confirm(`Are you sure you want to delete the activity "${activity?.title}"?`)) {
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  const updateCategoryColor = (category: string, color: string) => {
    setCategoryColors(prev => ({
      ...prev,
      [category]: color
    }));
  };

  // Project Handlers
  const addProject = (name: string, description: string, color?: string, icon?: string, category?: string, coverImage?: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      category,
      color: color || '#4f46e5',
      icon: icon || 'Briefcase',
      coverImage,
      createdAt: new Date()
    };
    setProjects([...projects, newProject]);
  };

  const deleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (window.confirm(`Are you sure you want to delete "${project?.name}"? This action cannot be undone and will permanently remove all associated tasks, notes, and assets.`)) {
      setProjects(projects.filter(p => p.id !== id));
      setProjectTasks(projectTasks.filter(t => t.projectId !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    }
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const addProjectTask = (taskData: Omit<ProjectTask, 'id' | 'subTasks' | 'comments' | 'attachments' | 'createdAt' | 'creatorName' | 'order'>) => {
    const newTask: ProjectTask = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      creatorName: 'Bryan Sombilon',
      createdAt: new Date(),
      subTasks: [],
      comments: [],
      attachments: [],
      order: projectTasks.filter(t => t.projectId === taskData.projectId && t.status === taskData.status).length
    };
    setProjectTasks([...projectTasks, newTask]);
  };

  const updateProjectTask = (task: ProjectTask) => {
    setProjectTasks(projectTasks.map(t => t.id === task.id ? task : t));
  };

  const deleteProjectTask = (id: string) => {
    const task = projectTasks.find(t => t.id === id);
    if (window.confirm(`Are you sure you want to delete the task "${task?.title}"?`)) {
      setProjectTasks(projectTasks.filter(t => t.id !== id));
    }
  };

  const handleExport = () => {
    const data = {
      activities,
      projects,
      projectTasks,
      categoryColors,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-master-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string, revivifyDates);
        if (data.activities && Array.isArray(data.activities)) setActivities(data.activities);
        if (data.projects && Array.isArray(data.projects)) setProjects(data.projects);
        if (data.projectTasks && Array.isArray(data.projectTasks)) setProjectTasks(data.projectTasks);
        if (data.categoryColors) setCategoryColors(data.categoryColors);
        alert('Data imported successfully!');
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to import data. Please ensure the file is a valid export JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        projects={projects}
        projectTasks={projectTasks}
        onAddProject={() => setIsAddingProject(true)}
        onDeleteProject={deleteProject}
      />
      
      <main className="ml-16 transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
               {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab === 'calendar' ? 'Calendarization' : activeTab === 'notes' ? 'Journal & Brainstorming' : 'Projects Workspace'}
            </h1>
            
            {activities.filter(a => a.status === 'upcoming').length > 0 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Up:</span>
                 <span className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">
                   {activities.filter(a => a.status === 'upcoming').sort((a, b) => a.date.getTime() - b.date.getTime())[0].title}
                 </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button 
                onClick={handleExport}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all"
                title="Export Data"
              >
                <Download size={18} />
              </button>
              <label className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer" title="Import Data">
                <Upload size={18} />
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
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
              <Dashboard 
                activities={activities} 
                categoryColors={categoryColors} 
                projects={projects}
                projectTasks={projectTasks}
                setActiveTab={setActiveTab}
                setActiveProjectId={setActiveProjectId}
              />
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
                projects={projects}
                projectTasks={projectTasks}
                categoryColors={categoryColors}
                onAddActivity={(date, startTime) => openAddModal(date, startTime)}
                onEditActivity={openEditModal}
                onSaveActivity={handleSaveActivity}
                onDeleteActivity={deleteActivity}
                onUpdateCategoryColor={updateCategoryColor}
                onAddCategory={(category, color) => {
                  setCategoryColors(prev => ({ ...prev, [category]: color }));
                }}
                onUpdateTask={updateProjectTask}
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
                activeProjectId={activeProjectId}
                setActiveProjectId={setActiveProjectId}
                isAddingProject={isAddingProject}
                setIsAddingProject={setIsAddingProject}
                onAddProject={addProject}
                onDeleteProject={deleteProject}
                onUpdateProject={updateProject}
                onAddTask={addProjectTask}
                onUpdateTask={updateProjectTask}
                onDeleteTask={deleteProjectTask}
              />
            </motion.div>
          ) : activeTab === 'notes' ? (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full flex-1"
            >
              <NotesView 
                notes={globalNotes} 
                setNotes={setGlobalNotes} 
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

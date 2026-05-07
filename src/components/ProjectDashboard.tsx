import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Layout,
  PlusCircle,
  X,
  Edit2,
  MessageSquare,
  Send,
  Calendar as CalendarIcon,
  User,
  ArrowUp,
  ArrowDown,
  Share2
} from 'lucide-react';
import { Project, ProjectTask, SubTask, Comment } from '@/src/types';
import { cn, generateGoogleCalendarUrlForTask } from '@/src/lib/utils';
import { format } from 'date-fns';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectDashboardProps {
  projects: Project[];
  tasks: ProjectTask[];
  isAddingProject: boolean;
  setIsAddingProject: (val: boolean) => void;
  onAddProject: (name: string, description: string, color?: string) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Omit<ProjectTask, 'id' | 'subTasks' | 'comments' | 'createdAt'>) => void;
  onUpdateTask: (task: ProjectTask) => void;
  onDeleteTask: (id: string) => void;
}

export default function ProjectDashboard({ 
  projects, 
  tasks, 
  isAddingProject,
  setIsAddingProject,
  onAddProject, 
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: ProjectDashboardProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects[0]?.id || null);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4f46e5');
  
  const PALETTE = [
    '#6366f1', // indigo-500
    '#3b82f6', // blue-500
    '#22c55e', // green-500
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
  ];

  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  };
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [viewingTask, setViewingTask] = useState<ProjectTask | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in-progress' | 'completed'>('todo');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('dueDate');
  const [sortOrientation, setSortOrientation] = useState<'asc' | 'desc'>('asc');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectTasks = tasks
    .filter(t => t.projectId === activeProjectId)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) comparison = 0;
        else if (!a.dueDate) comparison = 1;
        else if (!b.dueDate) comparison = -1;
        else comparison = a.dueDate.getTime() - b.dueDate.getTime();
      } else if (sortBy === 'priority') {
        const priorityMap = { high: 0, medium: 1, low: 2 };
        comparison = priorityMap[a.priority] - priorityMap[b.priority];
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      } else {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrientation === 'asc' ? comparison : -comparison;
    });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
       // Find the task
       const task = tasks.find(t => t.id === activeId);
       if (task) {
          // If overId is a status, move to that status
          if (['todo', 'in-progress', 'completed'].includes(overId)) {
            onUpdateTask({ ...task, status: overId as any });
          } else {
            // If overId is another task, take its status
            const overTask = tasks.find(t => t.id === overId);
            if (overTask && overTask.status !== task.status) {
              onUpdateTask({ ...task, status: overTask.status });
            }
          }
       }
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName, newProjectDesc, selectedColor);
      setNewProjectName('');
      setNewProjectDesc('');
      setSelectedColor('#4f46e5');
      setIsAddingProject(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProjectId = newTaskProjectId || activeProjectId;
    if (newTaskTitle.trim() && finalProjectId) {
      onAddTask({
        projectId: finalProjectId,
        title: newTaskTitle,
        status: newTaskStatus,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined,
        assignee: newTaskAssignee.trim() || undefined,
      });
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskAssignee('');
      setNewTaskPriority('medium');
      setNewTaskStatus('todo');
      setIsAddingTask(false);
    }
  };

  const toggleSubTask = (task: ProjectTask, subTaskId: string) => {
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdateTask({ ...task, subTasks: updatedSubTasks });
  };

  const addSubTask = (task: ProjectTask, title: string) => {
    const newSubTask: SubTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      isCompleted: false,
    };
    onUpdateTask({ ...task, subTasks: [...task.subTasks, newSubTask] });
  };

  const deleteSubTask = (task: ProjectTask, subTaskId: string) => {
    onUpdateTask({ ...task, subTasks: task.subTasks.filter(st => st.id !== subTaskId) });
  };

  const updateTaskStatus = (task: ProjectTask, status: ProjectTask['status']) => {
    onUpdateTask({ ...task, status });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Search & Global Actions Bar */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center bg-slate-100 rounded-xl px-4 py-2 w-96 group focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <Layout size={18} className="text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search projects or tasks..." 
            className="bg-transparent border-0 focus:ring-0 text-sm w-full font-medium"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 focus:ring-0 text-xs font-bold text-slate-600 p-0 mr-2"
            >
              <option value="dueDate">Due Date</option>
              <option value="createdAt">Creation Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
            <button 
              onClick={() => setSortOrientation(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
              title={sortOrientation === 'asc' ? "Ascending" : "Descending"}
            >
              {sortOrientation === 'asc' ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              )}
            </button>
          </div>
          <button 
            onClick={() => setIsAddingProject(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Project List / Tabs Sidebar (Inside component) */}
        <div className="w-64 border-r border-slate-200 bg-white flex flex-col pt-4">
          <div className="px-6 mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projects</h2>
            <button onClick={() => setIsAddingProject(true)} className="text-slate-400 hover:text-indigo-600 transition-colors">
              <PlusCircle size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1">
            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                  activeProjectId === project.id 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center min-w-0">
                  <div className="w-2 h-2 rounded-full mr-3 shrink-0" style={{ backgroundColor: project.color }} />
                  <span className="text-sm font-bold truncate">{project.name}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Task Dashboard Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeProject ? (
              <motion.div 
                key={activeProject.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="p-8 pb-4">
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-3 mb-2"
                      >
                         <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: activeProject.color }}>
                           Project
                         </span>
                         <span className="text-xs font-medium text-slate-400">Created {format(activeProject.createdAt, 'MMM d, yyyy')}</span>
                      </motion.div>
                      <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-3xl font-black text-slate-900 tracking-tight"
                      >
                        {activeProject.name}
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 mt-2 font-medium max-w-xl"
                      >
                        {activeProject.description}
                      </motion.p>
                    </div>
                    
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 }}
                      className="flex gap-4"
                    >
                      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm min-w-[140px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progress</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900">
                             {projectTasks.length > 0 
                               ? Math.round((projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100) 
                               : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ backgroundColor: activeProject.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${projectTasks.length > 0 ? (projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100 : 0}%` }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                {/* Status Sections */}
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragEnd={handleDragEnd}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    {(['todo', 'in-progress', 'completed'] as const).map((status, index) => (
                      <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <TaskColumn 
                          status={status} 
                          projectTasks={projectTasks} 
                          onUpdateTask={onUpdateTask} 
                          onDeleteTask={onDeleteTask} 
                          setViewingTask={setViewingTask}
                          setIsAddingTask={setIsAddingTask}
                          projectColor={activeProject.color}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                      styles: {
                        active: {
                          opacity: '0.4',
                        },
                      },
                    }),
                  }}>
                    {/* Add a placeholder or a preview if needed */}
                  </DragOverlay>
                </DndContext>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="no-project"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50"
            >
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                 <Layout size={32} className="text-slate-300" />
               </div>
               <h2 className="text-xl font-bold text-slate-900 mb-2">No Active Project</h2>
               <p className="text-slate-500 max-w-sm text-center mb-8">Select a project from the sidebar or create a new one to start managing your tasks.</p>
               <button 
                onClick={() => setIsAddingProject(true)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
               >
                 <Plus size={18} />
                 Create Project
               </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {isAddingProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProject(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Project</h2>
                <button onClick={() => setIsAddingProject(false)} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Project Name</label>
                  <input 
                    autoFocus
                    required
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="e.g., Marketing Q3 Launch"
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Description</label>
                  <textarea 
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                    placeholder="What's this project about?"
                    rows={3}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-medium transition-all resize-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Color Theme</label>
                    <button
                      type="button"
                      onClick={() => setSelectedColor(generateRandomColor())}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                    >
                      Generate Theme
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 px-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {PALETTE.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-10 h-10 rounded-full transition-all flex items-center justify-center relative",
                          selectedColor === color ? "ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-lg" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <motion.div 
                            layoutId="selectedColor"
                            className="w-2 h-2 bg-white rounded-full shadow-sm" 
                          />
                        )}
                      </button>
                    ))}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 border-dashed border-slate-200"
                      style={{ 
                        backgroundColor: !PALETTE.includes(selectedColor) ? selectedColor : 'transparent',
                        borderColor: !PALETTE.includes(selectedColor) ? selectedColor : undefined
                      }}
                    >
                       {!PALETTE.includes(selectedColor) && (
                         <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                       )}
                       {PALETTE.includes(selectedColor) && <div className="text-slate-300">?</div>}
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl"
                    style={{ 
                      backgroundColor: selectedColor,
                      boxShadow: `0 20px 25px -5px ${selectedColor}33, 0 8px 10px -6px ${selectedColor}33`
                    }}
                  >
                    Confirm & Build
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Modal (Simplified for creation) */}
      <AnimatePresence>
        {isAddingTask && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onPointerDown={() => setIsAddingTask(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Task</h2>
                <button onClick={() => setIsAddingTask(false)} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Task Title</label>
                  <input 
                    autoFocus
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Identify key stakeholders..."
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Project</label>
                  <select 
                    value={newTaskProjectId || activeProjectId || ''}
                    onChange={e => setNewTaskProjectId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all appearance-none"
                  >
                    <option value="" disabled>Select a project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Status</label>
                    <select 
                      value={newTaskStatus}
                      onChange={e => setNewTaskStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all appearance-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Priority</label>
                    <select 
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as any)}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Due Date</label>
                  <input 
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                  >
                    Add Task to Sprint
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {viewingTask && (
          <TaskDetailModal 
            task={viewingTask}
            projects={projects}
            onUpdate={(updatedTask) => {
              onUpdateTask(updatedTask);
              setViewingTask(updatedTask);
            }}
            onClose={() => setViewingTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskColumn({ status, projectTasks, onUpdateTask, onDeleteTask, setViewingTask, setIsAddingTask, projectColor }: {
  status: 'todo' | 'in-progress' | 'completed',
  projectTasks: ProjectTask[],
  onUpdateTask: (task: ProjectTask) => void,
  onDeleteTask: (id: string) => void,
  setViewingTask: (task: ProjectTask | null) => void,
  setIsAddingTask: (val: boolean) => void,
  projectColor: string,
  key?: React.Key
}) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div ref={setNodeRef} className="flex flex-col h-[calc(100vh-320px)]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === 'todo' ? "bg-slate-300" : status === 'in-progress' ? "bg-amber-400" : "bg-emerald-500"
          )} />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {status.replace('-', ' ')}
          </h3>
          <span className="text-[10px] font-bold text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded">
            {projectTasks.filter(t => t.status === status).length}
          </span>
        </div>
        {status === 'todo' && (
          <button 
            onClick={() => setIsAddingTask(true)}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      <SortableContext 
        items={projectTasks.filter(t => t.status === status).map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-8 pr-2">
          {projectTasks
            .filter(t => t.status === status)
            .map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={onUpdateTask} 
                onDelete={onDeleteTask}
                onClick={() => setViewingTask(task)}
                projectColor={projectColor}
              />
            ))
          }
        </div>
      </SortableContext>
    </div>
  );
}

function TaskDetailModal({ task, projects, onUpdate, onClose }: {
  task: ProjectTask,
  projects: Project[],
  onUpdate: (task: ProjectTask) => void,
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editDueDate, setEditDueDate] = useState(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
  const [editAssignee, setEditAssignee] = useState(task.assignee || '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editStatus, setEditStatus] = useState(task.status);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Math.random().toString(36).substr(2, 9),
        authorName: 'John Doe',
        text: commentText,
        createdAt: new Date()
      };
      onUpdate({ ...task, comments: [...(task.comments || []), newComment] });
      setCommentText('');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    onUpdate({ ...task, comments: (task.comments || []).filter(c => c.id !== commentId) });
  };

  const handleSaveEdit = () => {
    onUpdate({ 
      ...task, 
      title: editTitle, 
      description: editDesc,
      dueDate: editDueDate ? new Date(editDueDate) : undefined,
      assignee: editAssignee.trim() || undefined,
      priority: editPriority,
      status: editStatus
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[40px] w-full max-w-4xl h-[80vh] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Layout size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">#{task.id}</span>
              </div>
              {isEditing ? (
                <input 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="text-2xl font-black text-slate-900 tracking-tight bg-slate-50 border-0 rounded-xl px-2 focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{task.title}</h2>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all"
              >
                Save Changes
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
              >
                <Edit2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-2/3 flex flex-col border-r border-slate-100">
             <div className="flex border-b border-slate-100">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === 'details' ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Description
                </button>
                <button 
                  onClick={() => setActiveTab('comments')}
                  className={cn(
                    "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    activeTab === 'comments' ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Comments
                  <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{(task.comments || []).length}</span>
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                {activeTab === 'details' ? (
                  <div className="space-y-8">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">About this task</h4>
                        {isEditing ? (
                          <textarea 
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            rows={6}
                            className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                          />
                        ) : (
                          <p className="text-slate-600 leading-relaxed font-medium">
                            {task.description || 'Provide a detailed description of the task to help collaborators understand the requirements.'}
                          </p>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                         <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                             <Circle size={10} className="text-indigo-500 fill-indigo-500" />
                             Status
                          </h4>
                          <div className="flex gap-2">
                             {(['todo', 'in-progress', 'completed'] as const).map(s => (
                               <button 
                                 key={s}
                                 type="button"
                                 onClick={() => {
                                   if (isEditing) setEditStatus(s);
                                   else onUpdate({ ...task, status: s });
                                 }}
                                 className={cn(
                                   "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border",
                                   (isEditing ? editStatus === s : task.status === s) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                 )}
                               >
                                 {s.replace('-', ' ')}
                               </button>
                             ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                             <Clock size={10} className="text-amber-500" />
                             Due Date
                          </h4>
                          {isEditing ? (
                            <input 
                              type="date"
                              value={editDueDate}
                              onChange={e => setEditDueDate(e.target.value)}
                              className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
                               <CalendarIcon size={16} className="text-slate-400" />
                               <span className="text-xs font-bold text-slate-700">
                                 {task.dueDate ? format(task.dueDate, 'PPPP') : 'No deadline set'}
                               </span>
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                     <div className="flex-1 space-y-6">
                        {(task.comments || []).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                              <MessageSquare size={24} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">No comments yet</p>
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Be the first to share your thoughts.</p>
                          </div>
                        ) : (
                          task.comments.map(comment => (
                            <div key={comment.id} className="flex gap-4 group">
                               <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 font-black">
                                 {comment.authorName.charAt(0)}
                               </div>
                               <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                     <span className="text-xs font-black text-slate-900">{comment.authorName}</span>
                                     <div className="flex items-center gap-2">
                                       <span className="text-[10px] font-bold text-slate-400">{format(comment.createdAt, 'MMM d, h:mm a')}</span>
                                       <button 
                                         onClick={() => handleDeleteComment(comment.id)}
                                         className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                       >
                                         <Trash2 size={12} />
                                       </button>
                                     </div>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-3xl rounded-tl-none">
                                     <p className="text-xs font-medium text-slate-700 leading-relaxed">{comment.text}</p>
                                  </div>
                               </div>
                            </div>
                          ))
                        )}
                     </div>
                     <form onSubmit={handleAddComment} className="sticky bottom-0 bg-white pt-6 flex gap-3">
                        <div className="flex-1 relative">
                          <input 
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
                          />
                          <button 
                            type="submit"
                            disabled={!commentText.trim()}
                            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                     </form>
                  </div>
                )}
             </div>
          </div>

          <div className="w-1/3 bg-slate-50 p-8 space-y-8 flex flex-col">
             <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Properties</h4>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</span>
                      </div>
                      {isEditing ? (
                        <input 
                          value={editAssignee}
                          onChange={e => setEditAssignee(e.target.value)}
                          placeholder="Assign to..."
                          className="bg-slate-50 border-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 w-32"
                        />
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg">
                          <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-black">
                            {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{task.assignee || 'Unassigned'}</span>
                        </div>
                      )}
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
                      </div>
                      <select 
                        value={isEditing ? editPriority : task.priority}
                        onChange={e => {
                          const val = e.target.value as any;
                          if (isEditing) setEditPriority(val);
                          else onUpdate({ ...task, priority: val });
                        }}
                        className={cn(
                          "bg-transparent border-0 focus:ring-0 text-xs font-black uppercase tracking-wider p-0",
                          (isEditing ? editPriority === 'high' : task.priority === 'high') ? "text-red-500" : (isEditing ? editPriority === 'medium' : task.priority === 'medium') ? "text-amber-500" : "text-blue-500"
                        )}
                      >
                         <option value="low">Low</option>
                         <option value="medium">Medium</option>
                         <option value="high">High</option>
                      </select>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {format(task.createdAt, 'MMM d, yyyy')}
                      </span>
                   </div>
                   <div className="pt-4 border-t border-slate-50">
                      <a 
                        href={generateGoogleCalendarUrlForTask(task)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        <Share2 size={14} />
                        Add to Calendar
                      </a>
                   </div>
                </div>
             </div>

             <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Project</h4>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color }}>
                        <Layout size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{projects.find(p => p.id === task.projectId)?.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Current Workspace</p>
                      </div>
                   </div>
                </div>
             </div>

             <button 
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setEditTitle(task.title);
                    setEditDesc(task.description || '');
                    setEditDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
                    setEditAssignee(task.assignee || '');
                    setEditPriority(task.priority);
                    setEditStatus(task.status);
                  } else {
                    onClose();
                  }
                }}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98]",
                  isEditing 
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                    : "bg-slate-900 text-white hover:bg-black"
                )}
              >
                {isEditing ? 'Discard Changes' : 'Done'}
              </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TaskCard({ task, onUpdate, onDelete, onClick, projectColor }: { 
  task: ProjectTask, 
  onUpdate: (task: ProjectTask) => void,
  onDelete: (id: string) => void,
  onClick: () => void,
  projectColor: string,
  key?: React.Key
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubTask, setNewSubTask] = useState('');

  const completedSubTasks = task.subTasks.filter(st => st.isCompleted).length;
  const progress = task.subTasks.length > 0 ? (completedSubTasks / task.subTasks.length) * 100 : 0;

  const handleCreateSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubTask.trim()) {
      const st: SubTask = { id: Math.random().toString(36).substr(2, 9), title: newSubTask, isCompleted: false };
      onUpdate({ ...task, subTasks: [...task.subTasks, st] });
      setNewSubTask('');
    }
  };

  return (
    <motion.div 
      ref={setNodeRef}
      style={{ ...style, '--project-color': projectColor } as any}
      layout
      whileHover={{ y: -4, scale: 1.01, borderColor: projectColor }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1" {...attributes} {...listeners}>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
              task.priority === 'high' ? "bg-red-50 text-red-600" : task.priority === 'medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
            )}>
              {task.priority}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors" style={{ color: 'inherit' }}>
            <span className="group-hover:text-opacity-80" style={{ color: 'var(--project-color, #1e293b)' }}>{task.title}</span>
          </h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={(e) => {
               e.stopPropagation();
               const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'todo';
               onUpdate({ ...task, status: nextStatus });
            }}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
            title="Move Status"
          >
             <ChevronRight size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
           {task.subTasks.length > 0 && (
             <span className="flex items-center text-[10px] font-bold text-slate-400">
               <CheckCircle2 size={12} className="mr-1 text-emerald-500" />
               {completedSubTasks}/{task.subTasks.length}
             </span>
           )}
           {task.comments && task.comments.length > 0 && (
             <span className="flex items-center text-[10px] font-bold text-slate-400">
               <MessageSquare size={12} className="mr-1" />
               {task.comments.length}
             </span>
           )}
           {task.dueDate && (
             <span className="flex items-center text-[10px] font-bold text-slate-400">
               <Clock size={12} className="mr-1" />
               {format(task.dueDate, 'MMM d')}
             </span>
           )}
           {task.assignee && (
             <div className="flex items-center gap-1.5 ml-1">
               <div className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-[8px] font-black border border-indigo-100">
                 {task.assignee.charAt(0).toUpperCase()}
               </div>
               <span className="text-[10px] font-bold text-slate-500">{task.assignee.split(' ')[0]}</span>
             </div>
           )}
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 tracking-wider flex items-center gap-1 uppercase"
        >
          {isExpanded ? 'Collapse' : 'Sub-tasks'}
          <ChevronDown size={12} className={cn("transition-transform", isExpanded && "rotate-180")} />
        </button>
      </div>

      {task.subTasks.length > 0 && (
        <div className="mt-3 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
          <motion.div 
            className="bg-emerald-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-6 mt-4 border-t border-slate-100 space-y-4">
               <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Check</h5>
                  <div className="space-y-2">
                    {task.subTasks.map(st => (
                      <div key={st.id} className="flex items-center justify-between group/st bg-slate-50 p-2 rounded-xl">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              onUpdate({
                                ...task,
                                subTasks: task.subTasks.map(item => item.id === st.id ? { ...item, isCompleted: !item.isCompleted } : item)
                              })
                            }}
                          >
                            {st.isCompleted ? (
                              <CheckCircle2 size={18} className="text-emerald-500" />
                            ) : (
                              <Circle size={18} className="text-slate-300" />
                            )}
                          </button>
                          <span className={cn("text-xs font-medium", st.isCompleted ? "text-slate-400 line-through" : "text-slate-700")}>
                            {st.title}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                             onUpdate({
                               ...task,
                               subTasks: task.subTasks.filter(item => item.id !== st.id)
                             })
                          }}
                          className="opacity-0 group-hover/st:opacity-100 p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCreateSubTask} className="mt-3 flex gap-2">
                    <input 
                      value={newSubTask}
                      onChange={e => setNewSubTask(e.target.value)}
                      placeholder="Add sub-task..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                    <button 
                      type="submit"
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </form>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

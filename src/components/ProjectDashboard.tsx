import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper, { Point, Area } from 'react-easy-crop';
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
  Share2,
  BookOpen,
  FileText,
  File,
  Link,
  Video,
  Paperclip,
  FileCode,
  Globe,
  Briefcase,
  Code,
  Zap,
  Target,
  Smartphone,
  Award,
  Sparkles,
  Rocket,
  Paintbrush,
  Bold,
  Italic,
  List as ListIcon,
  Heading1,
  Heading2,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Camera,
  Upload,
  Crop
} from 'lucide-react';
import { Project, ProjectTask, SubTask, Comment, ProjectAsset, ProjectNote, ProjectTaskStatus } from '@/src/types';
import { cn, generateGoogleCalendarUrlForTask } from '@/src/lib/utils';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  isAddingProject: boolean;
  setIsAddingProject: (val: boolean) => void;
  onAddProject: (name: string, description: string, color?: string, icon?: string, category?: string, coverImage?: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (project: Project) => void;
  onAddTask: (task: Omit<ProjectTask, 'id' | 'subTasks' | 'comments' | 'createdAt'>) => void;
  onUpdateTask: (task: ProjectTask) => void;
  onDeleteTask: (id: string) => void;
}

export default function ProjectDashboard({ 
  projects, 
  tasks, 
  activeProjectId,
  setActiveProjectId,
  isAddingProject,
  setIsAddingProject,
  onAddProject, 
  onDeleteProject,
  onUpdateProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: ProjectDashboardProps) {
  const [activeProjectTab, setActiveProjectTab] = useState<'dashboard' | 'assets' | 'notes'>('dashboard');
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4f46e5');
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');
  
  const PALETTE = [
    '#6366f1', // indigo-500
    '#3b82f6', // blue-500
    '#0ea5e9', // sky-500
    '#10b981', // emerald-500
    '#22c55e', // green-500
    '#f59e0b', // amber-500
    '#f97316', // orange-500
    '#ef4444', // red-500
    '#ec4899', // pink-500
    '#d946ef', // fuchsia-500
    '#a855f7', // purple-500
    '#8b5cf6', // violet-500
  ];

  const ICONS = [
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Code', icon: Code },
    { name: 'Target', icon: Target },
    { name: 'Zap', icon: Zap },
    { name: 'Smartphone', icon: Smartphone },
    { name: 'Globe', icon: Globe },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Award', icon: Award },
    { name: 'Rocket', icon: Rocket },
    { name: 'Paintbrush', icon: Paintbrush },
    { name: 'Layout', icon: Layout },
    { name: 'FileText', icon: FileText }
  ];

  const getIconComponent = (iconName: string) => {
    const found = ICONS.find(i => i.name === iconName);
    return found ? found.icon : Briefcase;
  };

  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  };
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [viewingTask, setViewingTask] = useState<ProjectTask | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [newTaskStatus, setNewTaskStatus] = useState<ProjectTaskStatus>('todo');
  
  // Image Cropping States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [tempCroppedImage, setTempCroppedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('dueDate');
  const [sortOrientation, setSortOrientation] = useState<'asc' | 'desc'>('asc');
  
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeProject = projects.find(p => p.id === activeProjectId);
  
  const assignees = Array.from(new Set(tasks.filter(t => t.projectId === activeProjectId).map(t => t.assignee).filter(Boolean))) as string[];
  const hasUnassigned = tasks.filter(t => t.projectId === activeProjectId).some(t => !t.assignee);

  const projectTasks = tasks
    .filter(t => t.projectId === activeProjectId)
    .filter(t => filterStatus.length === 0 || filterStatus.includes(t.status))
    .filter(t => filterPriority.length === 0 || filterPriority.includes(t.priority))
    .filter(t => filterAssignee.length === 0 || (t.assignee ? filterAssignee.includes(t.assignee) : filterAssignee.includes('unassigned')))
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

  const onCropComplete = useCallback((_: Area, _pixels: Area) => {
    setCroppedAreaPixels(_pixels);
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = imageSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return canvas.toDataURL('image/jpeg');
  }, [imageSrc, croppedAreaPixels]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCrop = async () => {
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      setTempCroppedImage(croppedImage);
      setIsCropping(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) {
      setActiveDragId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
       const task = tasks.find(t => t.id === activeId);
       if (task) {
          const statuses: ProjectTaskStatus[] = ['todo', 'in-progress', 'pending', 'under-review', 'follow-up', 'completed'];
          if (statuses.includes(overId as ProjectTaskStatus)) {
            onUpdateTask({ ...task, status: overId as ProjectTaskStatus });
          } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask && overTask.status !== task.status) {
              onUpdateTask({ ...task, status: overTask.status });
            }
          }
       }
    }
    setActiveDragId(null);
  };

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const activeDraggingTask = tasks.find(t => t.id === activeDragId);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      if (editingProject) {
        onUpdateProject({
          ...editingProject,
          name: newProjectName,
          description: newProjectDesc,
          category: newProjectCategory,
          color: selectedColor,
          icon: selectedIcon,
          coverImage: tempCroppedImage || undefined
        });
      } else {
        onAddProject(newProjectName, newProjectDesc, selectedColor, selectedIcon, newProjectCategory, tempCroppedImage || undefined);
      }
      resetProjectForm();
    }
  };

  const resetProjectForm = () => {
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectCategory('');
    setSelectedColor('#4f46e5');
    setSelectedIcon('Briefcase');
    setTempCroppedImage(null);
    setImageSrc(null);
    setIsAddingProject(false);
    setEditingProject(null);
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDesc(project.description || '');
    setNewProjectCategory(project.category || '');
    setSelectedColor(project.color);
    setSelectedIcon(project.icon || 'Briefcase');
    setTempCroppedImage(project.coverImage || null);
    setIsAddingProject(true);
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
            {projects.map(project => {
              const IconComponent = getIconComponent(project.icon || 'Briefcase');
              return (
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
                    <div className="w-8 h-8 rounded-lg mr-3 shrink-0 flex items-center justify-center text-white shadow-sm overflow-hidden" style={{ backgroundColor: project.color }}>
                      {project.coverImage ? (
                        <img src={project.coverImage} className="w-full h-full object-cover" />
                      ) : (
                        <IconComponent size={16} />
                      )}
                    </div>
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
              );
            })}
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
                        className="flex items-center gap-3 mb-4"
                      >
                         <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden" style={{ backgroundColor: activeProject.color }}>
                            {activeProject.coverImage ? (
                               <img src={activeProject.coverImage} className="w-full h-full object-cover" />
                            ) : (
                               React.createElement(getIconComponent(activeProject.icon || 'Briefcase'), { size: 24, strokeWidth: 2.5 })
                            )}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: activeProject.color }}>
                                 {activeProject.category || 'Standard Project'}
                               </span>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {activeProject.id}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-400">Since {format(activeProject.createdAt, 'MMM d, yyyy')}</span>
                         </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="flex items-center gap-2 mb-2"
                      >
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                          {activeProject.name}
                        </h1>
                        <button 
                          onClick={() => openEditProject(activeProject)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit Project Details"
                        >
                          <Edit2 size={20} />
                        </button>
                      </motion.div>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 mt-2 font-medium max-w-xl"
                      >
                        {activeProject.description}
                      </motion.p>

                      {/* Task Filters */}
                      <div className="flex flex-wrap items-center gap-6 mt-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</span>
                          <div className="flex items-center gap-1.5 flex-wrap pb-1">
                            {['todo', 'in-progress', 'pending', 'under-review', 'follow-up', 'completed'].map(status => (
                              <button 
                                key={status}
                                onClick={() => setFilterStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap",
                                  filterStatus.includes(status) 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105" 
                                    : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-200"
                                )}
                              >
                                {status.replace('-', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="w-[1px] h-8 bg-slate-100 self-end mb-1" />

                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Priority</span>
                          <div className="flex gap-1.5">
                            {['low', 'medium', 'high'].map(priority => (
                              <button 
                                key={priority}
                                onClick={() => setFilterPriority(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority])}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                                  filterPriority.includes(priority) 
                                    ? (priority === 'high' ? "bg-rose-600 border-rose-600 text-white shadow-md scale-105" : 
                                       priority === 'medium' ? "bg-amber-500 border-amber-500 text-white shadow-md scale-105" : 
                                       "bg-blue-600 border-blue-600 text-white shadow-md scale-105")
                                    : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-200"
                                )}
                              >
                                {priority}
                              </button>
                            ))}
                          </div>
                        </div>

                        {(assignees.length > 0 || hasUnassigned) && (
                          <>
                            <div className="w-[1px] h-8 bg-slate-100 self-end mb-1" />
                            <div className="flex flex-col gap-2 max-w-xs">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Assignee</span>
                              <div className="flex flex-wrap gap-1.5">
                                {hasUnassigned && (
                                  <button 
                                    onClick={() => setFilterAssignee(prev => prev.includes('unassigned') ? prev.filter(a => a !== 'unassigned') : [...prev, 'unassigned'])}
                                    className={cn(
                                      "px-3 py-1 rounded-lg text-[10px] font-black transition-all border",
                                      filterAssignee.includes('unassigned') 
                                        ? "bg-slate-800 border-slate-800 text-white shadow-md scale-105" 
                                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-200"
                                    )}
                                  >
                                    Unassigned
                                  </button>
                                )}
                                {assignees.map(email => (
                                  <button 
                                    key={email}
                                    onClick={() => setFilterAssignee(prev => prev.includes(email) ? prev.filter(a => a !== email) : [...prev, email])}
                                    className={cn(
                                      "px-3 py-1 rounded-lg text-[10px] font-black truncate max-w-[120px] transition-all border",
                                      filterAssignee.includes(email) 
                                        ? "bg-slate-800 border-slate-800 text-white shadow-md scale-105" 
                                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-200"
                                    )}
                                  >
                                    {email.split('@')[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {(filterStatus.length > 0 || filterPriority.length > 0 || filterAssignee.length > 0) && (
                          <button 
                            onClick={() => {
                              setFilterStatus([]);
                              setFilterPriority([]);
                              setFilterAssignee([]);
                            }}
                            className="ml-auto text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all self-end mb-1"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-8 border-b border-slate-100 w-fit">
                        {[
                          { id: 'dashboard', label: 'Tasks', icon: Layout },
                          { id: 'assets', label: 'Resources & Files', icon: BookOpen },
                          { id: 'notes', label: 'Notes', icon: FileText },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveProjectTab(tab.id as any)}
                            className={cn(
                              "flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden",
                              activeProjectTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            <tab.icon size={14} />
                            {tab.label}
                            {activeProjectTab === tab.id && (
                              <motion.div 
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" 
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 }}
                      className="flex gap-4"
                    >
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
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
                </div>

                <div className="flex-1 overflow-y-auto px-8 no-scrollbar">
                  <AnimatePresence mode="wait">
                    {activeProjectTab === 'dashboard' ? (
                      <motion.div
                        key="tasks"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCorners}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="flex gap-8 overflow-x-auto pb-4 no-scrollbar min-h-[500px]">
                            {(['todo', 'in-progress', 'pending', 'under-review', 'follow-up', 'completed'] as ProjectTaskStatus[]).map((status, index) => (
                              <motion.div
                                key={status}
                                className="min-w-[260px] lg:flex-1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.1 }}
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
                          <DragOverlay>
                             {activeDraggingTask ? (
                               <TaskCard 
                                 task={activeDraggingTask} 
                                 onUpdate={onUpdateTask} 
                                 onDelete={onDeleteTask}
                                 onClick={() => {}}
                                 projectColor={activeProject.color}
                                 isOverlay
                               />
                             ) : null}
                          </DragOverlay>
                        </DndContext>
                      </motion.div>
                    ) : activeProjectTab === 'assets' ? (
                      <AssetsView 
                        project={activeProject} 
                        onUpdateProject={onUpdateProject} 
                      />
                    ) : (
                      <NotesView 
                        project={activeProject} 
                        onUpdateProject={onUpdateProject} 
                      />
                    )}
                  </AnimatePresence>
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
              onClick={resetProjectForm}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingProject ? 'Edit Project' : 'New Project'}
                </h2>
                <button onClick={resetProjectForm} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
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
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Category / Tag</label>
                    <input 
                      value={newProjectCategory}
                      onChange={e => setNewProjectCategory(e.target.value)}
                      placeholder="e.g., Active Project"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Identity</label>
                    <div className="relative group/icon">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[60px] h-[60px] bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 cursor-pointer border-2 border-transparent group-hover/icon:border-indigo-100 transition-all overflow-hidden relative"
                        style={{ color: selectedColor }}
                      >
                        {tempCroppedImage ? (
                          <img src={tempCroppedImage} alt="Project Icon" className="w-full h-full object-cover" />
                        ) : (
                          React.createElement(getIconComponent(selectedIcon), { size: 28 })
                        )}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/icon:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera size={18} className="text-white" />
                        </div>
                      </div>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {tempCroppedImage && (
                  <button 
                    type="button"
                    onClick={() => setTempCroppedImage(null)}
                    className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={10} />
                    Remove Custom Image
                  </button>
                )}

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Select Icon</label>
                   <div className="grid grid-cols-6 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      {ICONS.map(item => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedIcon(item.name)}
                          className={cn(
                            "p-2.5 rounded-xl transition-all flex items-center justify-center",
                            selectedIcon === item.name 
                              ? "bg-white text-indigo-600 shadow-md ring-2 ring-indigo-500 ring-offset-2" 
                              : "text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm"
                          )}
                        >
                          <item.icon size={20} />
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Description</label>
                  <textarea 
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                    placeholder="Briefly describe the mission..."
                    rows={2}
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
                      Random
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    {PALETTE.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all flex items-center justify-center relative",
                          selectedColor === color ? "scale-125 shadow-lg ring-2 ring-offset-2 ring-white" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <motion.div 
                            layoutId="selectedColor"
                            className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" 
                          />
                        )}
                      </button>
                    ))}
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

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropping && imageSrc && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl h-[70vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <Crop size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Crop Project Image</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust the frame to your liking</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCropping(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 relative bg-slate-100">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex items-center gap-6">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <span>Zoom</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCropping(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Apply Crop
                  </button>
                </div>
              </div>
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
              className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-8"
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
                      <option value="pending">Pending</option>
                      <option value="under-review">Under Review</option>
                      <option value="follow-up">Follow-up</option>
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
  status: ProjectTaskStatus,
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

  const getStatusColor = (s: ProjectTaskStatus) => {
    switch (s) {
      case 'todo': return 'bg-slate-300';
      case 'in-progress': return 'bg-blue-400';
      case 'pending': return 'bg-amber-400';
      case 'under-review': return 'bg-purple-400';
      case 'follow-up': return 'bg-rose-400';
      case 'completed': return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div ref={setNodeRef} className="flex flex-col h-[calc(100vh-320px)] bg-slate-100/40 rounded-2xl p-3 border border-slate-200/60">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full shadow-sm",
            getStatusColor(status)
          )} />
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {status.replace('-', ' ')}
          </h3>
          <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
            {projectTasks.filter(t => t.status === status).length}
          </span>
        </div>
        {status === 'todo' && (
          <button 
            onClick={() => setIsAddingTask(true)}
            className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-indigo-600 shadow-sm"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <SortableContext 
        items={projectTasks.filter(t => t.status === status).map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-8 pr-1">
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
        className="relative bg-white rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl overflow-hidden flex flex-col"
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
                          <div className="flex flex-wrap gap-2">
                             {(['todo', 'in-progress', 'pending', 'under-review', 'follow-up', 'completed'] as const).map(s => (
                               <button 
                                 key={s}
                                 type="button"
                                 onClick={() => {
                                   if (isEditing) setEditStatus(s);
                                   else onUpdate({ ...task, status: s });
                                 }}
                                 className={cn(
                                   "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border",
                                   (isEditing ? editStatus === s : task.status === s) ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
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
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
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
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white overflow-hidden" style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color }}>
                        {projects.find(p => p.id === task.projectId)?.coverImage ? (
                          <img src={projects.find(p => p.id === task.projectId)?.coverImage} className="w-full h-full object-cover" />
                        ) : (
                          <Layout size={18} />
                        )}
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

function TaskCard({ task, onUpdate, onDelete, onClick, projectColor, isOverlay }: { 
  task: ProjectTask, 
  onUpdate: (task: ProjectTask) => void,
  onDelete: (id: string) => void,
  onClick: () => void,
  projectColor: string,
  isOverlay?: boolean,
  key?: React.Key
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, disabled: isOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : (isOverlay ? 100 : 1),
    cursor: isOverlay ? 'grabbing' : 'pointer',
    pointerEvents: isOverlay ? 'none' : 'auto' as any,
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
      whileHover={!isOverlay ? { y: -4, scale: 1.01, borderColor: projectColor } : undefined}
      whileTap={!isOverlay ? { scale: 0.98 } : undefined}
      initial={!isOverlay ? { opacity: 0, y: 10 } : { opacity: 1, scale: 1.05, rotate: 2 }}
      animate={{ opacity: 1, y: 0, scale: isOverlay ? 1.05 : 1, rotate: isOverlay ? 2 : 0 }}
      className={cn(
        "bg-white border rounded-2xl p-5 shadow-sm transition-all group relative overflow-hidden",
        isOverlay ? "shadow-2xl border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-200" : "border-slate-200 hover:shadow-md",
        isDragging && !isOverlay && "border-indigo-200"
      )}
      onClick={!isOverlay ? onClick : undefined}
    >
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: projectColor }} />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1" {...attributes} {...listeners}>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
              task.priority === 'high' ? "bg-red-50 text-red-600" : task.priority === 'medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
            )}>
              {task.priority}
            </span>
            {isOverlay && (
              <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">Moving</span>
            )}
          </div>
          <h4 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
            {task.title}
          </h4>
        </div>
        {!isOverlay && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
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
        </div>
        
        {!isOverlay && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 tracking-wider flex items-center gap-1 uppercase"
          >
            {isExpanded ? 'Hide' : 'Quick View'}
            <ChevronDown size={12} className={cn("transition-transform", isExpanded && "rotate-180")} />
          </button>
        )}
      </div>

      {task.subTasks.length > 0 && (
        <div className="mt-3 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
          <motion.div 
            className="bg-emerald-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <AnimatePresence>
        {isExpanded && !isOverlay && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-6 mt-4 border-t border-slate-100 space-y-4 font-medium">
               <div className="space-y-2">
                 {task.subTasks.map(st => (
                   <div key={st.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl">
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
                     <span className={cn("text-xs", st.isCompleted ? "text-slate-400 line-through" : "text-slate-700")}>
                       {st.title}
                     </span>
                   </div>
                 ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Sub-page components for Resources, Notes, and Files
// Unified Assets View (Resources + Files)
function AssetsView({ project, onUpdateProject }: { project: Project, onUpdateProject: (p: Project) => void }) {
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetType, setAssetType] = useState<'link' | 'file'>('link');

  const assets = project.assets || [];

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (assetName.trim() && assetUrl.trim()) {
      const newAsset: ProjectAsset = {
        id: Math.random().toString(36).substr(2, 9),
        name: assetName,
        url: assetUrl.startsWith('http') ? assetUrl : `https://${assetUrl}`,
        type: 'link',
        createdAt: new Date()
      };
      onUpdateProject({ ...project, assets: [...assets, newAsset] });
      setAssetName('');
      setAssetUrl('');
      setIsAddingAsset(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      const newAssets: ProjectAsset[] = Array.from(uploadedFiles).map(f => {
        const file = f as File;
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: '#', // In a real app, this would be a cloud URL
          type: 'file' as const,
          fileType: file.type,
          size: file.size,
          createdAt: new Date()
        };
      });
      onUpdateProject({ ...project, assets: [...assets, ...newAssets] });
    }
  };

  const deleteAsset = (id: string) => {
    onUpdateProject({ ...project, assets: assets.filter(a => a.id !== id) });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Resources & Files</h2>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Centralized project assets and documentation</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setAssetType('link'); setIsAddingAsset(true); }}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Link size={14} />
            Add Link
          </button>
          <label className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 cursor-pointer shadow-indigo-100">
            <Plus size={14} />
            Upload File
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <AnimatePresence>
        {isAddingAsset && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddLink} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Add Web Resource</h3>
                  <button type="button" onClick={() => setIsAddingAsset(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Resource Name</label>
                    <input 
                      autoFocus
                      required
                      value={assetName}
                      onChange={e => setAssetName(e.target.value)}
                      placeholder="e.g., Figma Design Board"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">URL</label>
                    <input 
                      required
                      value={assetUrl}
                      onChange={e => setAssetUrl(e.target.value)}
                      placeholder="figma.com/file/..."
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingAsset(false)}
                    className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Add Resource
                  </button>
                </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
               <BookOpen size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-900">No assets in this project</h3>
             <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">Keep your links, documentation, and files synchronized and accessible for the entire team.</p>
          </div>
        ) : (
          assets.map(asset => (
            <motion.div
              layout
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={cn(
                  "p-4 rounded-2xl transition-all",
                  asset.type === 'link' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {asset.type === 'link' ? <Globe size={20} /> : <FileText size={20} />}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => deleteAsset(asset.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h4 className="font-black text-slate-900 truncate mb-1" title={asset.name}>{asset.name}</h4>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-6">
                {asset.type === 'file' ? `${formatFileSize(asset.size)} • ${asset.fileType?.split('/')[1] || 'File'}` : 'External Link'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <a 
                  href={asset.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                >
                  {asset.type === 'link' ? 'Open Link' : 'Open Card'} <ExternalLink size={14} />
                </a>
                {asset.type === 'file' && (
                   <button className="text-slate-400 hover:text-indigo-600 transition-colors" title="Download File">
                      <Download size={16} />
                   </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesView({ project, onUpdateProject }: { project: Project, onUpdateProject: (p: Project) => void }) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(project.notes?.[0]?.id || null);
  const [isAdding, setIsAdding] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const stats = useMemo(() => {
    const notes = project.notes || [];
    const activeNote = notes.find(n => n.id === activeNoteId);
    const words = activeNote?.content.split(/\s+/).filter(Boolean).length || 0;
    const chars = activeNote?.content.length || 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTime };
  }, [project.notes, activeNoteId]);

  const notes = project.notes || [];
  const activeNote = notes.find(n => n.id === activeNoteId);

  React.useEffect(() => {
    if (activeNoteId && !notes.find(n => n.id === activeNoteId)) {
      setActiveNoteId(notes[0]?.id || null);
    } else if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  }, [project.id]);

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteTitle.trim()) {
      const newNote: ProjectNote = {
        id: Math.random().toString(36).substr(2, 9),
        title: noteTitle,
        content: '',
        updatedAt: new Date()
      };
      onUpdateProject({ ...project, notes: [...notes, newNote] });
      setNoteTitle('');
      setIsAdding(false);
      setActiveNoteId(newNote.id);
    }
  };

  const updateNoteContent = (content: string) => {
    if (!activeNote) return;
    const updatedNotes = notes.map(n => 
      n.id === activeNoteId ? { ...n, content, updatedAt: new Date() } : n
    );
    onUpdateProject({ ...project, notes: updatedNotes });
  };

  const formatText = (command: string) => {
    const textarea = document.getElementById('note-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let replacement = '';
    switch (command) {
      case 'bold': replacement = `**${selectedText}**`; break;
      case 'italic': replacement = `*${selectedText}*`; break;
      case 'heading': replacement = `\n# ${selectedText}`; break;
      case 'list': replacement = `\n- ${selectedText}`; break;
      default: return;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    updateNoteContent(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
    }, 10);
  };

  const handleUpdateTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeNote && editTitleValue.trim()) {
      const updatedNotes = notes.map(n => 
        n.id === activeNoteId ? { ...n, title: editTitleValue, updatedAt: new Date() } : n
      );
      onUpdateProject({ ...project, notes: updatedNotes });
      setIsEditingTitle(false);
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    onUpdateProject({ ...project, notes: updatedNotes });
    if (activeNoteId === id) setActiveNoteId(updatedNotes[0]?.id || null);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] py-8 gap-8">
      <div className="w-80 shrink-0 flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Project Notes</h2>
           <button 
            onClick={() => setIsAdding(true)} 
            className="p-2.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
            title="Create New Note"
           >
             <Plus size={18} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-8 px-2">
          <AnimatePresence>
            {isAdding && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={addNote} 
                className="bg-white p-5 rounded-3xl border-2 border-indigo-500 shadow-xl shadow-indigo-100"
              >
                 <input 
                   autoFocus
                   value={noteTitle}
                   onChange={e => setNoteTitle(e.target.value)}
                   placeholder="Note title..."
                   className="w-full border-0 focus:ring-0 text-sm font-black bg-transparent mb-4"
                 />
                 <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="text-[10px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-lg shadow-indigo-200 transition-all">Create</button>
                 </div>
              </motion.form>
            )}
          </AnimatePresence>

          {notes.length === 0 && !isAdding ? (
            <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <FileText size={48} className="mx-auto mb-4 text-slate-100" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Journal is Empty</p>
            </div>
          ) : (
            notes.map(note => (
              <motion.div 
                layout
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setIsEditingTitle(false);
                }}
                className={cn(
                  "p-5 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden",
                  activeNoteId === note.id 
                    ? "bg-white border-indigo-100 shadow-xl ring-1 ring-indigo-50/50" 
                    : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-md"
                )}
              >
                 {activeNoteId === note.id && (
                   <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                 )}
                 <div className="flex items-start justify-between mb-2">
                    <h4 className={cn("text-sm font-black truncate pr-4", activeNoteId === note.id ? "text-indigo-600" : "text-slate-900")}>
                      {note.title}
                    </h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(note.updatedAt, 'MMM d, h:mm a')}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className={cn(
        "flex-1 bg-white rounded-2xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative border-opacity-50 transition-all duration-500 ease-in-out",
        isFullScreen ? "fixed inset-0 z-[100] rounded-none border-none shadow-none" : "relative"
      )}>
        {activeNote ? (
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-500",
            isFullScreen ? "max-w-4xl mx-auto w-full px-8 md:px-12 pt-20 pb-12" : "pt-12 px-12 pb-8"
          )}>
             {isFullScreen && (
               <button 
                 onClick={() => setIsFullScreen(false)}
                 className="fixed top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all active:scale-95"
               >
                 <Minimize2 size={20} />
               </button>
             )}
             <div className="mb-8 flex items-start justify-between">
                <div className="flex-1 max-w-2xl">
                   {isEditingTitle ? (
                     <form onSubmit={handleUpdateTitle} className="flex gap-2">
                        <input 
                          autoFocus
                          value={editTitleValue}
                          onChange={e => setEditTitleValue(e.target.value)}
                          onBlur={() => setIsEditingTitle(false)}
                          className="text-4xl font-black text-slate-900 tracking-tight border-0 focus:ring-0 p-0 w-full bg-transparent"
                        />
                     </form>
                   ) : (
                     <div className="flex items-center gap-4 group">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">{activeNote.title}</h3>
                        <button 
                          onClick={() => { setEditTitleValue(activeNote.title); setIsEditingTitle(true); }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                        >
                          <Edit2 size={24} />
                        </button>
                     </div>
                   )}
                   <div className="flex items-center gap-3 mt-4">
                      <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                        Document
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last edited {format(activeNote.updatedAt, 'PPPP p')}</span>
                   </div>
                </div>
             </div>

             {/* Formatting Toolbar */}
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2 p-1.5 bg-slate-50 w-fit rounded-2xl border border-slate-100">
                  <button onClick={() => formatText('heading')} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 hover:text-indigo-600 transition-all font-black"><Heading1 size={18} /></button>
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                  <button onClick={() => formatText('bold')} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 hover:text-indigo-600 transition-all"><Bold size={18} /></button>
                  <button onClick={() => formatText('italic')} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 hover:text-indigo-600 transition-all"><Italic size={18} /></button>
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                  <button onClick={() => formatText('list')} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 hover:text-indigo-600 transition-all"><ListIcon size={18} /></button>
               </div>
               
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setIsPreviewMode(!isPreviewMode)}
                   className={cn(
                     "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                     isPreviewMode 
                       ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                       : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                   )}
                 >
                   {isPreviewMode ? <Edit2 size={14} /> : <BookOpen size={14} />}
                   {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
                 </button>

                 {!isPreviewMode && (
                   <button 
                     onClick={() => setIsFullScreen(!isFullScreen)}
                     className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all"
                     title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
                   >
                     {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                   </button>
                 )}
               </div>
             </div>

             {isPreviewMode ? (
               <div className="flex-1 overflow-y-auto no-scrollbar pr-4">
                 <div className="markdown-body">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                     {activeNote.content || '_No content yet. Exit preview to start writing._'}
                   </ReactMarkdown>
                 </div>
               </div>
             ) : (
               <textarea 
                 id="note-editor"
                 value={activeNote.content}
                 onChange={e => updateNoteContent(e.target.value)}
                 placeholder="Capture your thoughts, ideas, and strategies here..."
                 className="flex-1 w-full bg-transparent border-0 focus:ring-0 text-slate-600 font-medium leading-relaxed resize-none text-xl p-0 placeholder:text-slate-200 scrollbar-thin scrollbar-thumb-slate-100"
               />
             )}
             
             <div className={cn(
                "mt-8 pt-8 border-t border-slate-50 flex justify-between items-center transition-all",
                isFullScreen ? "opacity-60 hover:opacity-100" : ""
              )}>
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                   Synced
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end px-4 border-r border-slate-100">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Time</span>
                      <span className="text-[10px] font-bold text-slate-600 leading-none">{stats.readTime} min</span>
                    </div>
                    <div className="flex flex-col items-end px-4 border-r border-slate-100">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Words</span>
                      <span className="text-[10px] font-bold text-slate-600 leading-none">{stats.words}</span>
                    </div>
                    <div className="flex flex-col items-end pl-4">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Chars</span>
                      <span className="text-[10px] font-bold text-slate-600 leading-none">{stats.chars}</span>
                    </div>
                 </div>
              </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="w-32 h-32 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 text-slate-200">
               <FileText size={56} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">Select a document</h3>
             <p className="text-slate-400 max-w-sm mt-4 text-lg font-medium">Your thoughts and project details deserve a home. Select an existing note or create a fresh one.</p>
             <button 
              onClick={() => setIsAdding(true)}
              className="mt-10 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-3"
             >
               <Plus size={20} />
               Start Writing
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

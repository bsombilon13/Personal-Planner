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
  Edit2
} from 'lucide-react';
import { Project, ProjectTask, SubTask } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';

interface ProjectDashboardProps {
  projects: Project[];
  tasks: ProjectTask[];
  onAddProject: (name: string, description: string) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Omit<ProjectTask, 'id' | 'subTasks'>) => void;
  onUpdateTask: (task: ProjectTask) => void;
  onDeleteTask: (id: string) => void;
}

export default function ProjectDashboard({ 
  projects, 
  tasks, 
  onAddProject, 
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: ProjectDashboardProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects[0]?.id || null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName, newProjectDesc);
      setNewProjectName('');
      setNewProjectDesc('');
      setIsAddingProject(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && activeProjectId) {
      onAddTask({
        projectId: activeProjectId,
        title: newTaskTitle,
        status: 'todo',
        priority: newTaskPriority,
      });
      setNewTaskTitle('');
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeProject ? (
            <>
              <div className="p-8 pb-4">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: activeProject.color }}>
                         Project
                       </span>
                       <span className="text-xs font-medium text-slate-400">Created {format(activeProject.createdAt, 'MMM d, yyyy')}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{activeProject.name}</h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-xl">{activeProject.description}</p>
                  </div>
                  
                  <div className="flex gap-4">
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
                          className="h-full bg-indigo-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${projectTasks.length > 0 ? (projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                  {(['todo', 'in-progress', 'completed'] as const).map(status => (
                    <div key={status} className="flex flex-col h-[calc(100vh-320px)]">
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

                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-8 pr-2">
                        {projectTasks
                          .filter(t => t.status === status)
                          .map(task => (
                            <TaskCard 
                              key={task.id} 
                              task={task} 
                              onUpdate={onUpdateTask} 
                              onDelete={onDeleteTask}
                            />
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
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
            </div>
          )}
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
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
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
              onClick={() => setIsAddingTask(false)}
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
                <button onClick={() => setIsAddingTask(false)} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 text-slate-400">
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
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Priority</label>
                    <select 
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as any)}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
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
    </div>
  );
}

function TaskCard({ task, onUpdate, onDelete }: { 
  task: ProjectTask, 
  onUpdate: (task: ProjectTask) => void,
  onDelete: (id: string) => void,
  key?: React.Key
}) {
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
      layout
      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
              task.priority === 'high' ? "bg-red-50 text-red-600" : task.priority === 'medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
            )}>
              {task.priority}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={() => {
               const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'todo';
               onUpdate({ ...task, status: nextStatus });
            }}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
            title="Move Status"
          >
             <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
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
           {task.dueDate && (
             <span className="flex items-center text-[10px] font-bold text-slate-400">
               <Clock size={12} className="mr-1" />
               {format(task.dueDate, 'MMM d')}
             </span>
           )}
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 tracking-wider flex items-center gap-1 uppercase"
        >
          {isExpanded ? 'Collapse' : 'Details'}
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
          >
            <div className="pt-6 mt-4 border-t border-slate-100 space-y-4">
               <p className="text-xs text-slate-500 leading-relaxed">{task.description || 'No description provided.'}</p>
               
               <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sub-tasks</h5>
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

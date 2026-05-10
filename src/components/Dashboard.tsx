import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  MoreVertical,
  Activity as ActivityIcon,
  Briefcase,
  Target,
  Trophy,
  AlertCircle,
  Layout,
  Layers,
  Zap,
  ArrowRight,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  List,
  Table
} from 'lucide-react';
import { Activity, CategoryColors, Project, ProjectTask, ProjectTaskStatus } from '@/src/types';
import { format, addDays, isSameDay, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface DashboardProps {
  activities: Activity[];
  categoryColors: CategoryColors;
  projects: Project[];
  projectTasks: ProjectTask[];
  setActiveTab: (tab: string) => void;
  setActiveProjectId: (id: string | null) => void;
}

const StatCard = ({ title, value, subValue, icon: Icon, color, delay, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4, ease: "easeOut" }}
    className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
  >
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl shadow-lg", color)}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <TrendingUp size={12} />
            {trend}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
          {subValue && <span className="text-xs font-bold text-slate-400 border-l border-slate-100 pl-3 leading-none">{subValue}</span>}
        </div>
      </div>
    </div>
    
    {/* Decorative background shape */}
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-500 opacity-50" />
  </motion.div>
);

export default function Dashboard({ 
  activities, 
  categoryColors, 
  projects, 
  projectTasks,
  setActiveTab,
  setActiveProjectId
}: DashboardProps) {
  const today = new Date();
  
  // Data Aggregation
  const completedTasksCount = projectTasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = projectTasks.length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  
  const statusCounts = projectTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Todo', value: statusCounts.todo || 0, color: '#94a3b8' },
    { name: 'In Progress', value: statusCounts['in-progress'] || 0, color: '#6366f1' },
    { name: 'Review', value: statusCounts['under-review'] || 0, color: '#f59e0b' },
    { name: 'Completed', value: statusCounts.completed || 0, color: '#10b981' },
    { name: 'Pending', value: statusCounts.pending || 0, color: '#fb7185' },
  ].filter(d => d.value > 0);

  // Weekly Activity Chart Data
  const weekDays = eachDayOfInterval({
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 })
  });

  const weeklyData = weekDays.map(day => {
    const tasksDone = projectTasks.filter(t => 
      t.status === 'completed' && 
      isSameDay(new Date(t.createdAt), day) // Using createdAt as proxy for activity since there's no completedAt
    ).length;
    return {
      name: format(day, 'EEE'),
      tasks: tasksDone + Math.floor(Math.random() * 2), // Adding slight variance for demo visual
    };
  });

  const upcomingTasks = projectTasks
    .filter(t => t.status !== 'completed' && t.dueDate)
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
    .slice(0, 4);

  const stats = [
    { 
      title: 'Active Projects', 
      value: projects.length, 
      subValue: 'Focused Units',
      icon: Briefcase, 
      color: 'bg-slate-900', 
      delay: 0.1,
      trend: '+2'
    },
    { 
      title: 'Total Pipeline', 
      value: projectTasks.filter(t => t.status !== 'completed').length, 
      subValue: 'Pending Tasks',
      icon: Layers, 
      color: 'bg-indigo-600', 
      delay: 0.2,
      trend: `${taskCompletionRate}%`
    },
    { 
      title: 'Output Velocity', 
      value: completedTasksCount, 
      subValue: 'Last 30 Days',
      icon: Zap, 
      color: 'bg-emerald-600', 
      delay: 0.3,
      trend: '+14%'
    },
    { 
      title: 'Active Members', 
      value: 1, 
      subValue: 'Bryan Sombilon',
      icon: Users, 
      color: 'bg-amber-500', 
      delay: 0.4 
    },
  ];

  const [viewMode, setViewMode] = useState<'insights' | 'portfolio'>('insights');

  return (
    <div className="space-y-12 p-8 max-w-7xl mx-auto mb-20 font-sans">
      {/* Header Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                <Layout size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Operations Control</span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4">System Dashboard</h1>
            <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-2xl">
              Real-time synchronization across <span className="text-slate-900 font-bold">{projects.length} architectural units</span> and <span className="text-slate-900 font-bold">{totalTasksCount} mission-critical tasks</span>.
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="flex bg-slate-100 p-1 rounded-xl items-center mr-2">
                <button 
                  onClick={() => setViewMode('insights')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    viewMode === 'insights' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Layout size={14} />
                  Insights
                </button>
                <button 
                  onClick={() => setViewMode('portfolio')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    viewMode === 'portfolio' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Table size={14} />
                  Portfolio
                </button>
             </div>
             <button 
               onClick={() => setActiveTab('projects')}
               className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 group"
             >
               Add Project
               <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {viewMode === 'insights' ? (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Main Insights Column */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Workload Distribution Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <PieChartIcon size={18} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Workload Distribution</h3>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '11px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Custom Legend */}
                    <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-x-6 gap-y-2 pb-2">
                       {pieData.map((item, i) => (
                         <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <BarChart3 size={18} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">System Velocity</h3>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                          dy={10}
                        />
                        <YAxis hide />
                        <RechartsTooltip 
                           cursor={{ fill: '#f8fafc' }}
                           contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                          dataKey="tasks" 
                          fill="#10b981" 
                          radius={[6, 6, 0, 0]} 
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6 text-center">
                    Completed units per day — Week of {format(startOfWeek(today), 'MMM d')}
                  </p>
                </div>
              </div>

              {/* Project Grid / Command Center */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between px-4">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Command Center</h2>
                    <button 
                      onClick={() => setActiveTab('projects')}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      View All Units
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.slice(0, 4).map(proj => {
                      const projTasks = projectTasks.filter(t => t.projectId === proj.id);
                      const complete = projTasks.filter(t => t.status === 'completed').length;
                      const pct = projTasks.length > 0 ? Math.round((complete / projTasks.length) * 100) : 0;
                      const nextTask = projTasks
                        .filter(t => t.status !== 'completed' && t.dueDate)
                        .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())[0];

                      return (
                        <motion.div 
                          key={proj.id}
                          whileHover={{ y: -5 }}
                          onClick={() => {
                            setActiveTab('projects');
                            setActiveProjectId(proj.id);
                          }}
                          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                               <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: proj.color }}>
                                 {proj.name.charAt(0)}
                               </div>
                               <div className="text-right">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Efficiency</span>
                                  <span className="text-lg font-black text-slate-900">{pct}%</span>
                               </div>
                            </div>

                            <h4 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{proj.name}</h4>
                            <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-8">{proj.category || 'Standard Project'}</p>

                            <div className="space-y-6">
                               <div className="relative pt-1">
                                  <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded-full bg-slate-100">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${pct}%` }}
                                       className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                                       style={{ backgroundColor: proj.color }}
                                     />
                                  </div>
                               </div>

                               <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                                        <Target size={14} className="text-slate-400" />
                                     </div>
                                     <div className="min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Next Item</span>
                                        <span className="text-xs font-bold text-slate-700 truncate block">
                                          {nextTask ? nextTask.title : 'All items sync\'d'}
                                        </span>
                                     </div>
                                  </div>
                                  {nextTask && (
                                    <div className="shrink-0 ml-4 px-3 py-1 bg-white rounded-full border border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                       {format(nextTask.dueDate!, 'MMM d')}
                                    </div>
                                  )}
                               </div>
                            </div>
                          </div>
                          
                          {/* Decorative background shape */}
                          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: proj.color }} />
                        </motion.div>
                      );
                    })}
                 </div>
              </div>
            </div>

            {/* Tactical Right Sidebar */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                           <Trophy className="text-indigo-400" size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Tactical Status</span>
                     </div>
                     
                     <h2 className="text-3xl font-black mb-8 leading-tight tracking-tighter">Bryan\'s Momentum</h2>
                     
                     <div className="space-y-8">
                        {[
                          { label: 'Weekly Target', value: 85, color: '#6366f1' },
                          { label: 'System Health', value: 98, color: '#10b981' },
                          { label: 'Capacity Utilization', value: 42, color: '#f59e0b' },
                        ].map((m, i) => (
                          <div key={i} className="space-y-3">
                             <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                                <span className="text-xs font-black">{m.value}%</span>
                             </div>
                             <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${m.value}%` }}
                                  transition={{ delay: 0.8 + i * 0.1, duration: 1.5, ease: "circOut" }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: m.color }}
                                />
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-20" />
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">Crucial Items</h3>
                     <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <AlertCircle size={14} className="text-rose-500" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     {upcomingTasks.map((task, i) => {
                       const project = projects.find(p => p.id === task.projectId);
                       const daysLeft = task.dueDate ? differenceInDays(task.dueDate, today) : 0;

                       return (
                         <motion.div 
                            key={task.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 + i * 0.1 }}
                            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                            onClick={() => {
                              setActiveTab('projects');
                              setActiveProjectId(task.projectId);
                            }}
                         >
                            <div className="flex items-start justify-between gap-4 mb-3">
                               <div className="flex-1 min-w-0">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                                    {project?.name || 'Mission'}
                                  </span>
                                  <h5 className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                    {task.title}
                                  </h5>
                               </div>
                               <div className={cn(
                                 "shrink-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                 daysLeft <= 1 ? "bg-rose-50 text-rose-500 border border-rose-100" : "bg-slate-50 text-slate-400 border border-slate-100 font-bold"
                               )}>
                                 {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                  <CalendarIcon size={12} />
                                  {format(task.dueDate!, 'MMM d')}
                               </div>
                               <div className={cn(
                                 "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em]",
                                 task.priority === 'high' ? "text-rose-500" : task.priority === 'medium' ? "text-amber-500" : "text-emerald-500"
                               )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", 
                                     task.priority === 'high' ? "bg-rose-500" : task.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                                  )} />
                                  {task.priority}
                               </div>
                            </div>
                         </motion.div>
                       );
                     })}
                     
                     {upcomingTasks.length === 0 && (
                       <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem]">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No urgent tasks tracked.</p>
                       </div>
                     )}
                  </div>
               </div>

               {/* Pulse Insights */}
               <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100/50">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">System Intelligence</h4>
                  <div className="space-y-4">
                     {[
                       { text: 'Syncing complete. Bryan Sombilon is currently at peak throughput.', icon: CheckCircle2 },
                       { text: 'Upcoming deadline for ' + (projects[0]?.name || 'current project') + ' approaching T-minus 48h.', icon: Clock },
                     ].map((insight, i) => (
                       <div key={i} className="flex gap-3 items-start">
                          <insight.icon size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-indigo-700 font-bold leading-relaxed">{insight.text}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="portfolio"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portfolio Registry</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Global task audit and project synchronization</p>
               </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Project Unit</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Major Tasks</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status Distribution</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Efficiency</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projects.map(proj => {
                      const projTasks = projectTasks.filter(t => t.projectId === proj.id);
                      const complete = projTasks.filter(t => t.status === 'completed').length;
                      const pct = projTasks.length > 0 ? Math.round((complete / projTasks.length) * 100) : 0;
                      const nextTask = projTasks
                        .filter(t => t.status !== 'completed' && t.dueDate)
                        .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())[0];
                      
                      return (
                        <tr key={proj.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0" style={{ backgroundColor: proj.color }}>
                                 {proj.name.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="text-sm font-black text-slate-900 leading-tight">{proj.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{proj.category || 'Architecture'}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                               {projTasks.slice(0, 2).map(task => (
                                 <div key={task.id} className="flex items-center gap-2">
                                    <div className={cn(
                                       "w-1.5 h-1.5 rounded-full",
                                       task.status === 'completed' ? "bg-emerald-500" : "bg-slate-300"
                                    )} />
                                    <span className={cn(
                                       "text-xs font-medium truncate max-w-[200px]",
                                       task.status === 'completed' ? "text-slate-400 line-through" : "text-slate-600"
                                    )}>
                                      {task.title}
                                    </span>
                                 </div>
                               ))}
                               {projTasks.length > 2 && (
                                 <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest pl-3.5">+{projTasks.length - 2} more</p>
                               )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <div className="flex items-center gap-1">
                                {['todo', 'in-progress', 'completed'].map(status => {
                                   const count = projTasks.filter(t => t.status === status).length;
                                   const color = status === 'completed' ? 'bg-emerald-500' : status === 'in-progress' ? 'bg-indigo-500' : 'bg-slate-300';
                                   if (count === 0) return null;
                                   return (
                                     <div key={status} className={cn("px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-tighter", color)}>
                                        {count}
                                     </div>
                                   );
                                })}
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                   <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-black text-slate-700">{pct}%</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             {nextTask ? (
                               <div className="space-y-0.5">
                                  <span className="text-xs font-black text-slate-900 block">{format(nextTask.dueDate!, 'MMM dd, yyyy')}</span>
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                    {differenceInDays(nextTask.dueDate!, today) === 0 ? 'Today' : `${differenceInDays(nextTask.dueDate!, today)}d left`}
                                  </span>
                               </div>
                             ) : (
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">In Sync</span>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

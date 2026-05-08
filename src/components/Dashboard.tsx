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
  AlertCircle
} from 'lucide-react';
import { Activity, CategoryColors, Project, ProjectTask } from '@/src/types';
import { format, addDays, isSameDay, differenceInDays } from 'date-fns';
import { cn, isActivityOnDay } from '@/src/lib/utils';

interface DashboardProps {
  activities: Activity[];
  categoryColors: CategoryColors;
  projects: Project[];
  projectTasks: ProjectTask[];
  setActiveTab: (tab: string) => void;
  setActiveProjectId: (id: string | null) => void;
}

const StatCard = ({ title, value, subValue, icon: Icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="p-1 rounded-full bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrendingUp size={14} className="text-slate-400" />
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        {subValue && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
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
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  
  // Combine activities and project tasks for upcoming deadlines
  const upcomingDeadlines = [
    ...activities
      .filter(a => a.status === 'upcoming')
      .map(a => ({ ...a, type: 'activity' as const })),
    ...projectTasks
      .filter(t => t.status !== 'completed' && t.dueDate)
      .map(t => ({ 
        ...t, 
        date: t.dueDate!, 
        type: 'task' as const,
        category: projects.find(p => p.id === t.projectId)?.name || 'Project'
      }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);

  const completedTasksCount = projectTasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = projectTasks.length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Find the closest project deadline (from its tasks)
  const projectDeadlines = projects.map(project => {
    const projectTasksList = projectTasks.filter(t => t.projectId === project.id && t.dueDate && t.status !== 'completed');
    const nextDeadline = projectTasksList.length > 0 
      ? new Date(Math.min(...projectTasksList.map(t => t.dueDate!.getTime())))
      : null;
    
    return {
      ...project,
      nextDeadline,
      daysLeft: nextDeadline ? differenceInDays(nextDeadline, today) : null
    };
  }).filter(p => p.nextDeadline !== null).sort((a, b) => (a.daysLeft || 999) - (b.daysLeft || 999));

  const stats = [
    { 
      title: 'Active Projects', 
      value: projects.length, 
      subValue: 'Focused Work',
      icon: Briefcase, 
      color: 'bg-indigo-600', 
      delay: 0.1 
    },
    { 
      title: 'Pending Tasks', 
      value: projectTasks.filter(t => t.status !== 'completed').length, 
      subValue: `${taskCompletionRate}% Done`,
      icon: Target, 
      color: 'bg-blue-600', 
      delay: 0.2 
    },
    { 
      title: 'Events This Week', 
      value: activities.filter(a => a.date >= today && a.date <= addDays(today, 7)).length, 
      subValue: 'Meetings & Syncs',
      icon: CalendarIcon, 
      color: 'bg-amber-600', 
      delay: 0.3 
    },
    { 
      title: 'Milestones Hit', 
      value: completedTasksCount, 
      subValue: 'Completed Goals',
      icon: Trophy, 
      color: 'bg-emerald-600', 
      delay: 0.4 
    },
  ];

  return (
    <div className="space-y-12 p-10 max-w-7xl mx-auto">
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">System Dashboard</h1>
            <p className="text-slate-500 mt-3 text-lg font-medium leading-relaxed">
              Your ecosystem at a glance. You have <span className="text-indigo-600 font-bold">{upcomingDeadlines.length} items</span> demanding attention this week.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="px-4 py-2 bg-white rounded-xl shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Local Date</span>
                <span className="text-sm font-bold text-slate-700">{format(today, 'EEEE, MMM do')}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Project Countdown and Overview */}
        <section className="lg:col-span-8 space-y-10">
          {projectDeadlines.length > 0 && (
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-100/20">
               {/* Animated gradient background */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl -mr-48 -mt-48 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                      <Clock className="text-indigo-400" size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Critical Timeline</span>
                  </div>
                  
                  <h2 className="text-4xl font-black mb-2 tracking-tight">{projectDeadlines[0].name}</h2>
                  <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed line-clamp-2">
                    {projectDeadlines[0].description || 'No project objective defined yet.'}
                  </p>

                  <div className="flex items-center gap-4">
                     <div className="px-5 py-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Time Remaining</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white">{projectDeadlines[0].daysLeft}</span>
                          <span className="text-xs font-bold text-slate-400">Days</span>
                        </div>
                     </div>
                     <div className="px-5 py-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <span className="text-[9px] font-black text-indigo-100 uppercase tracking-widest block mb-1">Next Milestone</span>
                        <span className="text-sm font-black text-white">
                          {format(projectDeadlines[0].nextDeadline!, 'MMM dd')}
                        </span>
                     </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm self-start">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Execution Progress</h4>
                  <div className="space-y-6">
                    {projects.slice(0, 3).map(proj => {
                      const projTasks = projectTasks.filter(t => t.projectId === proj.id);
                      const done = projTasks.filter(t => t.status === 'completed').length;
                      const pct = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
                      
                      return (
                        <div key={proj.id} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                               {proj.name}
                            </span>
                            <span className="font-mono text-slate-400">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${pct}%` }}
                               transition={{ delay: 0.5, duration: 1 }}
                               className="h-full rounded-full"
                               style={{ backgroundColor: proj.color }}
                             />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Timeline Events</h2>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort by Intensity</span>
              </div>
            </div>
            
            <div className="grid gap-4">
              {upcomingDeadlines.map((item, i) => (
                <motion.div 
                  key={`${item.id}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  onClick={() => {
                    if (item.type === 'task') {
                      setActiveTab('projects');
                      setActiveProjectId(item.projectId);
                    } else {
                      setActiveTab('calendar');
                    }
                  }}
                  className="group flex items-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300 cursor-pointer"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-colors",
                    item.type === 'task' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400"
                  )}>
                    <span className="text-[9px] font-black uppercase leading-none tracking-tighter">{format(item.date, 'MMM')}</span>
                    <span className="text-xl font-black leading-none mt-1">{format(item.date, 'dd')}</span>
                  </div>
                  
                  <div className="ml-6 flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {item.type === 'task' ? 'Project Deadline' : 'Calendar Activity'}
                      </span>
                      {item.type === 'task' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-widest">
                           <AlertCircle size={10} /> Priority
                        </div>
                      )}
                    </div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Clock size={12} className="mr-1.5" /> 
                        {item.type === 'task' ? 'Due EOD' : item.startTime}
                      </span>
                      <div className="flex items-center gap-2">
                         <div className="w-1 h-1 bg-slate-200 rounded-full" />
                         <span 
                           className="text-[10px] font-black tracking-widest uppercase"
                           style={{ color: item.type === 'activity' ? (categoryColors[item.category] || '#64748b') : (projects.find(p => p.id === (item as ProjectTask).projectId)?.color || '#6366f1') }}
                         >
                           {item.category}
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer">
                      <MoreVertical size={20} />
                    </div>
                  </div>
                </motion.div>
              ))}

              {upcomingDeadlines.length === 0 && (
                <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                   <ActivityIcon size={48} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 font-bold">No upcoming items found in your timeline.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar Summary */}
        <section className="lg:col-span-4 space-y-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 px-2 mb-6 tracking-tight">Active Pulse</h2>
            <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 overflow-hidden relative group">
              <div className="relative z-10">
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Productivity Index</p>
                <h3 className="text-4xl font-black mb-8 leading-tight">Momentum Stream</h3>
                
                <div className="space-y-3 mb-10">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest leading-none">
                    <span className="text-indigo-200">System Velocity</span>
                    <span>{taskCompletionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-indigo-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${taskCompletionRate}%` }}
                      transition={{ delay: 1.2, duration: 2, ease: "circOut" }}
                      className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                      <span className="text-[10px] font-black text-indigo-200 block mb-1">Completed</span>
                      <span className="text-2xl font-black leading-none">{completedTasksCount}</span>
                   </div>
                   <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                      <span className="text-[10px] font-black text-indigo-200 block mb-1">In Pipeline</span>
                      <span className="text-2xl font-black leading-none">{projectTasks.filter(t => t.status !== 'completed').length}</span>
                   </div>
                </div>
              </div>
              
              {/* Abstract decors */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-20" />
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">System Pulse</h4>
            <div className="space-y-6">
              {[
                { 
                  text: `Peak focus window identified: 09:00 AM - 11:30 AM based on activity density.`, 
                  icon: Clock, 
                  color: 'text-indigo-500' 
                },
                { 
                  text: `Weekly velocity is ${taskCompletionRate > 50 ? 'optimizing' : 'stabilizing'}. Tasks moving at efficient rates.`, 
                  icon: TrendingUp, 
                  color: 'text-emerald-500' 
                },
                { 
                  text: `${projectDeadlines.length > 0 ? `${projectDeadlines[0].name} has the highest immediate priority.` : 'Your project pipeline is currently clear.'}`, 
                  icon: AlertCircle, 
                  color: 'text-amber-500' 
                }
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100/50 shadow-sm">
                  <div className={cn("p-2 rounded-xl bg-slate-50", insight.color)}>
                    <insight.icon size={14} />
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Project Grid */}
          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Journey Trackers</h4>
             </div>
             <div className="space-y-3">
                {projects.slice(0, 4).map(proj => (
                  <div 
                    key={proj.id} 
                    onClick={() => {
                      setActiveTab('projects');
                      setActiveProjectId(proj.id);
                    }}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors shadow-sm cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: proj.color }}>
                         {proj.name.charAt(0)}
                       </div>
                       <div>
                         <h5 className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{proj.name}</h5>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{proj.category || 'General'}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-black text-slate-800">
                          {projectTasks.filter(t => t.projectId === proj.id && t.status === 'completed').length} / {projectTasks.filter(t => t.projectId === proj.id).length}
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}

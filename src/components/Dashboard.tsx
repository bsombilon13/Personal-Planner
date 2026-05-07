import { motion } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  MoreVertical,
  Activity as ActivityIcon
} from 'lucide-react';
import { Activity, CategoryColors } from '@/src/types';
import { format, addDays, isSameDay } from 'date-fns';
import { cn, isActivityOnDay } from '@/src/lib/utils';

interface DashboardProps {
  activities: Activity[];
  categoryColors: CategoryColors;
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2.5 rounded-xl", color)}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </motion.div>
);

export default function Dashboard({ activities, categoryColors }: DashboardProps) {
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  
  const upcomingOccurrences = next7Days.flatMap(day => 
    activities
      .filter(a => isActivityOnDay(a, day) && a.status === 'upcoming')
      .map(a => ({ ...a, date: day }))
  ).slice(0, 5);

  const stats = [
    { title: 'Total Activities', value: activities.length, icon: ActivityIcon, color: 'bg-indigo-500', delay: 0.1 },
    { title: 'Upcoming Today', value: activities.filter(a => isActivityOnDay(a, today)).length, icon: CalendarIcon, color: 'bg-amber-500', delay: 0.2 },
    { title: 'Completed', value: activities.filter(a => a.status === 'completed').length, icon: CheckCircle2, color: 'bg-emerald-500', delay: 0.3 },
    { title: 'Hours Focused', value: '32.5h', icon: Clock, color: 'bg-blue-500', delay: 0.4 },
  ];

  return (
    <div className="space-y-8 p-8">
      <section>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-slate-500 mt-2 font-medium">Welcome back! You have {upcomingOccurrences.length} important tasks for the week.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 px-2">Upcoming Activities</h2>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          
          <div className="space-y-4">
            {upcomingOccurrences.map((activity, i) => (
              <motion.div
                key={`${activity.id}-${format(activity.date, 'yyyy-MM-dd')}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:translate-x-1 transition-transform duration-200"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex flex-col items-center justify-center shrink-0 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">{format(activity.date, 'MMM')}</span>
                  <span className="text-sm font-bold text-slate-800 leading-none mt-0.5">{format(activity.date, 'dd')}</span>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">{activity.title}</h4>
                  <div className="flex items-center mt-0.5 space-x-3">
                    <span className="flex items-center text-[10px] text-slate-400 font-medium">
                      <Clock size={10} className="mr-1" /> {activity.startTime}
                    </span>
                    <span 
                      className="flex items-center text-[10px] font-bold tracking-wide transition-colors"
                      style={{ color: categoryColors[activity.category] || '#64748b' }}
                    >
                      {activity.category.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                  activity.status === 'upcoming' 
                    ? "bg-amber-50 text-amber-600 border-amber-100" 
                    : activity.status === 'in-progress' 
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                  {activity.status}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sidebar Summary */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 px-2">Weekly Goal</h2>
          <div className="bg-indigo-900 p-8 rounded-2xl text-white shadow-xl shadow-indigo-200 overflow-hidden relative group">
            <div className="relative z-10">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">My Progress</p>
              <h3 className="text-3xl font-bold mb-6">Master Planner 2.0</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-indigo-200">Completion</span>
                  <span>78%</span>
                </div>
                <div className="h-2 w-full bg-indigo-950 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '78%' }}
                    transition={{ delay: 1, duration: 1.5 }}
                    className="h-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" 
                  />
                </div>
              </div>
              
              <button className="mt-8 w-full bg-white text-indigo-900 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                View Reports
              </button>
            </div>
            
            {/* Decors */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-50 group-hover:bg-indigo-700 transition-colors" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-800 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl opacity-30" />
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 dashed">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Quick Insights</h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                <p className="ml-3 text-xs text-slate-600 leading-relaxed">Most active between <span className="font-bold text-slate-900">09:00 AM - 11:30 AM</span> recently.</p>
              </div>
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                <p className="ml-3 text-xs text-slate-600 leading-relaxed">Weekly completion rate up by <span className="font-bold text-slate-900">22%</span> from last week.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO,
  subDays,
  startOfDay,
  isBefore,
  isAfter
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  LayoutGrid, 
  List, 
  Calendar as CalendarIcon,
  Maximize2,
  MoreHorizontal,
  Clock,
  MapPin,
  Printer
} from 'lucide-react';
import { Activity, CalendarViewType, CategoryColors } from '@/src/types';
import { cn, isActivityOnDay, calculateEndTime, generateGoogleCalendarUrl } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, GripVertical, Share2 } from 'lucide-react';
import { 
  DndContext, 
  DragEndEvent, 
  useDraggable, 
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

interface CalendarProps {
  activities: Activity[];
  categoryColors: CategoryColors;
  onAddActivity: (date?: Date, startTime?: string) => void;
  onEditActivity: (activity: Activity) => void;
  onSaveActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onUpdateCategoryColor: (category: string, color: string) => void;
  onAddCategory: (category: string, color: string) => void;
}

export default function Calendar({ 
  activities, 
  categoryColors,
  onAddActivity,
  onEditActivity, 
  onSaveActivity,
  onDeleteActivity,
  onUpdateCategoryColor,
  onAddCategory
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // New States for Detail View
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleSlotClick = (date: Date, time: string) => {
    onAddActivity(date, time);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activityId = active.id as string;
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const overId = over.id as string;
    if (overId.startsWith('slot-')) {
      const parts = overId.split('_');
      // format: slot_YYYY-MM-DD_HH-mm
      const dateStr = parts[1];
      const timeStr = parts[2].replace('-', ':');
      
      const [year, month, day] = dateStr.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      
      onSaveActivity({
        ...activity,
        date: newDate,
        startTime: timeStr
      });
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setCurrentDate(day);
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  const handleEditClick = () => {
    if (!selectedActivity) return;
    onEditActivity(selectedActivity);
    setIsDetailOpen(false);
  };

  const handleDeleteClick = () => {
    if (selectedActivity) {
      onDeleteActivity(selectedActivity.id);
      setIsDetailOpen(false);
      setSelectedActivity(null);
    }
  };

  const nextPeriod = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, -1));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left List Panel */}
      <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
           <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Activities</h2>
           <button 
             onClick={() => onAddActivity(selectedDay)}
             className="p-1 cursor-pointer hover:bg-slate-200 rounded-md transition-colors text-indigo-600"
           >
             <Plus size={16} />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-0 no-scrollbar">
          <AnimatePresence mode="popLayout">
            {activities
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((activity, index) => (
                <motion.div 
                  key={activity.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 border-b border-slate-200 bg-white hover:bg-indigo-50 transition-all cursor-pointer group",
                    isActivityOnDay(activity, selectedDay) && "border-l-4 border-l-indigo-500 bg-indigo-50/50"
                  )}
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white flex items-center gap-2"
                      style={{ backgroundColor: categoryColors[activity.category] || '#6366f1' }}
                    >
                      {activity.category}
                      {activity.recurrence && activity.recurrence.frequency !== 'none' && (
                        <span className="bg-white/20 px-1 rounded text-[8px] tracking-normal lowercase italic">
                          {activity.recurrence.frequency}
                        </span>
                      )}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">{activity.title}</h4>
                  <div className="flex items-center text-[10px] text-slate-400 font-medium">
                     {format(activity.date, 'MMM d, yyyy')} • {activity.startTime}
                  </div>
                </motion.div>
              ))
            }
          </AnimatePresence>
        </div>

        {/* Category Settings */}
        <div className="mt-auto border-t border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Palette size={14} className="text-slate-400" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Labels</h2>
            </div>
            <button 
              onClick={() => {
                const name = prompt('New category name:');
                if (name) onAddCategory(name, '#6366f1');
              }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
            >
              + ADD
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-slate-700">{category}</span>
                </div>
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => onUpdateCategoryColor(category, e.target.value)}
                  className="w-4 h-4 rounded-full border-0 p-0 overflow-hidden cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Change ${category} color`}
                />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Calendar Panel */}
      <main className="flex-1 flex flex-col bg-slate-50 calendar-container">
        {/* Calendar Header */}
        <header className="bg-white border-b border-slate-100 p-6 flex items-center justify-between shadow-sm z-10 no-print">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-slate-800 min-w-[200px]">
              {format(currentDate, 'MMMM yyyy')}
            </h1>
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setViewType('month')}
                className={cn(
                  "px-4 py-1 text-sm font-medium rounded-md transition-all duration-300 relative z-10",
                  viewType === 'month' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {viewType === 'month' && (
                  <motion.div 
                    layoutId="view-bg" 
                    className="absolute inset-0 bg-white rounded-md shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                Month
              </button>
              <button 
                onClick={() => setViewType('week')}
                className={cn(
                  "px-4 py-1 text-sm font-medium rounded-md transition-all duration-300 relative z-10",
                  viewType === 'week' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {viewType === 'week' && (
                  <motion.div 
                    layoutId="view-bg" 
                    className="absolute inset-0 bg-white rounded-md shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                Week
              </button>
              <button 
                onClick={() => setViewType('day')}
                className={cn(
                  "px-4 py-1 text-sm font-medium rounded-md transition-all duration-300 relative z-10",
                  viewType === 'day' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {viewType === 'day' && (
                  <motion.div 
                    layoutId="view-bg" 
                    className="absolute inset-0 bg-white rounded-md shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                Day
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Print Calendar"
            >
              <Printer size={20} />
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={prevPeriod} className="p-1 px-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-600">Today</button>
              <button onClick={nextPeriod} className="p-1 px-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* View Rendering */}
        <div className="flex-1 overflow-auto p-6">
          <DndContext 
            sensors={sensors} 
            onDragEnd={handleDragEnd}
            modifiers={[restrictToFirstScrollableAncestor]}
          >
            <AnimatePresence mode="wait">
              {viewType === 'month' && (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="h-full"
                >
                  <MonthView 
                    currentDate={currentDate} 
                    activities={activities} 
                    categoryColors={categoryColors} 
                    onActivityClick={handleActivityClick}
                    onDayClick={handleDayClick}
                    isActivityOnDay={isActivityOnDay}
                  />
                </motion.div>
              )}
              {viewType === 'week' && (
                 <motion.div key="week" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                    <WeekView 
                      currentDate={currentDate} 
                      activities={activities} 
                      categoryColors={categoryColors} 
                      onActivityClick={handleActivityClick}
                      isActivityOnDay={isActivityOnDay}
                      onSlotClick={handleSlotClick}
                    />
                 </motion.div>
              )}
              {viewType === 'day' && (
                 <motion.div key="day" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                    <DayView 
                      currentDate={currentDate} 
                      activities={activities} 
                      categoryColors={categoryColors} 
                      onActivityClick={handleActivityClick}
                      isActivityOnDay={isActivityOnDay}
                      onSlotClick={handleSlotClick}
                    />
                 </motion.div>
              )}
            </AnimatePresence>
          </DndContext>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedActivity && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsDetailOpen(false)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100]" 
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full bg-white w-full max-w-md z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[selectedActivity.category] || '#6366f1' }} />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{selectedActivity.category}</span>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">{selectedActivity.title}</h2>
                  <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-500">
                    <span className="flex items-center"><CalendarIcon size={16} className="mr-2 text-slate-300" /> {format(selectedActivity.date, 'EEEE, MMM d, yyyy')}</span>
                    <span className="flex items-center"><Clock size={16} className="mr-2 text-slate-300" /> {selectedActivity.startTime} - {calculateEndTime(selectedActivity.startTime, selectedActivity.duration)} ({selectedActivity.duration} min)</span>
                    {selectedActivity.location && (
                      <span className="flex items-center"><MapPin size={16} className="mr-2 text-slate-300" /> {selectedActivity.location}</span>
                    )}
                  </div>
                </div>

                {selectedActivity.description && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Description</h4>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedActivity.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Status</h4>
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold w-fit border",
                      selectedActivity.status === 'upcoming' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      selectedActivity.status === 'in-progress' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {selectedActivity.status.toUpperCase()}
                    </div>

                    <a 
                      href={generateGoogleCalendarUrl(selectedActivity)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    >
                      <Share2 size={14} />
                      Add to Google Calendar
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={handleEditClick}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Edit Task
                </button>
                <button 
                  onClick={handleDeleteClick}
                  className="flex-1 bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl hover:bg-rose-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components for different views
const ActivityCard = ({ 
  activity, 
  onActivityClick, 
  categoryColors,
  style,
  className
}: { 
  activity: Activity, 
  onActivityClick: (activity: Activity) => void, 
  categoryColors: Record<string, string>,
  style?: React.CSSProperties,
  className?: string,
  key?: React.Key
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
  });

  const dndStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  const combinedStyle = { ...style, ...dndStyle };

  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onActivityClick(activity);
      }}
      style={{ 
        ...combinedStyle, 
        backgroundColor: categoryColors[activity.category] || '#6366f1',
        opacity: isDragging ? 0.5 : 1
      }}
      className={cn(
        "activity-card absolute left-1 right-1 text-white p-2 rounded-xl text-[10px] font-bold shadow-md z-10 border border-white/20 backdrop-blur-sm truncate cursor-pointer hover:brightness-110 hover:scale-[1.01] transition-all",
        isDragging && "cursor-grabbing",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="truncate">{activity.title}</span>
        <GripVertical size={10} className="shrink-0 opacity-50" />
      </div>
      <div className="text-[9px] opacity-80 mt-0.5">
        {activity.startTime} - {calculateEndTime(activity.startTime, activity.duration)}
      </div>
    </div>
  );
};

const TimeSlot = ({ 
  id, 
  children, 
  className,
  onClick
}: { 
  id: string, 
  children?: React.ReactNode, 
  className?: string,
  key?: React.Key,
  onClick?: () => void
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef} 
      onClick={onClick}
      className={cn(
        className,
        isOver && "bg-indigo-50/50 ring-2 ring-indigo-500 ring-inset"
      )}
    >
      {children}
    </div>
  );
};

const MonthView = ({ 
  currentDate, 
  activities, 
  categoryColors, 
  onActivityClick,
  onDayClick,
  isActivityOnDay
}: { 
  currentDate: Date, 
  activities: Activity[], 
  categoryColors: CategoryColors,
  onActivityClick: (activity: Activity) => void,
  onDayClick: (day: Date) => void,
  isActivityOnDay: (activity: Activity, day: Date) => boolean
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-none overflow-hidden main-calendar-grid">
      <div className="grid grid-cols-7 border-b border-slate-200 text-center">
        {weekdays.map(day => (
          <div key={day} className="py-2 text-xs font-bold text-slate-400 uppercase">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto no-scrollbar">
        {calendarDays.map((day, i) => {
          const dayActivities = activities.filter(a => isActivityOnDay(a, day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = isSameDay(day, currentDate);
          
          return (
            <div 
              key={day.toISOString()} 
              onClick={() => onDayClick(day)}
              className={cn(
                "p-2 border-r border-b border-slate-100 min-h-[100px] transition-colors relative group",
                !isCurrentMonth ? "text-slate-300" : "text-slate-800",
                isSelected && "bg-indigo-50",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "text-xs font-bold",
                  isSelected ? "text-indigo-600" : (isCurrentMonth ? "text-slate-800" : "text-slate-300")
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayActivities.slice(0, 2).map(activity => (
                  <div 
                    key={activity.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onActivityClick(activity);
                    }}
                    style={{ backgroundColor: categoryColors[activity.category] || '#6366f1' }}
                    className={cn(
                      "px-1 py-0.5 text-[9px] font-bold rounded truncate text-white shadow-sm cursor-pointer hover:scale-[1.02] transition-transform activity-card",
                    )}
                  >
                    {activity.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeekView = ({ 
  currentDate, 
  activities, 
  categoryColors,
  onActivityClick,
  isActivityOnDay,
  onSlotClick
}: { 
  currentDate: Date, 
  activities: Activity[], 
  categoryColors: CategoryColors,
  onActivityClick: (activity: Activity) => void,
  isActivityOnDay: (activity: Activity, day: Date) => boolean,
  onSlotClick?: (date: Date, time: string) => void
}) => {
  const startDate = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm main-calendar-grid">
      <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50">
        <div className="p-4 border-r border-slate-100" />
        {weekDays.map(day => (
          <div key={day.toISOString()} className={cn("p-4 text-center border-r border-slate-100 last:border-r-0", isToday(day) && "bg-indigo-50/40")}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{format(day, 'EEE')}</p>
            <p className={cn("text-lg font-bold", isToday(day) ? "text-indigo-600" : "text-slate-900")}>{format(day, 'd')}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-8 relative">
        {/* Time Labels */}
        <div className="col-span-1 border-r border-slate-50">
          {hours.map(h => (
            <div key={h} className="h-20 border-b border-slate-50 flex items-start justify-center pt-2">
              <span className="text-[10px] font-bold text-slate-400">{h % 12 || 12}:00 {h >= 12 ? 'PM' : 'AM'}</span>
            </div>
          ))}
        </div>
        {/* Day Columns */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="col-span-1 border-r border-slate-100 last:border-r-0 relative group">
            {hours.map(h => {
              const timeStr = `${h.toString().padStart(2, '0')}:00`;
              return (
                <TimeSlot 
                  key={h} 
                  id={`slot_${format(day, 'yyyy-MM-dd')}_${h}-00`}
                  className="h-20 border-b border-slate-50 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  onClick={() => onSlotClick?.(day, timeStr)}
                />
              );
            })}
            {/* Render absolute activities */}
            {activities
              .filter(a => isActivityOnDay(a, day))
              .map(a => {
                const hour = parseInt(a.startTime.split(':')[0]);
                const minute = parseInt(a.startTime.split(':')[1]);
                const top = (hour - 8) * 80 + (minute / 60) * 80;
                const height = (a.duration / 60) * 80;
                
                return (
                  <ActivityCard 
                    key={a.id}
                    activity={a}
                    onActivityClick={onActivityClick}
                    categoryColors={categoryColors}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  />
                );
              })
            }
          </div>
        ))}
      </div>
    </div>
  );
};

const DayView = ({ 
  currentDate, 
  activities, 
  categoryColors,
  onActivityClick,
  isActivityOnDay,
  onSlotClick
}: { 
  currentDate: Date, 
  activities: Activity[], 
  categoryColors: CategoryColors,
  onActivityClick: (activity: Activity) => void,
  isActivityOnDay: (activity: Activity, day: Date) => boolean,
  onSlotClick?: (date: Date, time: string) => void
}) => {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);
  const dayActivities = activities.filter(a => isActivityOnDay(a, currentDate));

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm main-calendar-grid">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex flex-col items-center justify-center border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{format(currentDate, 'MMM')}</span>
            <span className="text-2xl font-bold text-slate-900 leading-none mt-1">{format(currentDate, 'dd')}</span>
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{format(currentDate, 'EEEE')}</h2>
            <p className="text-slate-500 font-medium">{dayActivities.length} Scheduled Activities</p>
          </div>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Maximize2 size={18} />
          <span>Sync Plan</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 relative no-scrollbar">
        {hours.map(h => {
          const timeStr = `${h.toString().padStart(2, '0')}:00`;
          return (
            <div key={h} className="group flex items-start mb-12 relative h-12">
              <div className="w-20 pt-1 shrink-0">
                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                  {h % 12 || 12}:00 {h >= 12 ? 'PM' : 'AM'}
                </span>
              </div>
              <TimeSlot 
                id={`slot_${format(currentDate, 'yyyy-MM-dd')}_${h}-00`}
                className="flex-1 h-[1px] bg-slate-100 mt-3 group-hover:bg-slate-200 transition-colors relative cursor-pointer"
                onClick={() => onSlotClick?.(currentDate, timeStr)}
              />
            </div>
          );
        })}

        {dayActivities.map(a => {
          const hour = parseInt(a.startTime.split(':')[0]);
          const minute = parseInt(a.startTime.split(':')[1]);
          const top = (hour - 8) * 80 + (minute / 60) * 80 + 40; // +40 for padding
          const height = (a.duration / 60) * 80;

          return (
            <ActivityCard
              key={a.id}
              activity={a}
              onActivityClick={onActivityClick}
              categoryColors={categoryColors}
              style={{ 
                top: `${top}px`, 
                height: `${height}px`, 
                left: '120px', 
                right: '40px',
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid'
              }}
              className="bg-white border-l-4 shadow-xl shadow-slate-100 rounded-r-3xl p-6 z-10 flex flex-col justify-center group hover:scale-[1.01] transition-transform cursor-pointer text-slate-900"
            />
          );
        })}
      </div>
    </div>
  );
};

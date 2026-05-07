import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { Activity, CategoryColors, RecurrenceFrequency } from '@/src/types';
import { calculateEndTime, calculateDuration } from '@/src/lib/utils';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Omit<Activity, 'id'> | Activity) => void;
  onAddCategory?: (category: string, color: string) => void;
  editingActivity: Activity | null;
  categoryColors: CategoryColors;
  defaultDate?: Date;
  defaultStartTime?: string;
}

export default function ActivityModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onAddCategory,
  editingActivity, 
  categoryColors,
  defaultDate,
  defaultStartTime
}: ActivityModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Work',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    description: '',
    location: '',
    frequency: 'none' as RecurrenceFrequency,
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

  useEffect(() => {
    if (editingActivity) {
      setFormData({
        title: editingActivity.title,
        category: editingActivity.category,
        date: format(editingActivity.date, 'yyyy-MM-dd'),
        startTime: editingActivity.startTime,
        endTime: calculateEndTime(editingActivity.startTime, editingActivity.duration),
        duration: editingActivity.duration,
        description: editingActivity.description || '',
        location: editingActivity.location || '',
        frequency: editingActivity.recurrence?.frequency || 'none',
        endDate: editingActivity.recurrence?.endDate 
          ? format(editingActivity.recurrence.endDate, 'yyyy-MM-dd') 
          : format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      // Ensure defaultDate is actually a Date object (not a click event)
      const validDate = (defaultDate instanceof Date && !isNaN(defaultDate.getTime())) 
        ? defaultDate 
        : new Date();

      setFormData(prev => ({
        ...prev,
        title: '',
        date: format(validDate, 'yyyy-MM-dd'),
        startTime: defaultStartTime || '09:00',
        endTime: calculateEndTime(defaultStartTime || '09:00', 60),
        duration: 60,
        description: '',
        location: '',
        frequency: 'none',
        endDate: format(validDate, 'yyyy-MM-dd'),
      }));
    }
  }, [editingActivity, isOpen, defaultDate, defaultStartTime]);

  const handleAddCategory = () => {
    if (newCategoryName && onAddCategory) {
      onAddCategory(newCategoryName, newCategoryColor);
      setFormData({ ...formData, category: newCategoryName });
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activityData = {
      title: formData.title,
      category: formData.category,
      date: new Date(formData.date),
      startTime: formData.startTime,
      duration: formData.duration,
      description: formData.description,
      location: formData.location,
      status: editingActivity ? editingActivity.status : ('upcoming' as const),
      recurrence: formData.frequency !== 'none' ? {
        frequency: formData.frequency,
        endDate: new Date(formData.endDate),
      } : undefined,
    };

    if (editingActivity) {
      onSave({ ...activityData, id: editingActivity.id } as Activity);
    } else {
      onSave(activityData);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]" 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[40px] p-10 w-full max-w-lg z-[201] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">{editingActivity ? 'Edit Activity' : 'Create Activity'}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Title</label>
                <input 
                  autoFocus
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-300"
                  placeholder="E.g. Strategy Meeting"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Date</label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Start</label>
                  <input 
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => {
                      const newStart = e.target.value;
                      const newEnd = calculateEndTime(newStart, formData.duration);
                      setFormData({ ...formData, startTime: newStart, endTime: newEnd });
                    }}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">End</label>
                  <input 
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={e => {
                      const newEnd = e.target.value;
                      const newDuration = calculateDuration(formData.startTime, newEnd);
                      setFormData({ ...formData, endTime: newEnd, duration: newDuration });
                    }}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Duration (min)</label>
                  <input 
                    type="number"
                    required
                    value={formData.duration}
                    onChange={e => {
                      const newDur = parseInt(e.target.value) || 0;
                      const newEnd = calculateEndTime(formData.startTime, newDur);
                      setFormData({ ...formData, duration: newDur, endTime: newEnd });
                    }}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
                    Category
                    <button 
                      type="button"
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="text-indigo-600 hover:text-indigo-700 normal-case font-bold"
                    >
                      {showAddCategory ? 'Cancel' : '+ New Label'}
                    </button>
                  </label>
                  {!showAddCategory ? (
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {Object.keys(categoryColors).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="Label name"
                        className="flex-1 bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                      <input 
                        type="color"
                        value={newCategoryColor}
                        onChange={e => setNewCategoryColor(e.target.value)}
                        className="w-12 h-12 rounded-2xl border-0 p-0 overflow-hidden cursor-pointer"
                      />
                      <button 
                        type="button"
                        onClick={handleAddCategory}
                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Location</label>
                <input 
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-300"
                  placeholder="E.g. Conference Room B"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-300 min-h-[100px] resize-none"
                  placeholder="Add more details about this activity..."
                />
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-1">Recurrence</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select 
                      value={formData.frequency}
                      onChange={e => setFormData({ ...formData, frequency: e.target.value as RecurrenceFrequency })}
                      className="w-full bg-white border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium text-sm shadow-sm"
                    >
                      <option value="none">No Repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  {formData.frequency !== 'none' && (
                    <div>
                      <input 
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full bg-white border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium text-sm shadow-sm"
                        placeholder="End Date"
                      />
                    </div>
                  )}
                </div>
                {formData.frequency !== 'none' && (
                  <p className="text-[10px] text-indigo-400 font-medium px-1">
                    This event will repeat {formData.frequency} until {format(new Date(formData.endDate), 'MMM d, yyyy')}.
                  </p>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                  {editingActivity ? 'Save Changes' : 'Create Activity'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

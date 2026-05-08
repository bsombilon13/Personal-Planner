import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Search,
  PlusCircle,
  BarChart3,
  Briefcase,
  Code,
  Target,
  Zap,
  Smartphone,
  Globe,
  Sparkles,
  Award,
  Rocket,
  Paintbrush,
  Layout,
  FileText,
  StickyNote,
  Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Project, ProjectTask } from '@/src/types';
import { isSameDay, addDays } from 'date-fns';

interface NavItemProps {
  key?: string | number;
  icon: React.ElementType;
  imageUrl?: string;
  label: string;
  isActive?: boolean;
  isUrgent?: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  isExpanded: boolean;
}

const ICONS_MAP: Record<string, React.ElementType> = {
  Briefcase, Code, Target, Zap, Smartphone, Globe, Sparkles, Award, Rocket, Paintbrush, Layout, FileText
};

const NavItem = ({ icon: Icon, imageUrl, label, isActive, isUrgent, onClick, onDelete, isExpanded }: NavItemProps) => {
  return (
    <motion.div
      layout
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "group relative flex items-center w-full p-3 my-1 transition-all duration-200 cursor-pointer",
        isActive 
          ? "text-indigo-400 border-l-4 border-indigo-400 bg-slate-800/50" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent"
      )}
    >
      <div className={cn("w-6 h-6 shrink-0 flex items-center justify-center rounded-lg overflow-hidden relative", isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200")}>
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <Icon size={22} className="shrink-0" />
        )}
        {isUrgent && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900" />
        )}
      </div>
      
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="ml-4 flex-1 flex items-center justify-between min-w-0"
          >
            <span className="font-semibold whitespace-nowrap overflow-hidden text-sm truncate pr-2">
              {label}
            </span>
            <div className="flex items-center gap-2">
               {isUrgent && (
                 <span className="text-[8px] font-black bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-rose-500/30">
                   Due
                 </span>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpanded && (
        <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-50 shadow-xl border border-slate-700">
          {label}
        </div>
      )}
    </motion.div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  children: React.ReactNode;
}

const CollapsibleSection = ({ title, isExpanded, children }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-6">
      <div 
        onClick={() => isExpanded && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center px-3 mb-2 cursor-pointer transition-all",
          !isExpanded ? "justify-center" : "justify-between"
        )}
      >
        {isExpanded ? (
          <>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
            <ChevronRight size={12} className={cn("text-slate-400 transition-transform", isOpen && "rotate-90")} />
          </>
        ) : (
          <div className="h-[1px] w-4 bg-slate-200" />
        )}
      </div>
      
      <div className={cn("space-y-1 overflow-hidden transition-all", (!isOpen && isExpanded) && "max-h-0 opacity-0")}>
        {children}
      </div>
    </div>
  );
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  projects: Project[];
  projectTasks: ProjectTask[];
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  activeProjectId, 
  setActiveProjectId, 
  projects,
  projectTasks,
  onAddProject,
  onDeleteProject 
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const today = new Date();

  return (
    <motion.aside
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={false}
      animate={{ width: isHovered ? 240 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen bg-slate-900 z-50 flex flex-col pt-6 pb-4 shadow-2xl overflow-hidden"
    >
      {/* Brand Area */}
      <div className={cn("flex items-center px-4 mb-8 transition-all", !isHovered && "justify-center px-0")}>
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 font-bold text-white text-lg tracking-tight"
          >
            Nexus
          </motion.div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-0">
        <CollapsibleSection title="Main" isExpanded={isHovered}>
          <NavItem 
            icon={LayoutDashboard} 
            label="Overview" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            isExpanded={isHovered}
          />
          <NavItem 
            icon={CalendarIcon} 
            label="Calendar" 
            isActive={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')}
            isExpanded={isHovered}
          />
          <NavItem 
            icon={StickyNote} 
            label="Journal" 
            isActive={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')}
            isExpanded={isHovered}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Projects" isExpanded={isHovered}>
          {projects.map(project => {
            const Icon = ICONS_MAP[project.icon || 'Briefcase'] || Briefcase;
            const projectTasksList = projectTasks.filter(t => t.projectId === project.id && t.status !== 'completed');
            const isUrgent = projectTasksList.some(t => {
              if (!t.dueDate) return false;
              const diff = t.dueDate.getTime() - today.getTime();
              return diff < (48 * 60 * 60 * 1000) && diff > - (24 * 60 * 60 * 1000); // within 48h or slightly overdue
            });

            return (
              <NavItem 
                key={project.id}
                icon={Icon} 
                imageUrl={project.coverImage}
                label={project.name} 
                isActive={activeTab === 'projects' && activeProjectId === project.id} 
                isUrgent={isUrgent}
                onClick={() => {
                  setActiveTab('projects');
                  setActiveProjectId(project.id);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
                isExpanded={isHovered}
              />
            );
          })}
          <NavItem 
            icon={PlusCircle} 
            label="Create Project" 
            onClick={onAddProject}
            isExpanded={isHovered}
          />
        </CollapsibleSection>

      </div>

      <div className="mt-auto border-t border-slate-800 pt-4 px-0">
        <NavItem 
          icon={Search} 
          label="Search" 
          onClick={() => {
            alert("Search feature is currently under development. You can use the search bar in the Journals or Task sections in the meantime.");
          }}
          isExpanded={isHovered}
        />
        
      </div>
    </motion.aside>
  );
}

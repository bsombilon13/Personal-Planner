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
  FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Project } from '@/src/types';

interface NavItemProps {
  key?: string | number;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  isExpanded: boolean;
}

const ICONS_MAP: Record<string, React.ElementType> = {
  Briefcase, Code, Target, Zap, Smartphone, Globe, Sparkles, Award, Rocket, Paintbrush, Layout, FileText
};

const NavItem = ({ icon: Icon, label, isActive, onClick, isExpanded }: NavItemProps) => {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "group relative flex items-center w-full p-3 my-1 transition-all duration-200",
        isActive 
          ? "text-indigo-400 border-l-4 border-indigo-400 bg-slate-800/50" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent"
      )}
    >
      <Icon size={22} className={cn("shrink-0", isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200")} />
      
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="ml-4 font-semibold whitespace-nowrap overflow-hidden text-sm"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {!isExpanded && (
        <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-50 shadow-xl border border-slate-700">
          {label}
        </div>
      )}
    </motion.button>
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
  onAddProject: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  activeProjectId, 
  setActiveProjectId, 
  projects,
  onAddProject 
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

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
            icon={BarChart3} 
            label="Management" 
            isActive={activeTab === 'projects' && !activeProjectId} 
            onClick={() => {
              setActiveTab('projects');
              setActiveProjectId(null);
            }}
            isExpanded={isHovered}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Projects" isExpanded={isHovered}>
          {projects.map(project => {
            const Icon = ICONS_MAP[project.icon || 'Briefcase'] || Briefcase;
            return (
              <NavItem 
                key={project.id}
                icon={Icon} 
                label={project.name} 
                isActive={activeTab === 'projects' && activeProjectId === project.id} 
                onClick={() => {
                  setActiveTab('projects');
                  setActiveProjectId(project.id);
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
          onClick={() => {}}
          isExpanded={isHovered}
        />
        
      </div>
    </motion.aside>
  );
}

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDocPilot, type NavPage } from "@/context/DocPilotContext";
import {
  LayoutDashboard,
  Upload,
  MessageSquare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bot,
} from "lucide-react";

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "upload", label: "Upload", icon: <Upload size={18} /> },
  { id: "chat", label: "Chat", icon: <MessageSquare size={18} /> },
  { id: "documents", label: "Documents", icon: <FileText size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

export function Sidebar() {
  const { activePage, setActivePage, sidebarCollapsed, toggleSidebar, documents } = useDocPilot();
  const docCount = documents.filter((d) => d.status === "ready").length;

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-screen z-30"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
        sidebarCollapsed ? "justify-center px-0" : ""
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
          <Bot size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="text-sm font-bold tracking-tight whitespace-nowrap gradient-text">
                DocPilot
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap size={9} className="text-indigo-400" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">AI Platform</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"
                />
              )}
              <span className={cn("flex-shrink-0", isActive && "text-primary")}>
                {item.icon}
              </span>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 text-left whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Doc count badge on Documents item */}
              {!sidebarCollapsed && item.id === "documents" && docCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center"
                >
                  {docCount}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 pb-4">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-150 text-xs font-medium"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

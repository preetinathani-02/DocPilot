import React from "react";
import { useDocPilot, type NavPage } from "@/context/DocPilotContext";
import { Bell, Settings, User, Server } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useBackendStatus } from "@/hooks/useBackendStatus";

const PAGE_LABELS: Record<NavPage, string> = {
  landing: "Welcome",
  dashboard: "Dashboard",
  upload: "Upload Documents",
  chat: "Chat",
  documents: "Documents",
  settings: "Settings",
};

const PAGE_DESCRIPTIONS: Partial<Record<NavPage, string>> = {
  dashboard: "Overview of your AI document workspace",
  upload: "Ingest PDF, DOCX, and XLSX files into your knowledge base",
  chat: "Ask questions across your documents using RAG",
  documents: "Manage and explore your indexed documents",
  settings: "Configure your LLM provider and preferences",
};

export function Header() {
  const { activePage, setActivePage, settings } = useDocPilot();
  const backendStatus = useBackendStatus();

  const providerColors: Record<string, string> = {
    gemini: "bg-blue-500",
    openai: "bg-emerald-500",
    claude: "bg-orange-500",
    groq: "bg-purple-500",
    ollama: "bg-slate-500",
    openrouter: "bg-pink-500",
  };

  const dotColor = providerColors[settings.provider] ?? "bg-slate-500";
  const hasApiKey = !!settings.api_key;

  // const backendStatusConfig = {
  //   checking: { dot: "bg-slate-500 animate-pulse-slow", label: "Checking…", tip: "Connecting to backend" },
  //   online: { dot: "bg-emerald-500 animate-pulse-slow", label: "Backend online", tip: "FastAPI server is reachable" },
  //   offline: { dot: "bg-amber-500", label: "Backend offline", tip: "Start the FastAPI server: cd backend && uvicorn app.main:app --reload" },
  // }[backendStatus];

  return (
    <header className="h-14 flex-shrink-0 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-20">
      {/* Left: Page title */}
      <div className="flex flex-col">
        <h1 className="text-sm font-semibold text-foreground leading-tight">
          {PAGE_LABELS[activePage]}
        </h1>
        {PAGE_DESCRIPTIONS[activePage] && (
          <p className="text-[11px] text-muted-foreground leading-tight">
            {PAGE_DESCRIPTIONS[activePage]}
          </p>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Provider Status */}
        <button
          onClick={() => setActivePage("settings")}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${hasApiKey ? "animate-pulse-slow" : "opacity-40"}`} />
          <span className="capitalize font-medium">{settings.provider}</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="font-mono text-[10px]">{settings.model.split("-").slice(-2).join("-")}</span>
          {!hasApiKey && (
            <span className="text-amber-400 text-[10px]">No key</span>
          )}
        </button>

        {/* Backend Status pill */}
        {/* <div
          title={backendStatusConfig.tip}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 cursor-default select-none ${
            backendStatus === "online"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : backendStatus === "offline"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-secondary border-border text-muted-foreground"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${backendStatusConfig.dot}`} />
          <Server size={11} />
          <span>{backendStatusConfig.label}</span>
        </div> */}

        {/* Notification placeholder */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={16} />
        </Button>

        {/* Settings shortcut */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActivePage("settings")}
        >
          <Settings size={16} />
        </Button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200">
          <User size={14} className="text-white" />
        </div>
      </div>
    </header>
  );
}

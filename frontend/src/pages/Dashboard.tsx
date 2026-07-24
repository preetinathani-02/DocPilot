import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Layers,
  Cpu,
  TrendingUp,
  Clock,
  Upload,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDocPilot } from "@/context/DocPilotContext";
import { formatRelativeDate, getFileIcon } from "@/lib/utils";

const QUICK_PROMPTS = [
  { label: "Summarize all documents", icon: "📋" },
  { label: "List key action items", icon: "✅" },
  { label: "Compare findings across files", icon: "🔍" },
  { label: "Extract financial figures", icon: "📊" },
  { label: "Identify risks and issues", icon: "⚠️" },
  { label: "Create executive summary", icon: "📝" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function Dashboard() {
  const { documents, conversations, totalChunks, messageCount, settings, setActivePage, sendMessage } =
    useDocPilot();

  const readyDocs = documents.filter((d) => d.status === "ready");
  const recentDocs = [...documents].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  ).slice(0, 5);

  const stats = [
    {
      label: "Documents",
      value: readyDocs.length,
      icon: <FileText size={18} />,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      sub: `${documents.length - readyDocs.length} processing`,
    },
    {
      label: "Vector Chunks",
      value: totalChunks.toLocaleString(),
      icon: <Layers size={18} />,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      sub: "Indexed and ready",
    },
    {
      label: "Messages Sent",
      value: messageCount,
      icon: <MessageSquare size={18} />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      sub: `${conversations.length} conversations`,
    },
    {
      label: "LLM Provider",
      value: settings.provider.charAt(0).toUpperCase() + settings.provider.slice(1),
      icon: <Cpu size={18} />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sub: settings.api_key ? "Connected" : "No API key",
    },
  ];

  const handleQuickPrompt = (prompt: string) => {
    setActivePage("chat");
    setTimeout(() => sendMessage(prompt), 100);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-7 w-full"
    >
      {/* Welcome banner */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-2xl overflow-hidden border border-border"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
        <div className="relative flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Welcome to DocPilot AI 👋
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              {readyDocs.length === 0
                ? "Upload your first document to start chatting with your knowledge base."
                : `You have ${readyDocs.length} document${readyDocs.length > 1 ? "s" : ""} ready. Ask anything about your content.`}
            </p>
          </div>
          <div className="hidden sm:flex gap-3">
            {readyDocs.length === 0 ? (
              <Button variant="gradient" onClick={() => setActivePage("upload")}>
                <Upload size={15} />
                Upload First Document
              </Button>
            ) : (
              <Button variant="gradient" onClick={() => setActivePage("chat")}>
                <MessageSquare size={15} />
                Start Chatting
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className={`absolute top-3 right-3 w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent uploads */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              Recent Activity
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePage("documents")}
              className="text-xs"
            >
              View all <ChevronRight size={12} />
            </Button>
          </div>

          <Card padding="none" className="overflow-hidden">
            {recentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <FileText size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No documents yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setActivePage("upload")}
                >
                  Upload your first file
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors duration-150"
                  >
                    <span className="text-lg">{getFileIcon(doc.filename)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.filename}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatRelativeDate(doc.uploadedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        doc.status === "ready"
                          ? "success"
                          : doc.status === "error"
                          ? "destructive"
                          : "indigo"
                      }
                    >
                      {doc.status}
                    </Badge>
                    {doc.chunkCount > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {doc.chunkCount}ch
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick prompts */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Try These Prompts
            </h3>
          </div>

          <div className="space-y-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleQuickPrompt(prompt.label)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/60 transition-all duration-150 text-left group"
              >
                <span className="text-base">{prompt.icon}</span>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {prompt.label}
                </span>
                <ChevronRight
                  size={14}
                  className="ml-auto text-muted-foreground/40 group-hover:text-primary transition-colors"
                />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Provider health */}
      {!settings.api_key && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Cpu size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">Configure your LLM provider</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Add your API key in Settings to enable AI chat responses.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePage("settings")}
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 flex-shrink-0"
          >
            Configure <ChevronRight size={13} />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  Bot,
  Zap,
  FileText,
  MessageSquare,
  Brain,
  ArrowRight,
  Shield,
  Layers,
  GitBranch,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDocPilot } from "@/context/DocPilotContext";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  {
    icon: <Brain size={20} />,
    title: "RAG-Powered Intelligence",
    description:
      "Retrieval-Augmented Generation grounds every answer in your actual documents, eliminating hallucinations.",
    color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
    iconColor: "text-indigo-400",
  },
  {
    icon: <Layers size={20} />,
    title: "Semantic Vector Search",
    description:
      "Deep semantic understanding across all your PDFs, Word docs, and spreadsheets in milliseconds.",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    icon: <GitBranch size={20} />,
    title: "Agentic Workflows",
    description:
      "Specialized AI agents for retrieval, summarization, comparison, and insight extraction.",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    icon: <Shield size={20} />,
    title: "Source Citations",
    description:
      "Every response includes traceable citations with filename, chunk location, and relevance score.",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
];

const SUPPORTED_FORMATS = [
  { label: "PDF", icon: "📄", desc: "Research papers, contracts, reports" },
  { label: "DOCX", icon: "📝", desc: "Word documents, policies, specs" },
  { label: "XLSX", icon: "📊", desc: "Spreadsheets, financial data" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function LandingPage() {
  const { setActivePage } = useDocPilot();
  const { isAuthenticated } = useAuth();
  const goToApp = () => setActivePage(isAuthenticated ? "dashboard" : "register");

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Minimal header */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm gradient-text">DocPilot</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/30">AI</span>
        </div>
        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <button
              onClick={() => setActivePage("login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </button>
          )}
          <Button variant="gradient" size="sm" onClick={goToApp}>
            {isAuthenticated ? "Open App" : "Get Started"} <ArrowRight size={13} />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[80px]" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl mx-auto"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium">
              <Zap size={11} />
              AI-Powered Document Intelligence Platform
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Chat with your{" "}
            <span className="gradient-text">documents</span>
            <br />
            like never before
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl mx-auto"
          >
            DocPilot transforms your enterprise PDFs, Word files, and spreadsheets into an
            intelligent, searchable knowledge base powered by RAG and agentic AI workflows.
          </motion.p>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-4">
            <Button
              variant="gradient"
              size="lg"
              onClick={goToApp}
              className="shadow-glow"
            >
              <Upload size={16} />
              Upload Documents
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={goToApp}
            >
              <MessageSquare size={16} />
              Explore Dashboard
            </Button>
          </motion.div>
        </motion.div>

        {/* Chat preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="relative z-10 mt-16 w-full max-w-2xl mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            {/* Fake chat header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-secondary/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">DocPilot — AI Chat</span>
            </div>
            {/* Fake messages */}
            <div className="p-5 space-y-4">
              <div className="flex justify-end">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-xs">
                  What are the key findings in the Q3 report?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-border flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-primary" />
                </div>
                <div className="bg-secondary border border-border text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-sm text-foreground leading-relaxed">
                  Based on the <span className="text-primary font-medium">Q3_Report.pdf</span>, the key findings are: revenue grew{" "}
                  <span className="text-emerald-400 font-medium">+23% YoY</span>, customer retention improved to{" "}
                  <span className="text-emerald-400 font-medium">94.2%</span>, and 3 new enterprise clients were onboarded…
                </div>
              </div>
              {/* Citation */}
              <div className="ml-11 flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
                <FileText size={11} className="text-indigo-400 flex-shrink-0" />
                <span className="text-indigo-300 font-medium">Q3_Report.pdf</span>
                <span className="text-muted-foreground">· Chunk 14 · 92% relevance</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Supported formats */}
      <section className="px-8 py-16 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8 font-medium">
            Supported Document Formats
          </p>
          <div className="grid grid-cols-3 gap-4">
            {SUPPORTED_FORMATS.map((fmt) => (
              <div
                key={fmt.label}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-200 hover:bg-card/80"
              >
                <span className="text-3xl">{fmt.icon}</span>
                <span className="font-bold text-sm text-foreground">{fmt.label}</span>
                <span className="text-[11px] text-muted-foreground text-center">{fmt.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Enterprise-grade AI capabilities
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Built for organizations that need reliable, traceable, and accurate document intelligence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`p-6 rounded-2xl border bg-gradient-to-br ${feat.color}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-background/50 ${feat.iconColor}`}>
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 gradient-text">Ready to pilot your documents?</h2>
          <p className="text-muted-foreground mb-8">
            Start by uploading your documents and ask your first question in minutes.
          </p>
          <Button variant="gradient" size="lg" onClick={goToApp} className="shadow-glow">
            Get Started Free <ArrowRight size={16} />
          </Button>
        </div>
      </section>
    </div>
  );
}

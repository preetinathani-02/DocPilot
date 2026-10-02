import React from "react";
import { motion } from "framer-motion";
import { FileText, Hash, TrendingUp } from "lucide-react";
import { type ChatSource } from "@/lib/api";
import { truncate } from "@/lib/utils";

interface CitationCardProps {
  source: ChatSource;
  index: number;
}

function getScoreColor(score: number): string {
  if (score >= 0.85) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (score >= 0.65) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  return "text-slate-400 bg-slate-500/10 border-slate-500/30";
}

function getScoreLabel(score: number): string {
  if (score >= 0.85) return "High";
  if (score >= 0.65) return "Medium";
  return "Low";
}

export function CitationCard({ source, index }: CitationCardProps) {
  const scoreColor = getScoreColor(source.score);
  const ext = source.filename.split(".").pop()?.toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.06 }}
      className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 hover:bg-secondary/80 transition-all duration-200 group"
    >
      {/* Index */}
      <div className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <FileText size={12} className={ext === "pdf" ? "text-red-400" : ext === "docx" ? "text-blue-400" : "text-emerald-400"} />
          <span className="text-xs font-medium text-foreground truncate">
            {source.filename}
          </span>
        </div>

        {source.text && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            "{truncate(source.text, 120)}"
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Hash size={9} />
            <span>Chunk {source.chunk_id}</span>
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${scoreColor}`}>
            <TrendingUp size={9} />
            <span>{getScoreLabel(source.score)}</span>
            <span className="opacity-70">({(source.score * 100).toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

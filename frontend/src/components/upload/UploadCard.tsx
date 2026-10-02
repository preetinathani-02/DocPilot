import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { cn, formatBytes, getFileTypeLabel } from "@/lib/utils";
import { type Document, type UploadStatus } from "@/context/DocPilotContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface UploadCardProps {
  document: Document;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<
  UploadStatus,
  { label: string; color: "secondary" | "warning" | "indigo" | "success" | "destructive" }
> = {
  queued: { label: "Queued", color: "secondary" },
  uploading: { label: "Uploading", color: "indigo" },
  parsing: { label: "Parsing", color: "indigo" },
  indexing: { label: "Indexing", color: "warning" },
  ready: { label: "Ready", color: "success" },
  error: { label: "Error", color: "destructive" },
};

function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet size={18} className="text-emerald-400" />;
  return <FileText size={18} className={ext === "pdf" ? "text-red-400" : "text-blue-400"} />;
}

export function UploadCard({ document: doc, onDelete }: UploadCardProps) {
  const config = STATUS_CONFIG[doc.status];
  const isProcessing = ["uploading", "parsing", "indexing"].includes(doc.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <FileIcon filename={doc.filename} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={doc.filename}>
            {doc.filename}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs font-mono text-muted-foreground">{getFileTypeLabel(doc.filename)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={config.color}>{config.label}</Badge>
          {doc.status !== "uploading" && doc.status !== "parsing" && doc.status !== "indexing" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(isProcessing || doc.status === "ready") && (
        <div className="space-y-1">
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                doc.status === "ready"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${doc.uploadProgress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground capitalize">
              {doc.status === "uploading" ? `${doc.uploadProgress}% uploaded` : doc.status + "…"}
            </span>
            {doc.status === "ready" && doc.chunkCount > 0 && (
              <span className="text-[10px] text-emerald-400 font-medium">
                {doc.chunkCount} chunks indexed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status icon */}
      <div className="flex items-center gap-2">
        {isProcessing && (
          <Loader2 size={13} className="text-primary animate-spin" />
        )}
        {doc.status === "ready" && (
          <CheckCircle2 size={13} className="text-emerald-400" />
        )}
        {doc.status === "error" && (
          <XCircle size={13} className="text-destructive" />
        )}
        <span className="text-[11px] text-muted-foreground">
          {doc.status === "ready" && "Successfully indexed and ready for chat"}
          {doc.status === "error" && (doc.error ?? "Upload failed")}
          {doc.status === "uploading" && "Uploading to server…"}
          {doc.status === "parsing" && "Extracting document content…"}
          {doc.status === "indexing" && "Building vector embeddings…"}
          {doc.status === "queued" && "Waiting in queue…"}
        </span>
      </div>
    </motion.div>
  );
}

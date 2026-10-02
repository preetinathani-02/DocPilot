import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { UploadCard } from "@/components/upload/UploadCard";
import { useDocPilot } from "@/context/DocPilotContext";

export function UploadPage() {
  const { documents, uploadFiles, deleteDocument } = useDocPilot();

  const recentUploads = [...documents].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  const readyCount = documents.filter((d) => d.status === "ready").length;
  const processingCount = documents.filter((d) =>
    ["uploading", "parsing", "indexing", "queued"].includes(d.status)
  ).length;

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Document Ingestion
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload documents to build your AI knowledge base. Files are automatically parsed and indexed into the vector database.
        </p>
      </div>

      {/* Tips */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20 text-sm">
        <Info size={15} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          Supported formats: <span className="text-foreground font-medium">PDF</span>,{" "}
          <span className="text-foreground font-medium">DOCX</span>,{" "}
          <span className="text-foreground font-medium">XLSX</span>.
          You can upload multiple files at once. Each file will be chunked and embedded into the vector store for semantic search.
        </p>
      </div>

      {/* Drop zone */}
      <DropZone onFiles={uploadFiles} />

      {/* Stats row */}
      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          {readyCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={14} />
              <span>{readyCount} file{readyCount > 1 ? "s" : ""} ready</span>
            </div>
          )}
          {processingCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-indigo-400">
              <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              <span>Processing {processingCount} file{processingCount > 1 ? "s" : ""}…</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Upload cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {recentUploads.map((doc) => (
            <UploadCard
              key={doc.id}
              document={doc}
              onDelete={() => deleteDocument(doc.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Drop files above or click the upload area to start.
          </p>
        </div>
      )}
    </div>
  );
}

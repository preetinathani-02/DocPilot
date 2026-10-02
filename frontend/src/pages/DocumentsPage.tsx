import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  Filter,
  Upload,
  Calendar,
  Layers,
} from "lucide-react";
import { useDocPilot } from "@/context/DocPilotContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatBytes, formatDate, getFileTypeLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FilterType = "all" | "pdf" | "docx" | "xlsx";

function FileTypeIcon({ filename, size = 16 }: { filename: string; size?: number }) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls")
    return <FileSpreadsheet size={size} className="text-emerald-400" />;
  if (ext === "docx" || ext === "doc")
    return <FileText size={size} className="text-blue-400" />;
  return <FileText size={size} className="text-red-400" />;
}

export function DocumentsPage() {
  const { documents, deleteDocument, setActivePage, sendMessage } = useDocPilot();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...documents].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.filename.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") {
      result = result.filter((d) =>
        d.filename.toLowerCase().endsWith("." + typeFilter) ||
        (typeFilter === "docx" && d.filename.toLowerCase().endsWith(".doc")) ||
        (typeFilter === "xlsx" && d.filename.toLowerCase().endsWith(".xls"))
      );
    }
    return result;
  }, [documents, search, typeFilter]);

  const handleChatWith = (filename: string) => {
    setActivePage("chat");
    setTimeout(() => {
      sendMessage(`Tell me about the document: ${filename}`);
    }, 100);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteDocument(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All Files" },
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "DOCX" },
    { value: "xlsx", label: "XLSX" },
  ];

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground">
            {documents.filter((d) => d.status === "ready").length} indexed document
            {documents.length !== 1 ? "s" : ""} ready for AI chat
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setActivePage("upload")}>
          <Upload size={14} />
          Upload More
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 max-w-xs">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            icon={<Search size={14} />}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg border border-border p-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                typeFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-glow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
          <FileText size={36} className="text-muted-foreground/30 mb-3" />
          {documents.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">No documents in your knowledge base</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setActivePage("upload")}
              >
                <Upload size={13} />
                Upload your first file
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No documents match your search</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-secondary/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span></span>
            <span>Filename</span>
            <span className="text-right hidden sm:block">Size</span>
            <span className="text-center hidden md:flex items-center gap-1">
              <Calendar size={11} /> Uploaded
            </span>
            <span className="text-center hidden md:flex items-center gap-1">
              <Layers size={11} /> Chunks
            </span>
            <span className="text-center">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            <AnimatePresence>
              {filtered.map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-secondary/30 transition-colors duration-150 group"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <FileTypeIcon filename={doc.filename} size={15} />
                  </div>

                  {/* Filename */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
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
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        {getFileTypeLabel(doc.filename)}
                      </span>
                    </div>
                  </div>

                  {/* Size */}
                  <span className="text-xs text-muted-foreground text-right hidden sm:block">
                    {formatBytes(doc.size)}
                  </span>

                  {/* Upload date */}
                  <span className="text-xs text-muted-foreground text-center hidden md:block whitespace-nowrap">
                    {formatDate(doc.uploadedAt)}
                  </span>

                  {/* Chunk count */}
                  <span className="text-xs font-mono text-muted-foreground text-center hidden md:block">
                    {doc.chunkCount > 0 ? doc.chunkCount : "—"}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    {doc.status === "ready" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleChatWith(doc.filename)}
                        title="Chat with this document"
                      >
                        <MessageSquare size={13} className="text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7 opacity-0 group-hover:opacity-100 transition-all",
                        confirmDelete === doc.id
                          ? "opacity-100 text-destructive bg-destructive/10"
                          : "text-muted-foreground hover:text-destructive"
                      )}
                      onClick={() => handleDelete(doc.id)}
                      title={confirmDelete === doc.id ? "Click again to confirm" : "Delete"}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-border bg-secondary/20 text-[11px] text-muted-foreground">
            Showing {filtered.length} of {documents.length} document{documents.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

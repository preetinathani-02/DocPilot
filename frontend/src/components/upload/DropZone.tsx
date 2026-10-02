import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".xlsx", ".xls"];

function isValidFile(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
}

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const arr = Array.from(files);
      const valid = arr.filter(isValidFile);
      const invalid = arr.filter((f) => !isValidFile(f));

      if (invalid.length > 0) {
        setError(
          `${invalid.length} file(s) skipped — only PDF, DOCX, and XLSX are supported.`
        );
      }

      if (valid.length > 0) {
        onFiles(valid);
      }
    },
    [onFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      processFiles(e.dataTransfer.files);
    },
    [disabled, processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
      e.target.value = "";
    },
    [processFiles]
  );

  return (
    <div className="space-y-3">
      <label
        htmlFor="file-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center min-h-52 w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group",
          isDragging
            ? "border-primary bg-primary/8 scale-[1.01]"
            : "border-border bg-secondary/30 hover:border-primary/60 hover:bg-secondary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div
            className={cn(
              "absolute inset-0 bg-grid-pattern bg-grid transition-opacity duration-300",
              isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-60"
            )}
          />
        </div>

        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3 z-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-bounce">
                <Upload size={28} className="text-primary" />
              </div>
              <p className="text-primary font-semibold text-lg">Drop your files here!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 z-10 px-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                <Upload size={26} className="text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-base">
                  Drag & drop your documents here
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  or{" "}
                  <span className="text-primary font-medium underline underline-offset-2 cursor-pointer">
                    browse to upload
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {["PDF", "DOCX", "XLSX"].map((type) => (
                  <span
                    key={type}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary border border-border text-xs font-mono text-muted-foreground"
                  >
                    <FileText size={11} />
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/70">
                Multiple files supported • Files are automatically parsed and indexed
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          id="file-upload"
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls"
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </label>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm"
          >
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

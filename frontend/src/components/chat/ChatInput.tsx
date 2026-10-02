import React, { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Send, Paperclip, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const QUICK_PROMPTS = [
  "Summarize the main points",
  "What are the key findings?",
  "Compare the documents",
  "List action items",
];

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setShowQuickPrompts(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-grow
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, []);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setValue(prompt);
    setShowQuickPrompts(false);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      {/* Quick prompts */}
      {showQuickPrompts && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-card border border-border shadow-card grid grid-cols-2 gap-1.5 z-10 animate-slide-up">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleQuickPrompt(p)}
              className="text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150 border border-transparent hover:border-border"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className={cn(
        "flex items-end gap-2 p-2 rounded-2xl border transition-all duration-200",
        "bg-secondary/60 backdrop-blur-sm",
        disabled ? "border-border opacity-70" : "border-border focus-within:border-primary/60 focus-within:bg-secondary/80"
      )}>
        {/* Quick prompts trigger */}
        <button
          type="button"
          onClick={() => setShowQuickPrompts((v) => !v)}
          disabled={disabled}
          className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary transition-all duration-150"
          title="Quick prompts"
        >
          <Sparkles size={16} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? "Ask anything about your documents…"}
          rows={1}
          className={cn(
            "flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/60",
            "focus:outline-none py-2 min-h-[36px] max-h-[180px] leading-relaxed",
            "disabled:cursor-not-allowed"
          )}
        />

        {/* Send */}
        <Button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          size="icon"
          variant={value.trim() ? "gradient" : "ghost"}
          className="flex-shrink-0 h-9 w-9 rounded-xl"
        >
          <Send size={15} />
        </Button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/50 mt-1.5">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

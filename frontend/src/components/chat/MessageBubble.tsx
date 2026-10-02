import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Copy, Check } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import { type ChatMessage } from "@/context/DocPilotContext";
import { useState } from "react";

interface MessageBubbleProps {
  message: ChatMessage;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/70 animate-bounce-dot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex gap-3 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white",
        isUser
          ? "bg-gradient-to-br from-indigo-500 to-purple-600"
          : "bg-gradient-to-br from-slate-700 to-slate-800 border border-border"
      )}>
        {isUser ? <User size={14} /> : <Bot size={14} className="text-primary" />}
      </div>

      {/* Message content */}
      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        <div className={cn(
          "relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card",
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm"
            : "bg-card border border-border text-foreground rounded-tl-sm"
        )}>
          {message.isStreaming && !message.content ? (
            <TypingDots />
          ) : (
            <>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children }) {
                        const isInline = !className;
                        return isInline ? (
                          <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs text-primary">
                            {children}
                          </code>
                        ) : (
                          <code className={cn("font-mono text-xs", className)}>
                            {children}
                          </code>
                        );
                      },
                      pre({ children }) {
                        return (
                          <pre className="bg-secondary/80 border border-border rounded-lg p-3 overflow-x-auto text-xs font-mono my-2">
                            {children}
                          </pre>
                        );
                      },
                      a({ href, children }) {
                        return (
                          <a href={href} target="_blank" rel="noopener" className="text-primary underline underline-offset-2">
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
              )}
            </>
          )}

          {/* Copy button */}
          {!message.isStreaming && (
            <button
              onClick={handleCopy}
              className={cn(
                "absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                "h-6 w-6 rounded-md flex items-center justify-center",
                "bg-secondary border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/60 px-1">
          {formatRelativeDate(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

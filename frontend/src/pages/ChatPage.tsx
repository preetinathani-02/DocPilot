import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  Settings,
  FileText,
} from "lucide-react";
import { useDocPilot } from "@/context/DocPilotContext";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { CitationCard } from "@/components/chat/CitationCard";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/Button";
import { cn, formatRelativeDate, truncate } from "@/lib/utils";

function EmptyChat({ onStart }: { onStart: (p: string) => void }) {
  const prompts = [
    "What are the main topics across all documents?",
    "Summarize the key findings",
    "What action items are mentioned?",
    "Find the most important statistics",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 space-y-8">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <Bot size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">DocPilot AI</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Ask questions about your uploaded documents. I'll search through your knowledge base and provide accurate, cited answers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onStart(p)}
            className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/60 transition-all duration-150 text-sm text-muted-foreground hover:text-foreground group"
          >
            <span>{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatPage() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    sendMessage,
    isTyping,
    setActivePage,
    documents,
  } = useDocPilot();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConversationId);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo?.messages.length, isTyping]);

  const readyDocs = documents.filter((d) => d.status === "ready");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-3 border-b border-sidebar-border">
          <Button
            variant="gradient"
            size="sm"
            onClick={createConversation}
            className="w-full justify-center"
          >
            <Plus size={14} />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          <AnimatePresence>
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                <MessageSquare size={24} className="text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground/60">
                  No conversations yet
                </p>
              </div>
            )}
            {conversations.map((convo) => (
              <motion.button
                key={convo.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={() => setActiveConversationId(convo.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group",
                  activeConversationId === convo.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare size={12} className="flex-shrink-0 mt-0.5 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{convo.title || "New Chat"}</p>
                    <p className="text-[10px] opacity-50 mt-0.5">
                      {formatRelativeDate(convo.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Doc count */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setActivePage("documents")}
            className="w-full flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText size={12} />
            <span>{readyDocs.length} doc{readyDocs.length !== 1 ? "s" : ""} in knowledge base</span>
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              {activeConvo?.title ?? "DocPilot AI"}
            </span>
            {activeConvo && (
              <span className="text-xs text-muted-foreground">
                · {activeConvo.messages.length} messages
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {readyDocs.length === 0 && (
              <button
                onClick={() => setActivePage("upload")}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                ⚠ Upload documents first
              </button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setActivePage("settings")}>
              <Settings size={15} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {!activeConvo || activeConvo.messages.length === 0 ? (
            <EmptyChat onStart={(p) => sendMessage(p)} />
          ) : (
            <>
              {activeConvo.messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  <MessageBubble message={msg} />

                  {/* Citations below assistant messages */}
                  {msg.role === "assistant" &&
                    msg.sources &&
                    msg.sources.length > 0 &&
                    !msg.isStreaming && (
                      <div className="ml-11 space-y-2">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                          Sources
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sources.map((src, i) => (
                            <CitationCard key={`${msg.id}-src-${i}`} source={src} index={i} />
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-6 pb-5 pt-3 border-t border-border bg-background/50 backdrop-blur-sm">
          <ChatInput
            onSend={sendMessage}
            disabled={isTyping}
            placeholder={
              readyDocs.length === 0
                ? "Upload documents first to start chatting…"
                : "Ask anything about your documents…"
            }
          />
        </div>
      </div>
    </div>
  );
}

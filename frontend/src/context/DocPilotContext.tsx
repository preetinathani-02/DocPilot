import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { generateId, formatDate } from "@/lib/utils";
import {
  uploadDocument,
  sendChatMessage,
  loadSettings,
  saveSettings,
  type LLMSettings,
  type ChatSource,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavPage =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "upload"
  | "chat"
  | "documents"
  | "settings";

export type UploadStatus =
  | "queued"
  | "uploading"
  | "parsing"
  | "indexing"
  | "ready"
  | "error";

export interface Document {
  id: string;
  filename: string;
  size: number;
  type: string;
  status: UploadStatus;
  uploadProgress: number;
  uploadedAt: string;
  chunkCount: number;
  documentId?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

interface DocPilotContextType {
  // Navigation
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Documents
  documents: Document[];
  uploadFiles: (files: File[]) => Promise<void>;
  deleteDocument: (id: string) => void;
  totalChunks: number;

  // Chat
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  createConversation: () => string;
  sendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  messageCount: number;

  // Settings
  settings: LLMSettings;
  updateSettings: (s: Partial<LLMSettings>) => void;
  persistSettings: () => Promise<void>;
}

const DocPilotContext = createContext<DocPilotContextType | null>(null);

const DOCS_STORAGE_KEY = "docpilot_documents";
const CONVOS_STORAGE_KEY = "docpilot_conversations";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DocPilotProvider({ children }: { children: ReactNode }) {
  // Navigation
  const [activePage, setActivePage] = useState<NavPage>("landing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<Document[]>(() => {
    try {
      const raw = localStorage.getItem(DOCS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Chat
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const raw = localStorage.getItem(CONVOS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messageCountRef = useRef(0);

  // Settings
  const [settings, setSettings] = useState<LLMSettings>(loadSettings);

  // Persist documents
  useEffect(() => {
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem(CONVOS_STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // Derived
  const totalChunks = documents.reduce(
    (acc, d) => acc + (d.status === "ready" ? d.chunkCount : 0),
    0
  );
  const messageCount = conversations.reduce(
    (acc, c) => acc + c.messages.filter((m) => m.role === "user").length,
    0
  );

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

  // ─── Upload ───────────────────────────────────────────────────────────────
  const uploadFiles = useCallback(async (files: File[]) => {
    const newDocs: Document[] = files.map((f) => ({
      id: generateId(),
      filename: f.name,
      size: f.size,
      type: f.type,
      status: "queued",
      uploadProgress: 0,
      uploadedAt: new Date().toISOString(),
      chunkCount: 0,
    }));

    setDocuments((prev) => [...prev, ...newDocs]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = newDocs[i].id;

      const updateDoc = (patch: Partial<Document>) =>
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...patch } : d))
        );

      try {
        updateDoc({ status: "uploading", uploadProgress: 0 });

        const result = await uploadDocument(file, (pct) => {
          updateDoc({ uploadProgress: Math.min(pct, 80) });
        });

        updateDoc({ status: "parsing", uploadProgress: 85 });
        await sleep(400);

        updateDoc({ status: "indexing", uploadProgress: 95 });
        await sleep(400);

        updateDoc({
          status: "ready",
          uploadProgress: 100,
          chunkCount: result.chunks,
          documentId: result.document_id,
        });
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Upload failed";
        updateDoc({ status: "error", error: errMsg });
      }
    }
  }, []);

  // ─── Delete Document ──────────────────────────────────────────────────────
  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // ─── Conversations ────────────────────────────────────────────────────────
  const createConversation = useCallback((): string => {
    const id = generateId();
    const convo: Conversation = {
      id,
      title: `New Chat`,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => [convo, ...prev]);
    setActiveConversationId(id);
    return id;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      let convoId = activeConversationId;
      if (!convoId) {
        convoId = generateId();
        const newConvo: Conversation = {
          id: convoId,
          title: content.slice(0, 40),
          messages: [],
          createdAt: new Date().toISOString(),
        };
        setConversations((prev) => [newConvo, ...prev]);
        setActiveConversationId(convoId);
      }

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      // Update title from first message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convoId
            ? {
                ...c,
                messages: [...c.messages, userMsg],
                title:
                  c.messages.length === 0
                    ? content.slice(0, 40)
                    : c.title,
              }
            : c
        )
      );
      messageCountRef.current += 1;

      setIsTyping(true);

      // Streaming placeholder assistant message
      const assistantId = generateId();
      const placeholderMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convoId
            ? { ...c, messages: [...c.messages, placeholderMsg] }
            : c
        )
      );

      try {
        const resp = await sendChatMessage({
          query: content,
          provider: settings.provider,
          api_key: settings.api_key,
          model: settings.model,
        });

        // Simulate token streaming for UX
        const fullText = resp.answer;
        const chunkSize = 4;
        let displayed = "";

        for (let i = 0; i < fullText.length; i += chunkSize) {
          displayed += fullText.slice(i, i + chunkSize);
          const snap = displayed;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convoId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: snap }
                        : m
                    ),
                  }
                : c
            )
          );
          await sleep(20);
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convoId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: fullText,
                          sources: resp.sources,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } catch (err) {
        const errText =
          err instanceof Error
            ? `Error: ${err.message}`
            : "Something went wrong. Please check your API settings.";
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convoId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: errText, isStreaming: false }
                      : m
                  ),
                }
              : c
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [activeConversationId, settings]
  );

  // ─── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback((s: Partial<LLMSettings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  }, []);

  const persistSettings = useCallback(async () => {
    await saveSettings(settings);
  }, [settings]);

  return (
    <DocPilotContext.Provider
      value={{
        activePage,
        setActivePage,
        sidebarCollapsed,
        toggleSidebar,
        documents,
        uploadFiles,
        deleteDocument,
        totalChunks,
        conversations,
        activeConversationId,
        setActiveConversationId,
        createConversation,
        sendMessage,
        isTyping,
        messageCount,
        settings,
        updateSettings,
        persistSettings,
      }}
    >
      {children}
    </DocPilotContext.Provider>
  );
}

export function useDocPilot() {
  const ctx = useContext(DocPilotContext);
  if (!ctx) throw new Error("useDocPilot must be used within DocPilotProvider");
  return ctx;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

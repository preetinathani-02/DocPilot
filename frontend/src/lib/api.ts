import axios from "axios";
import { getAccessToken, setAccessToken } from "./tokenStore";
import { refreshSession } from "./auth";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
  // Needed so refresh (triggered from this client too) can see the cookie.
  withCredentials: true,
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Attach the current access token to every request.
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// On a 401, attempt a single silent refresh (via the httpOnly cookie) and
// retry the original request once. Concurrent 401s share one in-flight
// refresh so we don't hammer the refresh endpoint.
let refreshPromise: Promise<string | null> | null = null;

async function silentRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((res) => res?.access_token ?? null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;
    const isNetworkError = !error.response && error.code !== "ECONNABORTED";
    const isProxyError = status === 502 || status === 503 || status === 504;

    if (isNetworkError || isProxyError) {
      const friendly = new Error(
        "DocPilot backend is not reachable. Please start the FastAPI server:\n" +
        "`cd backend && uvicorn app.main:app --reload`\n\n" +
        "Once the backend is running, try your question again."
      );
      (friendly as any).isBackendOffline = true;
      console.warn("[DocPilot] Backend offline or proxy error:", status ?? "network error");
      return Promise.reject(friendly);
    }

    if (status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      const newToken = await silentRefresh();
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      setAccessToken(null);
    }

    const detail = error?.response?.data?.detail || error?.response?.data || error.message;
    console.error("[DocPilot API Error]", detail);
    return Promise.reject(new Error(typeof detail === "string" ? detail : JSON.stringify(detail)));
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────
export interface UploadResponse {
  document_id: string;
  filename: string;
  chunks: number;
  status: string;
}

export interface ChatSource {
  text: string;
  filename: string;
  chunk_id: number;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ChatRequest {
  query: string;
  provider: string;
  api_key: string;
  model: string;
}

export interface SearchResult {
  text: string;
  filename: string;
  chunk_id: number;
  score: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const uploadDocument = async (
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResponse>("/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total) {
        const pct = Math.round((event.loaded * 100) / event.total);
        onUploadProgress?.(pct);
      }
    },
  });
  return data;
};

export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>("/chat/", request);
  return data;
};

export const searchDocuments = async (query: string): Promise<SearchResult[]> => {
  const { data } = await api.post<{ matches: SearchResult[] }>("/search/", { query });
  return data.matches;
};

// ─── Settings (localStorage-backed placeholder) ───────────────────────────────
export interface LLMSettings {
  provider: string;
  api_key: string;
  model: string;
  temperature: number;
}

const SETTINGS_KEY = "docpilot_settings";

export const saveSettings = async (settings: LLMSettings): Promise<void> => {
  // Persist locally; replace with /api/v1/settings when backend endpoint is added
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return Promise.resolve();
};

export const loadSettings = (): LLMSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as LLMSettings;
  } catch (_) {}
  return {
    provider: "gemini",
    api_key: "",
    model: "gemini-2.0-flash",
    temperature: 0.7,
  };
};

export default api;

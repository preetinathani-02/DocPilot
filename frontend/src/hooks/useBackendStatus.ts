import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export type BackendStatus = "checking" | "online" | "offline";

/**
 * Polls the FastAPI health endpoint every `intervalMs` ms to determine
 * if the backend is reachable. Falls back to the /api/v1/upload/ OPTIONS
 * if no /health endpoint is available.
 */
export function useBackendStatus(intervalMs = 15000): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("checking");

  const check = useCallback(async () => {
    try {
      // HEAD request to the upload endpoint — lightweight, goes through the Vite proxy
      await api.request({ method: "OPTIONS", url: "/upload/", timeout: 4000 });
      setStatus("online");
    } catch (err: any) {
      if (err?.isBackendOffline || !err?.response) {
        setStatus("offline");
      } else {
        // Got any HTTP response → server IS reachable (405 OPTIONS not allowed, etc.)
        setStatus("online");
      }
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [check, intervalMs]);

  return status;
}

/** Returns true if the error was caused by the backend being offline */
export function isBackendOffline(err: unknown): boolean {
  return (err as any)?.isBackendOffline === true;
}

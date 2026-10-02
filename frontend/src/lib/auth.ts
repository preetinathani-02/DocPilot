import axios from "axios";
import { getAccessToken, setAccessToken } from "./tokenStore";

const authApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1/auth`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  // Required so the browser sends/receives the httpOnly refresh-token cookie.
  withCredentials: true,
});

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider: "local" | "google";
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

function extractErrorMessage(error: any): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return error?.message || "Something went wrong. Please try again.";
}

export async function registerUser(params: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<TokenResponse> {
  try {
    const { data } = await authApi.post<TokenResponse>("/register", params);
    setAccessToken(data.access_token);
    return data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  try {
    const { data } = await authApi.post<TokenResponse>("/login", params);
    setAccessToken(data.access_token);
    return data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  try {
    const { data } = await authApi.post<TokenResponse>("/google", { id_token: idToken });
    setAccessToken(data.access_token);
    return data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function refreshSession(): Promise<AccessTokenResponse | null> {
  try {
    const { data } = await authApi.post<AccessTokenResponse>("/refresh");
    setAccessToken(data.access_token);
    return data;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const { data } = await authApi.get<AuthUser>("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await authApi.post("/logout");
  } finally {
    setAccessToken(null);
  }
}

export { authApi };

import React, { useState } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import { useDocPilot } from "@/context/DocPilotContext";

export function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const { setActivePage } = useDocPilot();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      setActivePage("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    try {
      await loginGoogle(idToken);
      setActivePage("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to DocPilot"
      footer={
        <span>
          Don't have an account?{" "}
          <button
            onClick={() => setActivePage("register")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </button>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          icon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          isPassword
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton
        onCredential={handleGoogleCredential}
        onError={(msg) => setError(msg)}
        text="signin_with"
      />
    </AuthLayout>
  );
}

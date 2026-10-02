import React, { useMemo, useState } from "react";
import { Mail, Lock, User, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import { useDocPilot } from "@/context/DocPilotContext";

const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
];

export function RegisterPage() {
  const { register, loginGoogle } = useAuth();
  const { setActivePage } = useDocPilot();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password]
  );
  const isPasswordValid = passwordChecks.every((c) => c.passed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Please meet all password requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, fullName || undefined);
      setActivePage("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
      title="Create your account"
      subtitle="Start building your AI-powered document workspace"
      footer={
        <span>
          Already have an account?{" "}
          <button
            onClick={() => setActivePage("login")}
            className="text-primary font-medium hover:underline"
          >
            Sign in
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
          label="Full name"
          type="text"
          placeholder="Jane Doe"
          icon={<User size={16} />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />

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

        <div>
          <Input
            label="Password"
            isPassword
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {password.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 gap-1">
              {passwordChecks.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-[11px] ${
                    rule.passed ? "text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {rule.passed ? <Check size={12} /> : <X size={12} />}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
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
        text="signup_with"
      />

      <p className="text-[11px] text-muted-foreground text-center mt-5">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthLayout>
  );
}

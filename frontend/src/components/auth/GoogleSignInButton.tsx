import React, { useEffect, useRef } from "react";

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Renders Google's official "Sign in with Google" button via Google
 * Identity Services (GIS). GIS returns a signed ID token client-side,
 * which we send to POST /api/v1/auth/google for server-side verification
 * (see auth_service.get_or_create_google_user) — the server never trusts
 * the client's claims, only Google's signature.
 */
export function GoogleSignInButton({ onCredential, onError, text = "continue_with" }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            onCredentialRef.current(response.credential);
          } else {
            onErrorRef.current?.("Google sign-in was cancelled or failed.");
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text,
        shape: "pill",
        width: 320,
      });
    };

    if (window.google) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId) {
    return (
      <p className="text-xs text-muted-foreground text-center">
        Google sign-in isn't configured (missing VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}

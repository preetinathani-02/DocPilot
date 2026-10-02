import React from "react";
import { AnimatePresence, motion, type Variants, type Transition } from "framer-motion";
import { DocPilotProvider, useDocPilot } from "@/context/DocPilotContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { Dashboard } from "@/pages/Dashboard";
import { UploadPage } from "@/pages/UploadPage";
import { ChatPage } from "@/pages/ChatPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { Bot } from "lucide-react";

const pageTransition: Transition = { duration: 0.25, ease: "easeOut" as const };
const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: pageTransition },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

const PROTECTED_PAGES = new Set(["dashboard", "upload", "chat", "documents", "settings"]);
const AUTH_PAGES = new Set(["login", "register"]);

function SplashScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow animate-pulse-slow">
        <Bot size={22} className="text-white" />
      </div>
    </div>
  );
}

function AppRoutes() {
  const { activePage, setActivePage } = useDocPilot();
  const { isAuthenticated, isInitializing } = useAuth();

  // Route guards run as a single, unconditional effect (Rules of Hooks) that
  // redirects rather than branching on which hooks get called.
  React.useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated && PROTECTED_PAGES.has(activePage)) {
      setActivePage("login");
    } else if (isAuthenticated && AUTH_PAGES.has(activePage)) {
      setActivePage("dashboard");
    }
  }, [isAuthenticated, isInitializing, activePage, setActivePage]);

  // Wait for the silent-refresh check before deciding what to render, so an
  // already-logged-in user isn't flashed the landing/login page on reload.
  if (isInitializing) {
    return <SplashScreen />;
  }

  if (!isAuthenticated && PROTECTED_PAGES.has(activePage)) {
    return <LoginPage />;
  }

  if (isAuthenticated && AUTH_PAGES.has(activePage)) {
    return <SplashScreen />;
  }

  if (activePage === "landing") {
    return <LandingPage />;
  }

  if (activePage === "login") {
    return <LoginPage />;
  }

  if (activePage === "register") {
    return <RegisterPage />;
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full"
        >
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "upload" && <UploadPage />}
          {activePage === "chat" && <ChatPage />}
          {activePage === "documents" && <DocumentsPage />}
          {activePage === "settings" && <SettingsPage />}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <DocPilotProvider>
        <AppRoutes />
      </DocPilotProvider>
    </AuthProvider>
  );
}

export default App;

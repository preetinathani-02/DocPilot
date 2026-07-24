import React from "react";
import { AnimatePresence, motion, type Variants, type Transition } from "framer-motion";
import { DocPilotProvider, useDocPilot } from "@/context/DocPilotContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingPage } from "@/pages/LandingPage";
import { Dashboard } from "@/pages/Dashboard";
import { UploadPage } from "@/pages/UploadPage";
import { ChatPage } from "@/pages/ChatPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { SettingsPage } from "@/pages/SettingsPage";

const pageTransition: Transition = { duration: 0.25, ease: "easeOut" as const };
const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: pageTransition },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

function AppRoutes() {
  const { activePage } = useDocPilot();

  if (activePage === "landing") {
    return <LandingPage />;
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
    <DocPilotProvider>
      <AppRoutes />
    </DocPilotProvider>
  );
}

export default App;

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = "fv_pwa_install_dismissed";

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker silently
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }

    // 2. Check if already running in standalone mode or dismissed in this session
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    const wasDismissed =
      sessionStorage.getItem(DISMISS_STORAGE_KEY) === "true";

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      if (!wasDismissed) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, "true");
    } catch {}
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 flex items-center bg-[#0B3B70] hover:bg-[#082B54] text-white rounded-full pl-4 pr-2.5 py-2 shadow-lg border border-white/15 text-xs font-semibold gap-2 transition-all">
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 cursor-pointer focus:outline-none"
      >
        <span>📲 Instalar App</span>
      </button>
      <span className="h-3.5 w-px bg-white/20" />
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar aviso de instalación"
        title="Ocultar"
        className="p-0.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

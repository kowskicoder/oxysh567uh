"use client"

import React, { useEffect, useState } from "react";

const STORAGE_KEY = "a2hs_shown_v1";

function isIos() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && !window.matchMedia('(display-mode: standalone)').matches;
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return /Mobi|Android/i.test(window.navigator.userAgent);
}

export default function AddToHomePrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const alreadyShown = localStorage.getItem(STORAGE_KEY);
      if (alreadyShown) return;

      if (!isMobile()) return;

      // iOS handling: show instructions for Safari users
      if (isIos()) {
        setShowIosInstructions(true);
        setShow(true);
        return;
      }

      const onBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      };

      window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);

      // Fallback: if no beforeinstallprompt fired within a short time, still offer instructions once
      const fallbackTimer = window.setTimeout(() => {
        // show a minimal hint only if not already shown; don't force install UI
        if (!deferredPrompt) {
          setShow(true);
        }
      }, 2000);

      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
        window.clearTimeout(fallbackTimer);
      };
    } catch (err) {
      // ignore
    }
  }, []);

  const dismiss = (remember = true) => {
    setShow(false);
    setShowIosInstructions(false);
    if (remember) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // no install prompt available — just dismiss and set flag
      dismiss(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      // remember regardless of choice so we don't nag
      dismiss(true);
    } catch (err) {
      dismiss(true);
    }
  };

  if (!show) return null;

  return (
    <>
      {showIosInstructions ? (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add to Home Screen</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">To install this app on your iPhone/iPad: tap the Share button and choose "Add to Home Screen".</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">This message will only appear once.</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button onClick={() => dismiss(true)} className="text-sm text-slate-600 dark:text-slate-300">Close</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-8 md:bottom-8 flex justify-center pointer-events-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-lg p-3 flex items-center space-x-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Install Bantah</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Add this app to your home screen for quick access.</div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={handleInstallClick} className="px-3 py-2 rounded-md bg-[#7440ff] text-white text-sm">Add</button>
              <button onClick={() => dismiss(true)} className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

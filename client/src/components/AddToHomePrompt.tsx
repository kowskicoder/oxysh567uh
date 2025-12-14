"use client"

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const alreadyShown = localStorage.getItem(STORAGE_KEY);
      if (alreadyShown) return;

      if (!isMobile()) return;

      if (isIos()) {
        setShowIosInstructions(true);
        setOpen(true);
        return;
      }

      const onBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setOpen(true);
      };

      window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);

      const fallbackTimer = window.setTimeout(() => {
        if (!deferredPrompt) {
          setOpen(true);
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
    setOpen(false);
    setShowIosInstructions(false);
    if (remember) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      dismiss(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      dismiss(true);
    } catch (err) {
      dismiss(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); setOpen(v); }}>
      <DialogContent className="sm:max-w-sm max-w-xs p-0">
        <DialogHeader>
          <DialogTitle>{showIosInstructions ? 'Add to Home Screen' : 'Install Bantah'}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {showIosInstructions ? (
            <DialogDescription>
              To install this app on your iPhone/iPad: tap the Share button in Safari and choose "Add to Home Screen". This message will only appear once.
            </DialogDescription>
          ) : (
            <DialogDescription>
              Add this app to your home screen for quick access. Installing provides a native-like experience.
            </DialogDescription>
          )}
        </div>
        <DialogFooter className="p-4">
          {showIosInstructions ? (
            <div className="w-full flex justify-end">
              <Button variant="ghost" onClick={() => dismiss(true)}>Close</Button>
            </div>
          ) : (
            <div className="w-full flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => dismiss(true)}>Dismiss</Button>
              <Button onClick={handleInstallClick}>Add</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

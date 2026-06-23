"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

let overlayCounter = 0;

/**
 * Hook that integrates an overlay (drawer/modal) with the browser history
 * so that the mobile back-swipe gesture closes the overlay instead of
 * navigating the page behind it.
 */
function useBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => { onCloseRef.current = onClose; });

  const closedByPopRef = React.useRef(false);
  const idRef = React.useRef("");

  React.useEffect(() => {
    if (!open) return;

    const id = `overlay-${++overlayCounter}`;
    idRef.current = id;
    closedByPopRef.current = false;

    history.pushState({ overlayId: id }, "");

    const onPop = () => {
      closedByPopRef.current = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);

      // If closed programmatically (not by back gesture), remove our history entry.
      // Use setTimeout to avoid racing with Link navigations that push state.
      if (!closedByPopRef.current) {
        setTimeout(() => {
          if (history.state?.overlayId === id) {
            history.back();
          }
        }, 0);
      }
    };
  }, [open]); // deliberately omit onClose — stored in ref
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive drawer: slides up as a sheet on mobile, in from the right on desktop.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  useBackClose(open, onClose);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-stretch sm:justify-end">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={cn(
              "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0d0d0f]/95 backdrop-blur-2xl shadow-2xl",
              "sm:max-h-full sm:w-[440px] sm:rounded-l-3xl sm:rounded-tr-none sm:border-l",
              "sm:[--tw-enter-translate-x:100%]",
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="min-w-0">
                {title && (
                  <h2 className="font-serif text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto p-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  useBackClose(open, onClose);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={cn(
              "relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0f]/95 backdrop-blur-2xl shadow-2xl",
              className
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              {title && (
                <h2 className="font-serif text-lg font-semibold">{title}</h2>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

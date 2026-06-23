"use client";

import * as React from "react";
import { Loader2, ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw } from "lucide-react";
import { Drawer } from "./ui/drawer";

interface PdfViewerProps {
  url: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Renders a PDF as page images inside a Drawer using pdf.js.
 * Supports pinch-to-zoom, button zoom, and fullscreen on mobile.
 */
export function PdfViewer({ url, open, onClose }: PdfViewerProps) {
  const [pages, setPages] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Track pinch gesture
  const pinchRef = React.useRef({ startDist: 0, startScale: 1 });

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported — fall back to CSS fullscreen
      setIsFullscreen((f) => !f);
    }
  };

  // Listen for fullscreen exit via Escape or browser controls
  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Pinch-to-zoom handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        startDist: Math.hypot(dx, dy),
        startScale: scale,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const { startDist, startScale } = pinchRef.current;
      if (startDist > 0) {
        const newScale = Math.min(4, Math.max(0.5, startScale * (dist / startDist)));
        setScale(Math.round(newScale * 100) / 100);
      }
    }
  };

  React.useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setPages([]);
      setScale(1);

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const resp = await fetch(url);
        if (!resp.ok) throw new Error("Failed to fetch PDF");
        const buffer = await resp.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        const rendered: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const s = 2;
          const viewport = page.getViewport({ scale: s });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          rendered.push(canvas.toDataURL("image/png"));
        }

        if (!cancelled) setPages(rendered);
      } catch {
        if (!cancelled) setError("Couldn't load this PDF. Try opening it externally.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  return (
    <Drawer open={open} onClose={isFullscreen ? () => {} : onClose} title="Ticket PDF">
      <div
        ref={containerRef}
        className={
          isFullscreen && !document.fullscreenElement
            ? "fixed inset-0 z-[200] flex flex-col bg-[#0d0d0f]"
            : "flex flex-col"
        }
      >
        {/* Toolbar */}
        {pages.length > 0 && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-[#0d0d0f]/90 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                aria-label="Zoom out"
              >
                <ZoomOut className="size-4" />
              </button>
              <span className="min-w-[3rem] text-center text-xs font-medium text-muted-foreground">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                aria-label="Zoom in"
              >
                <ZoomIn className="size-4" />
              </button>
              <button
                onClick={resetZoom}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                aria-label="Reset zoom"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-gold-400" />
            <p className="text-sm text-muted-foreground">Rendering PDF…</p>
          </div>
        )}
        {error && (
          <p className="py-8 text-center text-sm text-red-400">{error}</p>
        )}
        {pages.length > 0 && (
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
          >
            <div
              className="space-y-3 p-2"
              style={{
                width: `${scale * 100}%`,
              }}
            >
              {pages.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Page ${i + 1}`}
                  className="w-full rounded-lg border border-white/10"
                />
              ))}
            </div>
          </div>
        )}

        {/* Fullscreen close button */}
        {isFullscreen && (
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              setIsFullscreen(false);
              onClose();
            }}
            className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </Drawer>
  );
}

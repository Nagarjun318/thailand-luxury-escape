"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Loader2, ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw, X } from "lucide-react";
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
  const [isIOS, setIsIOS] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Detect iOS on mount
  React.useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  }, []);

  // Track pinch gesture
  const pinchRef = React.useRef({ startDist: 0, startScale: 1 });

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

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
    if (isIOS) return; // iOS uses native embed, no canvas rendering needed
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setPages([]);
      setScale(1);

      try {
        const pdfjsLib = await import("pdfjs-dist");

        // Disable worker for iOS Safari where module workers often fail.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        } else {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }

        const resp = await fetch(url);
        if (!resp.ok) throw new Error("Failed to fetch PDF");
        const buffer = await resp.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          useWorkerFetch: false,
          useSystemFonts: true,
        } as any);
        const pdf = await loadingTask.promise;
        const rendered: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          // Use lower scale on iOS to avoid canvas size limits
          const s = isIOS ? 1.5 : 2;
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
  }, [open, url, isIOS]);

  const toolbar = (
    <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0d0d0f]/90 px-3 py-2 backdrop-blur-sm">
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
  );

  const pdfContent = isIOS && url ? (
    <div className="flex-1 overflow-auto">
      <iframe
        src={url}
        title="Ticket PDF"
        className="border-0"
        style={{
          width: `${scale * 100}%`,
          height: "100%",
          minHeight: isFullscreen ? "calc(100vh - 50px)" : "70vh",
        }}
      />
    </div>
  ) : (
    <>
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
            style={{ width: `${scale * 100}%` }}
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
    </>
  );

  const fullscreenPortal =
    isFullscreen && open
      ? createPortal(
          <div className="fixed inset-0 z-[300] flex flex-col bg-[#0d0d0f]">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0d0d0f] px-3 py-2">
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
                onClick={() => setIsFullscreen(false)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                aria-label="Exit fullscreen"
              >
                <X className="size-4" />
              </button>
            </div>
            {isIOS && url ? (
              <div className="flex-1 overflow-auto">
                <iframe
                  src={url}
                  title="Ticket PDF"
                  className="border-0"
                  style={{
                    width: `${scale * 100}%`,
                    height: "100%",
                    minHeight: "calc(100vh - 50px)",
                  }}
                />
              </div>
            ) : (
              <div
                className="flex-1 overflow-auto"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
              >
                <div className="space-y-3 p-2" style={{ width: `${scale * 100}%` }}>
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
          </div>,
          document.body
        )
      : null;

  const showContent = isIOS ? !!url : pages.length > 0 || loading || !!error;

  return (
    <>
      <Drawer open={open && !isFullscreen} onClose={onClose} title="Ticket PDF">
        <div ref={containerRef} className="flex flex-col">
          {showContent && toolbar}
          {pdfContent}
        </div>
      </Drawer>
      {fullscreenPortal}
    </>
  );
}

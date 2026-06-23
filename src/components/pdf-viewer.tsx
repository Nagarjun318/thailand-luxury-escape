"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Drawer } from "./ui/drawer";

interface PdfViewerProps {
  url: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Renders a PDF as page images inside a Drawer using pdf.js.
 * Works on mobile without triggering a download.
 */
export function PdfViewer({ url, open, onClose }: PdfViewerProps) {
  const [pages, setPages] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setPages([]);

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
          const scale = 2; // retina-quality
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
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
    <Drawer open={open} onClose={onClose} title="Ticket PDF">
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
        <div className="space-y-3">
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
      )}
    </Drawer>
  );
}

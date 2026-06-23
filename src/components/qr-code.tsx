"use client";

import { qrMatrix, cn } from "@/lib/utils";

interface QRCodeProps {
  data: string;
  size?: number;
  className?: string;
}

/**
 * Renders a stylised QR-style code as crisp SVG modules with gold finder
 * patterns. Deterministic per `data` string.
 */
export function QRCode({ data, size = 220, className }: QRCodeProps) {
  const modules = 25;
  const matrix = qrMatrix(data, modules);
  const cell = 100 / modules;

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-3 shadow-glow-sm ring-1 ring-gold/30",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        role="img"
        aria-label={`QR code for ${data}`}
      >
        <rect width="100" height="100" fill="#ffffff" />
        {matrix.map((row, y) =>
          row.map((on, x) => {
            if (!on) return null;
            const isFinder =
              (x < 7 && y < 7) ||
              (x >= modules - 7 && y < 7) ||
              (x < 7 && y >= modules - 7);
            return (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill={isFinder ? "#0a0a0a" : "#171717"}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

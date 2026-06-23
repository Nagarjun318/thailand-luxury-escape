"use client";

export type CodeFormat =
  | "QR"
  | "PDF417"
  | "Aztec"
  | "DataMatrix"
  | "Barcode";

export interface ExtractedQr {
  /** Cropped code image as a PNG data URL, ready to render or upload. */
  qrImageDataUrl: string;
  /** Decoded payload text, if it could be read. */
  text: string | null;
  /** 1-based page the code was found on. */
  page: number;
  /** Which symbology was detected. */
  format: CodeFormat;
}

interface Pt {
  x: number;
  y: number;
}

/**
 * Renders each page of a PDF and scans it for 2D/1D codes, returning EVERY
 * distinct code found (e.g. several QRs for a multi-person ticket), each
 * cropped to its own image. Tries jsQR first (fast, QR-only) then ZXing
 * (QR, PDF417, Aztec, DataMatrix, 1D barcodes) at increasing resolutions, and
 * scans overlapping tiles so multiple/small codes on one page are all caught.
 *
 * Runs entirely in the browser — no PDF data leaves the device for detection.
 * The heavy modules are imported lazily so they never load during SSR.
 */
export async function extractQrFromPdf(
  file: File | Blob,
  { maxPages = 12 } = {}
): Promise<ExtractedQr[]> {
  const [{ default: jsQR }, pdfjsLib, zxing] = await Promise.all([
    import("jsqr"),
    import("pdfjs-dist"),
    import("@zxing/library"),
  ]);
  // Serve the worker locally (copied into /public) so extraction works offline.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, maxPages);

  const results: ExtractedQr[] = [];
  const seen = new Set<string>();

  try {
    for (let p = 1; p <= pageCount; p++) {
      let page;
      try {
        page = await pdf.getPage(p);
      } catch {
        continue; // Skip a page that won't load rather than failing the lot.
      }
      // Escalate resolution; small codes in a corner need more pixels.
      for (const scale of [3, 5]) {
        // Clamp so the canvas never exceeds browser limits (Safari ~16M px /
        // 4096 per side). Rendering too large throws and would lose all codes
        // already found on earlier pages.
        const base = page.getViewport({ scale: 1 });
        const longest = Math.max(base.width, base.height);
        const safeScale = Math.min(scale, MAX_CANVAS_SIDE / longest);
        const viewport = page.getViewport({ scale: safeScale });

        let hits: RegionHit[] = [];
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) continue;
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;

          // Collect every code on the page (whole page + overlapping tiles).
          hits = collectHits(jsQR, zxing, ctx, canvas.width, canvas.height);
          if (!hits.length) continue;

          for (const hit of hits) {
            // Dedup globally by payload, or by position when payload is empty.
            const key = hit.text
              ? `t:${hit.text}`
              : `p${p}:${hit.format}:${centerKey(hit.points)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            results.push({
              qrImageDataUrl: cropPoints(canvas, hit.points, hit.square),
              text: hit.text,
              page: p,
              format: hit.format,
            });
          }
        } catch {
          // A render/decode failure on one page/scale shouldn't discard the
          // codes already collected — move on.
          continue;
        }
        // Found codes at this scale — no need to re-render larger.
        if (hits.length) break;
      }
    }
    return results;
  } finally {
    void loadingTask.destroy();
  }
}

/** Cap on canvas width/height (px) to stay within browser limits. */
const MAX_CANVAS_SIDE = 4000;


interface RegionHit {
  points: Pt[];
  text: string | null;
  format: CodeFormat;
  square: boolean;
}

type JsQRFn = typeof import("jsqr").default;

/** Rough centroid bucket used to dedup the same physical code across tiles. */
function centerKey(points: Pt[]): string {
  if (!points.length) return "0:0";
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return `${Math.round(cx / 40)}:${Math.round(cy / 40)}`;
}

/**
 * Scans the whole page plus a grid of overlapping tiles and returns all
 * distinct codes. Tiling lets several small codes on one page be read, since
 * ZXing only decodes one symbol per region.
 */
function collectHits(
  jsQR: JsQRFn,
  zxing: typeof import("@zxing/library"),
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): RegionHit[] {
  const hits: RegionHit[] = [];
  const local = new Set<string>();
  const add = (h: RegionHit | null) => {
    if (!h) return;
    const key = h.text ? `t:${h.text}` : `c:${centerKey(h.points)}`;
    if (local.has(key)) return;
    local.add(key);
    hits.push(h);
  };

  // Whole page first (fast for large/centred codes).
  add(scanRegion(jsQR, zxing, ctx, 0, 0, width, height));

  // Overlapping tiles — isolates small/multiple codes the full scan misses.
  const cols = 3;
  const rows = 4;
  const overlap = 0.35;
  const tw = width / cols;
  const th = height / rows;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const x = Math.max(0, Math.floor(tx * tw - tw * overlap));
      const y = Math.max(0, Math.floor(ty * th - th * overlap));
      const w = Math.min(width - x, Math.ceil(tw * (1 + 2 * overlap)));
      const h = Math.min(height - y, Math.ceil(th * (1 + 2 * overlap)));
      add(scanRegion(jsQR, zxing, ctx, x, y, w, h));
    }
  }
  return hits;
}

/** Scans a single rectangular region of the canvas; points are page-relative. */
function scanRegion(
  jsQR: JsQRFn,
  zxing: typeof import("@zxing/library"),
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): RegionHit | null {
  if (rw < 8 || rh < 8) return null;
  const img = ctx.getImageData(rx, ry, rw, rh);

  // jsQR — fast path for QR codes.
  const qr = jsQR(img.data, rw, rh, { inversionAttempts: "attemptBoth" });
  if (qr) {
    const c = qr.location;
    const pts = [
      c.topLeftCorner,
      c.topRightCorner,
      c.bottomLeftCorner,
      c.bottomRightCorner,
    ].map((p) => ({ x: p.x + rx, y: p.y + ry }));
    return { points: pts, text: qr.data || null, format: "QR", square: true };
  }

  // ZXing — QR, PDF417, Aztec, DataMatrix, and 1D barcodes.
  const zx = decodeZxing(zxing, img);
  if (zx) {
    return {
      points: zx.points.map((p) => ({ x: p.x + rx, y: p.y + ry })),
      text: zx.text || null,
      format: zx.format,
      square: zx.square,
    };
  }
  return null;
}


/** Attempts a multi-format decode of a rendered page with ZXing. */
function decodeZxing(
  zxing: typeof import("@zxing/library"),
  img: ImageData
): { text: string; points: Pt[]; format: CodeFormat; square: boolean } | null {
  const {
    MultiFormatReader,
    BarcodeFormat,
    DecodeHintType,
    RGBLuminanceSource,
    BinaryBitmap,
    HybridBinarizer,
  } = zxing;

  const { data, width, height } = img;
  const lum = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; j < lum.length; i += 4, j++) {
    // Green-favouring luminance.
    lum[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  }

  const source = new RGBLuminanceSource(lum, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  const hints = new Map<import("@zxing/library").DecodeHintType, unknown>();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    // 2D
    BarcodeFormat.QR_CODE,
    BarcodeFormat.PDF_417,
    BarcodeFormat.AZTEC,
    BarcodeFormat.DATA_MATRIX,
    // 1D / linear
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ]);
  reader.setHints(hints);

  try {
    const res = reader.decode(bitmap);
    const fmt = res.getBarcodeFormat();
    const points: Pt[] = (res.getResultPoints() || [])
      .filter(Boolean)
      .map((pt) => ({ x: pt.getX(), y: pt.getY() }));
    const square =
      fmt === BarcodeFormat.QR_CODE ||
      fmt === BarcodeFormat.AZTEC ||
      fmt === BarcodeFormat.DATA_MATRIX;
    const format: CodeFormat =
      fmt === BarcodeFormat.QR_CODE
        ? "QR"
        : fmt === BarcodeFormat.PDF_417
          ? "PDF417"
          : fmt === BarcodeFormat.AZTEC
            ? "Aztec"
            : fmt === BarcodeFormat.DATA_MATRIX
              ? "DataMatrix"
              : "Barcode";
    return { text: res.getText(), points, format, square };
  } catch {
    return null;
  } finally {
    reader.reset();
  }
}

/**
 * Crops the bounding box of the detected corner points (with padding) into a
 * PNG data URL. QR/Aztec/DataMatrix are squared up; PDF417 keeps its aspect.
 * When points are missing, falls back to a centred region of the page.
 */
function cropPoints(
  source: HTMLCanvasElement,
  points: Pt[],
  square: boolean
): string {
  let minX: number;
  let minY: number;
  let maxX: number;
  let maxY: number;

  if (points.length >= 2) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    minX = Math.min(...xs);
    minY = Math.min(...ys);
    maxX = Math.max(...xs);
    maxY = Math.max(...ys);
  } else {
    // No usable geometry — grab the middle third of the page.
    minX = source.width * 0.2;
    maxX = source.width * 0.8;
    minY = source.height * 0.2;
    maxY = source.height * 0.8;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  // 1D barcodes report points along a single line (spanY ≈ 0); give them a
  // sensible bar height so the cropped image shows the whole code.
  const padX = Math.max(spanX, spanY) * 0.12;
  const padY = square
    ? padX
    : Math.max(spanY * 0.5, spanX * 0.18);
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(source.width, maxX + padX);
  maxY = Math.min(source.height, maxY + padY);

  const w = Math.ceil(maxX - minX);
  const h = Math.ceil(maxY - minY);
  const outW = square ? Math.max(w, h) : w;
  const outH = square ? Math.max(w, h) : h;

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d")!;
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, outW, outH);
  octx.drawImage(source, minX, minY, w, h, (outW - w) / 2, (outH - h) / 2, w, h);
  return out.toDataURL("image/png");
}


/** Converts a data URL into a File for uploading to storage. */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] || "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

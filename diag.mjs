// Diagnostic: extract embedded images from a PDF and try to decode any
// barcode/QR in them at native resolution (no browser canvas needed).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const pdfPath = path.join(os.homedir(), "Downloads", "Coral island.pdf");

// ZXing logs every failed reader attempt via console.error — silence it.
console.error = () => {};
console.warn = () => {};

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
pdfjs.GlobalWorkerOptions.workerSrc =
  "pdfjs-dist/legacy/build/pdf.worker.mjs";

const jsQR = (await import("jsqr")).default;
const zxingNs = await import("@zxing/library");
const zxing = zxingNs.default ?? zxingNs;
const {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} = zxing;

function toLuminance(data, width, height, kind) {
  const lum = new Uint8ClampedArray(width * height);
  if (kind === 3 || data.length === width * height * 4) {
    for (let i = 0, j = 0; j < lum.length; i += 4, j++)
      lum[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  } else if (kind === 2 || data.length === width * height * 3) {
    for (let i = 0, j = 0; j < lum.length; i += 3, j++)
      lum[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  } else {
    for (let j = 0; j < lum.length; j++) lum[j] = data[j];
  }
  return lum;
}

function toRGBA(data, width, height, kind) {
  const out = new Uint8ClampedArray(width * height * 4);
  if (kind === 3 || data.length === width * height * 4) return data;
  if (kind === 2 || data.length === width * height * 3) {
    for (let i = 0, j = 0; j < width * height; i += 3, j++) {
      out[j * 4] = data[i];
      out[j * 4 + 1] = data[i + 1];
      out[j * 4 + 2] = data[i + 2];
      out[j * 4 + 3] = 255;
    }
  } else {
    for (let j = 0; j < width * height; j++) {
      out[j * 4] = out[j * 4 + 1] = out[j * 4 + 2] = data[j];
      out[j * 4 + 3] = 255;
    }
  }
  return out;
}

function decodeZxing(lum, width, height) {
  const source = new RGBLuminanceSource(lum, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.PDF_417,
    BarcodeFormat.AZTEC,
    BarcodeFormat.DATA_MATRIX,
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
    return { format: BarcodeFormat[res.getBarcodeFormat()], text: res.getText() };
  } catch {
    return null;
  } finally {
    reader.reset();
  }
}

const data = new Uint8Array(fs.readFileSync(pdfPath));
const pdf = await pdfjs.getDocument({ data, disableFontFace: true }).promise;
console.log("pages:", pdf.numPages);

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p);
  const ops = await page.getOperatorList();
  const names = new Set();
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (
      fn === pdfjs.OPS.paintImageXObject ||
      fn === pdfjs.OPS.paintImageXObjectRepeat
    ) {
      names.add(ops.argsArray[i][0]);
    }
  }
  console.log(`page ${p}: ${names.size} image XObjects`);
  for (const name of names) {
    const img = await new Promise((res) => {
      try {
        page.objs.get(name, res);
      } catch {
        res(null);
      }
    });
    if (!img || !img.width) {
      console.log(`  ${name}: (unresolved)`);
      continue;
    }
    const { width, height, kind } = img;
    const lum = toLuminance(img.data, width, height, kind);
    let result = decodeZxing(lum, width, height);
    if (!result) {
      const rgba = toRGBA(img.data, width, height, kind);
      const qr = jsQR(rgba, width, height, { inversionAttempts: "attemptBoth" });
      if (qr) result = { format: "QR_CODE(jsQR)", text: qr.data };
    }
    console.log(
      `  ${name}: ${width}x${height} kind=${kind} -> ${
        result ? `${result.format} :: ${result.text}` : "no code"
      }`
    );
  }
}

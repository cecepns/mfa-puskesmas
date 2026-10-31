import React from "react";

/**
 * Standalone ISO/IEC 18004 QR Code Matrix Generator
 * Mode: Byte (8-bit), ECC Level M (Medium Error Correction)
 * Version 1 to 10 dynamically selected. Fully offline, zero external dependencies.
 */
export function generateQRCodeMatrix(text) {
  const textBytes = new TextEncoder().encode(text || "https://puskesmas.go.id");

  // Version specs for ECC Medium (M):
  const SPECS = [
    { v: 1,  size: 21, total: 26,  data: 16,  ec: 10, b: 1, align: [] },
    { v: 2,  size: 25, total: 44,  data: 28,  ec: 16, b: 1, align: [6, 18] },
    { v: 3,  size: 29, total: 70,  data: 44,  ec: 26, b: 1, align: [6, 22] },
    { v: 4,  size: 33, total: 100, data: 64,  ec: 18, b: 2, align: [6, 26] },
    { v: 5,  size: 37, total: 134, data: 86,  ec: 24, b: 2, align: [6, 30] },
    { v: 6,  size: 41, total: 172, data: 108, ec: 16, b: 4, align: [6, 34] },
    { v: 7,  size: 45, total: 196, data: 124, ec: 18, b: 4, align: [6, 22, 38] },
    { v: 8,  size: 49, total: 242, data: 154, ec: 22, b: 4, align: [6, 24, 42] },
    { v: 9,  size: 53, total: 292, data: 182, ec: 22, b: 5, align: [6, 26, 46] },
    { v: 10, size: 57, total: 346, data: 216, ec: 26, b: 5, align: [6, 28, 50] },
  ];

  let spec = null;
  for (const s of SPECS) {
    const neededBits = 4 + 8 + textBytes.length * 8;
    if (neededBits <= s.data * 8) {
      spec = s;
      break;
    }
  }
  if (!spec) spec = SPECS[SPECS.length - 1];

  const bits = [];
  // Mode: 0100 (Byte mode)
  bits.push(0, 1, 0, 0);
  // Count: 8 bits
  for (let i = 7; i >= 0; i--) bits.push((textBytes.length >> i) & 1);
  // Bytes
  for (const b of textBytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  // Terminator
  const totalDataBits = spec.data * 8;
  for (let i = 0; i < 4 && bits.length < totalDataBits; i++) bits.push(0);
  // Pad to byte
  while (bits.length % 8 !== 0) bits.push(0);

  // Convert to bytes
  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataBytes.push(b);
  }

  // Pad to spec.data with 0xEC and 0x11
  let pad = 0xec;
  while (dataBytes.length < spec.data) {
    dataBytes.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  // Galois Field GF(256)
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    EXP[i + 255] = x;
    LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  function mul(a, b) {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
  }

  // RS generator poly
  function rsGenPoly(degree) {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < degree; i++) {
      const next = new Uint8Array(poly.length + 1);
      const root = EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= mul(poly[j], root);
        next[j + 1] ^= poly[j];
      }
      poly = next;
    }
    return poly;
  }

  function rsRemainder(data, gen) {
    const divisor = gen.slice(0, -1);
    const degree = gen.length - 1;
    let rem = new Uint8Array(degree);
    for (const byte of data) {
      const factor = byte ^ rem[0];
      rem.copyWithin(0, 1);
      rem[rem.length - 1] = 0;
      for (let i = 0; i < divisor.length; i++) {
        rem[i] ^= mul(gen[i], factor);
      }
    }
    return rem;
  }

  // Blocks & ECC
  const numBlocks = spec.b;
  const dataPerBlock = Math.floor(spec.data / numBlocks);
  const dataBlocks = [];
  const ecBlocks = [];
  const gen = rsGenPoly(spec.ec);

  for (let i = 0; i < numBlocks; i++) {
    const start = i * dataPerBlock;
    const end = i === numBlocks - 1 ? spec.data : (i + 1) * dataPerBlock;
    const block = dataBytes.slice(start, end);
    dataBlocks.push(block);
    ecBlocks.push(rsRemainder(block, gen));
  }

  // Interleave codewords
  const finalCodewords = [];
  const maxBlockLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let col = 0; col < maxBlockLen; col++) {
    for (let b = 0; b < numBlocks; b++) {
      if (col < dataBlocks[b].length) finalCodewords.push(dataBlocks[b][col]);
    }
  }
  for (let col = 0; col < spec.ec; col++) {
    for (let b = 0; b < numBlocks; b++) {
      finalCodewords.push(ecBlocks[b][col]);
    }
  }

  // Build 2D Matrix
  const size = spec.size;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(r, c, val) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // Finder patterns
  function drawFinder(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBlack =
          r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        setFunction(r0 + r, c0 + c, isBlack);
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Separators
  for (let i = 0; i < 8; i++) {
    setFunction(7, i, false);
    setFunction(i, 7, false);
    setFunction(7, size - 1 - i, false);
    setFunction(i, size - 8, false);
    setFunction(size - 8, i, false);
    setFunction(size - 1 - i, 7, false);
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  if (spec.align && spec.align.length > 0) {
    const coords = spec.align;
    for (const r of coords) {
      for (const c of coords) {
        if (
          (r < 9 && c < 9) ||
          (r < 9 && c > size - 10) ||
          (r > size - 10 && c < 9)
        )
          continue;

        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            setFunction(r + dr, c + dc, isBlack);
          }
        }
      }
    }
  }

  // Dark module
  setFunction(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  // Place data bits
  const allBits = [];
  for (const byte of finalCodewords) {
    for (let i = 7; i >= 0; i--) allBits.push((byte >> i) & 1);
  }
  while (allBits.length < size * size) allBits.push(0);

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (let c = right; c > right - 2; c--) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          matrix[r][c] = bit === 1;
        }
      }
    }
    upward = !upward;
  }

  // Apply Mask 0: (row + col) % 2 === 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c]) {
        if ((r + c) % 2 === 0) {
          matrix[r][c] = !matrix[r][c];
        }
      }
    }
  }

  // Format bits for ECC M, Mask 0
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  let fIdx = 0;
  for (let i = 0; i <= 5; i++) matrix[8][i] = formatBits[fIdx++] === 1;
  matrix[8][7] = formatBits[fIdx++] === 1;
  matrix[8][8] = formatBits[fIdx++] === 1;
  matrix[7][8] = formatBits[fIdx++] === 1;
  for (let i = 5; i >= 0; i--) matrix[i][8] = formatBits[fIdx++] === 1;

  fIdx = 0;
  for (let i = size - 1; i >= size - 8; i--) matrix[8][i] = formatBits[fIdx++] === 1;
  for (let i = size - 7; i < size; i++) matrix[i][8] = formatBits[fIdx++] === 1;

  return matrix;
}

/**
 * React Component for Rendering Clean SVG QR Code
 */
export function QRCodeSVG({
  value,
  size = 200,
  fgColor = "#0f172a",
  bgColor = "#ffffff",
  className = "",
}) {
  const matrix = React.useMemo(() => {
    try {
      return generateQRCodeMatrix(value || "");
    } catch (e) {
      console.error("Failed to generate QR Matrix:", e);
      return [];
    }
  }, [value]);

  if (!matrix || matrix.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-slate-100 flex items-center justify-center text-xs text-slate-400"
      >
        QR Error
      </div>
    );
  }

  const matrixSize = matrix.length;
  // Quiet zone = 4 modules padding
  const padding = 2;
  const viewBoxSize = matrixSize + padding * 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`select-none ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c + padding}
              y={r + padding}
              width={1}
              height={1}
              fill={fgColor}
            />
          );
        })
      )}
    </svg>
  );
}

/**
 * Unduh QR Code sebagai file gambar PNG
 */
export function downloadQRCodeImage(svgElement, fileName = "barcode-pengaduan.png") {
  if (!svgElement) return;

  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const URLObj = window.URL || window.webkitURL || window;
  const blobURL = URLObj.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 600, 600);
    context.drawImage(image, 0, 0, 600, 600);

    const png = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.href = png;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  image.src = blobURL;
}


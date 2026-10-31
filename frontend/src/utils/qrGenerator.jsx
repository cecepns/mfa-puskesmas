import React from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

export { QRCodeSVG, QRCodeCanvas };

/**
 * Unduh QR Code sebagai file gambar PNG beresolusi tinggi (600x600)
 */
export function downloadQRCodeImage(element, fileName = "barcode-pengaduan.png") {
  if (!element) return;

  // Jika element adalah canvas (QRCodeCanvas)
  if (element instanceof HTMLCanvasElement) {
    const png = element.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = fileName;
    link.href = png;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Jika element membungkus canvas
  const innerCanvas = element.querySelector("canvas");
  if (innerCanvas) {
    const png = innerCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = fileName;
    link.href = png;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Jika element adalah SVG (QRCodeSVG)
  const svg = element.tagName === "svg" ? element : element.querySelector("svg");
  if (svg) {
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(image, 0, 0, 600, 600);

      const png = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = fileName;
      link.href = png;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URLObj.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  }
}

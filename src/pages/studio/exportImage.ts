/**
 * Export eines Outfits als PNG: Figur + Farbpalette mit Namen und HEX-Codes.
 * Alles passiert lokal im Browser (SVG → Canvas → PNG).
 */
import type { HexColor } from '@/domain/types';
import { readableTextColor } from '@/domain/color';

export async function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '480');
  clone.setAttribute('height', '1040');
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG konnte nicht gerendert werden.'));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function exportOutfitPng(
  svgs: SVGSVGElement[],
  title: string,
  palette: { hex: HexColor; name: string; share: number }[],
): Promise<Blob> {
  const images = await Promise.all(svgs.map(svgToImage));
  const scale = 2;
  const figW = 300;
  const figH = 650;
  const pad = 32;
  const width = pad * 2 + images.length * figW + (images.length - 1) * 24;
  const rowH = 44;
  const height = pad + 40 + figH + 24 + palette.length * rowH + pad;
  const c = document.createElement('canvas');
  c.width = width * scale;
  c.height = height * scale;
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#F6F6F4';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#1B1B1D';
  ctx.font = '600 22px Georgia, serif';
  ctx.fillText(title, pad, pad + 20);
  images.forEach((img, i) => ctx.drawImage(img, pad + i * (figW + 24), pad + 40, figW, figH));
  let y = pad + 40 + figH + 24;
  ctx.font = '14px system-ui, sans-serif';
  for (const p of palette) {
    ctx.fillStyle = p.hex;
    ctx.fillRect(pad, y, 60, rowH - 10);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.strokeRect(pad + 0.5, y + 0.5, 59, rowH - 11);
    ctx.fillStyle = readableTextColor(p.hex);
    ctx.fillText(`${Math.round(p.share * 100)}%`, pad + 8, y + 22);
    ctx.fillStyle = '#1B1B1D';
    ctx.fillText(`${p.name}  ·  ${p.hex}`, pad + 76, y + 22);
    y += rowH;
  }
  ctx.fillStyle = '#64635F';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('ChromaWardrobe · schematische Farbvisualisierung', pad, height - 12);
  return await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Export fehlgeschlagen'))), 'image/png'));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadJson(data: unknown, filename: string) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}

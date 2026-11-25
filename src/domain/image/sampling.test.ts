import { describe, expect, it } from 'vitest';
import { applyWhiteBalance, dominantColors, sampleRegion, type PixelSource } from './sampling';
import { deltaE2000, hexToRgb } from '../color';

function image(w: number, h: number, fn: (x: number, y: number) => [number, number, number]): PixelSource {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * w + x) * 4;
      data.set([r, g, b, 255], i);
    }
  return { data, width: w, height: h };
}

describe('Farbmessung aus Bildern', () => {
  it('misst einen Bereich statt eines Pixels und ignoriert Glanzlichter', () => {
    const { r, g, b } = hexToRgb('#35483C');
    // Dunkelgrüner Stoff mit einzelnen weißen Spiegelungen und schwarzen Schattenpixeln
    const img = image(40, 40, (x, y) => ((x * 7 + y * 3) % 11 === 0 ? [255, 255, 255] : (x * 5 + y) % 13 === 0 ? [0, 0, 0] : [r, g, b]));
    const res = sampleRegion(img, 20, 20, 10)!;
    expect(res.sampleSize).toBeGreaterThan(200);
    expect(deltaE2000(res.hex, '#35483C')).toBeLessThan(3);
  });

  it('warnt bei Überbelichtung', () => {
    const img = image(20, 20, () => [255, 255, 255]);
    expect(sampleRegion(img, 10, 10, 6)!.warnings.join(' ')).toMatch(/überbelichtet/);
  });

  it('gibt null außerhalb des Bildes zurück', () => {
    expect(sampleRegion(image(10, 10, () => [1, 2, 3]), -50, -50, 3)).toBeNull();
  });

  it('korrigiert einen Farbstich per Graukarte', () => {
    // Warmes Licht: Grau erscheint orange-stichig, Stoff ebenso
    const tintedGrey = '#C8B49A';
    const tintedFabric = '#8A6E5A';
    const corrected = applyWhiteBalance(tintedFabric, tintedGrey);
    const raw = hexToRgb(tintedFabric);
    const c = hexToRgb(corrected);
    // Nach der Korrektur ist der Rot-Blau-Abstand kleiner
    expect(Math.abs(c.r - c.b)).toBeLessThan(Math.abs(raw.r - raw.b));
    // Eine bereits neutrale Referenz verändert nichts
    expect(applyWhiteBalance('#556677', '#808080')).toBe('#556677');
  });

  it('findet dominante Farben eines zweifarbigen Stoffes', () => {
    const img = image(30, 30, (x) => (x < 20 ? [137, 103, 79] : [53, 72, 58]));
    const dom = dominantColors(img, 3);
    expect(dom.length).toBeGreaterThanOrEqual(2);
    expect(deltaE2000(dom[0].hex, '#89674F')).toBeLessThan(3);
    expect(dom[0].share).toBeGreaterThan(0.5);
    expect(dom.some((d) => deltaE2000(d.hex, '#35483A') < 3)).toBe(true);
  });
});

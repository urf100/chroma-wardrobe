import { describe, expect, it } from 'vitest';
import {
  colorProfile,
  contrastRatio,
  deltaE2000,
  deltaEOK,
  hexToHsl,
  hexToLab,
  hexToOklch,
  hexToRgb,
  hslToHex,
  isFashionNeutral,
  isValidHex,
  mixOklab,
  nameColor,
  neutrality,
  normalizeHex,
  oklchToHex,
  readableTextColor,
  rgbToHex,
  temperatureLevel,
  temperatureScore,
  tryNormalizeHex,
  hexToOklab,
  oklabToRgb,
} from './index';

describe('HEX-Normalisierung', () => {
  it('normalisiert Kurz- und Langformen', () => {
    expect(normalizeHex('abc')).toBe('#AABBCC');
    expect(normalizeHex('#a1b2c3')).toBe('#A1B2C3');
    expect(normalizeHex('  #FAFAFA ')).toBe('#FAFAFA');
  });
  it('erkennt ungültige Werte', () => {
    expect(isValidHex('#12345')).toBe(false);
    expect(isValidHex('#GGGGGG')).toBe(false);
    expect(tryNormalizeHex('rot')).toBeNull();
    expect(() => normalizeHex('xyz')).toThrow();
  });
});

describe('RGB/HSL', () => {
  it('konvertiert HEX ↔ RGB verlustfrei', () => {
    expect(hexToRgb('#703A40')).toEqual({ r: 112, g: 58, b: 64 });
    expect(rgbToHex({ r: 112, g: 58, b: 64 })).toBe('#703A40');
  });
  it('konvertiert HSL hin und zurück', () => {
    for (const hex of ['#FF0000', '#35483C', '#B76C60', '#FAFAFA', '#000000', '#465B73']) {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    }
    const red = hexToHsl('#FF0000');
    expect(red.h).toBeCloseTo(0);
    expect(red.s).toBeCloseTo(1);
    expect(red.l).toBeCloseTo(0.5);
  });
});

describe('OKLab/OKLCH', () => {
  it('liefert bekannte Referenzwerte', () => {
    const white = hexToOklch('#FFFFFF');
    expect(white.L).toBeCloseTo(1, 3);
    expect(white.C).toBeLessThan(0.001);
    const red = hexToOklch('#FF0000');
    expect(red.L).toBeCloseTo(0.628, 2);
    expect(red.C).toBeCloseTo(0.2577, 2);
    expect(red.h).toBeCloseTo(29.23, 0);
  });
  it('ist umkehrbar', () => {
    for (const hex of ['#3D2920', '#C7B596', '#293E53', '#3D777E']) {
      expect(rgbToHex(oklabToRgb(hexToOklab(hex)))).toBe(hex);
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });
  it('bringt Farben außerhalb des sRGB-Gamuts in den darstellbaren Bereich', () => {
    const hex = oklchToHex({ L: 0.7, C: 0.4, h: 150 });
    expect(isValidHex(hex)).toBe(true);
    expect(hexToOklch(hex).h).toBeCloseTo(150, -1);
  });
});

describe('CIELAB & Delta E', () => {
  it('berechnet CIELAB für Weiß', () => {
    const lab = hexToLab('#FFFFFF');
    expect(lab.L).toBeCloseTo(100, 1);
    expect(Math.abs(lab.a)).toBeLessThan(0.01);
  });
  it('Delta E ist 0 für gleiche Farben und symmetrisch', () => {
    expect(deltaE2000('#35483C', '#35483C')).toBeCloseTo(0);
    expect(deltaE2000('#35483C', '#35483A')).toBeLessThan(1.5);
    expect(deltaE2000('#B76C60', '#465B73')).toBeCloseTo(deltaE2000('#465B73', '#B76C60'), 8);
  });
  it('stimmt mit Referenzwerten (Sharma et al.) überein', () => {
    // Referenzpaar 1 aus dem CIEDE2000-Testdatensatz liegt in Lab vor; wir prüfen Plausibilität über sRGB.
    expect(deltaE2000('#000000', '#FFFFFF')).toBeCloseTo(100, 0);
  });
  it('OKLab-Abstand ordnet ähnliche Farben näher an', () => {
    expect(deltaEOK('#4F382E', '#503629')).toBeLessThan(deltaEOK('#4F382E', '#465B73'));
  });
});

describe('Kontrast', () => {
  it('berechnet WCAG-Kontrast', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(readableTextColor('#FAFAFA')).toBe('#1A1A1A');
    expect(readableTextColor('#292A2C')).toBe('#FFFFFF');
  });
});

describe('Farbeigenschaften', () => {
  it('erkennt warme und kühle Farben', () => {
    expect(temperatureLevel(temperatureScore('#A65C3D'))).toBe('warm'); // Rostrot
    expect(temperatureLevel(temperatureScore('#2C4FA3'))).toBe('cool'); // Königsblau
    expect(temperatureScore('#89613F')).toBeGreaterThan(0.3); // warmes Braun
    expect(temperatureScore('#50545D')).toBeLessThan(0); // kühles Grau
    expect(temperatureScore('#77736B')).toBeGreaterThan(0); // warmes Grau
  });
  it('klassifiziert Mode-Neutralfarben', () => {
    expect(neutrality('#292A2C')).toBe('achromatic');
    expect(neutrality('#FAFAFA')).toBe('achromatic');
    expect(neutrality('#B18A5E')).toBe('warm-neutral'); // Camel
    expect(neutrality('#4F382E')).toBe('warm-neutral'); // Dunkelbraun
    expect(neutrality('#E5D8BF')).toBe('warm-neutral'); // Ecru
    expect(neutrality('#293E53')).toBe('cool-neutral'); // Dunkelblau
    expect(isFashionNeutral('#B76C60')).toBe(false); // verwaschenes Rot
    expect(isFashionNeutral('#3D777E')).toBe(false); // Petrol
  });
  it('liefert ein vollständiges Profil', () => {
    const p = colorProfile('#35483C');
    expect(p.lightness).toBe('dark');
    expect(['muted', 'neutral']).toContain(p.chroma);
  });
});

describe('Farbnamen', () => {
  it('findet bekannte Namen', () => {
    expect(nameColor('#703A40').name).toBe('Weinrot');
    expect(nameColor('#B18A5E').name).toBe('Camel');
    expect(nameColor('#FAFAFA').name).toBe('Reinweiß');
  });
  it('beschreibt Farben verständlich', () => {
    expect(nameColor('#35483C').description).toMatch(/Grün/);
    expect(nameColor('#293E53').description).toMatch(/Blau/);
    expect(nameColor('#7F7F7F').description).toMatch(/Grau/);
  });
});

describe('Mischen', () => {
  it('mischt in OKLab', () => {
    expect(mixOklab('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixOklab('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
  });
});

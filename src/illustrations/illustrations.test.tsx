import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { GarmentIllustration, OutfitFigure } from './Figure';
import { BASE_CATEGORIES, defaultAttributes } from '@/domain/garments/catalog';
import { garmentColor } from '@/domain/profile/factory';

const colors = [garmentColor('#89674F')];
const markup = (sub: string, extra: Record<string, string> = {}) =>
  render(<GarmentIllustration subcategory={sub} colors={colors} pattern={{ type: 'solid' }} attributes={{ ...defaultAttributes(sub), ...extra }} />)
    .container.innerHTML.replace(/(shade|pat)-[^"')]+/g, 'ID');

describe('Kleidungsillustrationen', () => {
  it('zeichnet jede Unterkategorie ohne Fehler', () => {
    for (const c of BASE_CATEGORIES) for (const s of c.subcategories) expect(markup(s.id)).toMatch(/<(path|rect|circle)/);
  });

  it('unterscheidet Jackentypen optisch (z. B. Bomber ≠ Parka ≠ Lederjacke ≠ Wollmantel)', () => {
    const outer = BASE_CATEGORIES.find((c) => c.id === 'outerwear')!.subcategories;
    const seen = new Map<string, string>();
    for (const s of outer) {
      const m = markup(s.id);
      expect(seen.has(m), `${s.id} sieht aus wie ${seen.get(m)}`).toBe(false);
      seen.set(m, s.id);
    }
  });

  it('reagiert auf Attribute wie Kapuze und Länge', () => {
    expect(markup('parka', { hood: 'yes' })).not.toBe(markup('parka', { hood: 'no' }));
    expect(markup('parka', { length: 'long' })).not.toBe(markup('parka', { length: 'short' }));
  });

  it('stellt Jacken offen und geschlossen unterschiedlich dar und blendet Schichten aus', () => {
    const slots = {
      base: { subcategory: 'tshirt', colors: [garmentColor('#FAFAFA')], pattern: { type: 'solid' as const } },
      outer: { subcategory: 'bomber', colors: [garmentColor('#656749')], pattern: { type: 'solid' as const } },
    };
    const opts = { jacketOpen: true, showSkin: false, showHair: false, showBeard: false };
    const open = render(<OutfitFigure slots={slots} options={opts} />).container.innerHTML;
    const closed = render(<OutfitFigure slots={slots} options={{ ...opts, jacketOpen: false }} />).container.innerHTML;
    expect(open).not.toBe(closed);
    const hidden = render(<OutfitFigure slots={{ ...slots, outer: { ...slots.outer, hidden: true } }} options={opts} />).container;
    expect(hidden.querySelector('[data-silhouette="bomber"]')).toBeNull();
    expect(hidden.querySelector('[data-silhouette="tee"]')).not.toBeNull();
  });

  it('rendert Muster für mehrfarbige Kleidung', () => {
    const html = render(
      <GarmentIllustration subcategory="scarf" colors={[garmentColor('#B29A7D', 0.6), garmentColor('#E8DAC3', 0.4, 'secondary')]} pattern={{ type: 'check' }} />,
    ).container.innerHTML;
    expect(html).toContain('<pattern');
    expect(html.toUpperCase()).toContain('#E8DAC3');
  });
});

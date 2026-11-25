import { expect, test, type Page } from '@playwright/test';

/** Jeder Test startet mit frischer IndexedDB (neuer Browser-Kontext). */
async function open(page: Page, route = '/') {
  await page.goto(`/#${route}`);
  await expect(page.locator('main')).toBeVisible();
}

test('startet mit dem vorausgefüllten Startprofil', async ({ page }) => {
  await open(page);
  await expect(page.getByText('Startprofil mit Beispieldaten – frei bearbeitbar')).toBeVisible();
  await open(page, '/kleiderschrank');
  await expect(page.getByRole('button', { name: /AIRism Oversized T-Shirt Weinrot/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Vorhanden \(9\)/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Geplant & Wunsch \(4\)/ })).toBeVisible();
});

test('legt ein neues Profil an, wechselt Profile und trennt die Daten', async ({ page }) => {
  await open(page, '/profil');
  await page.getByRole('button', { name: 'Neues Profil' }).first().click();
  await page.locator('#new-name').fill('Testperson');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByText('Profil angelegt und aktiviert.')).toBeVisible();
  await open(page, '/kleiderschrank');
  await expect(page.getByText('Dein Kleiderschrank ist noch leer')).toBeVisible();

  // Zurück zum Startprofil
  await page.getByRole('button', { name: /Profil wechseln/ }).first().click();
  await page.getByRole('option', { name: /Startprofil/ }).click();
  await expect(page.getByRole('button', { name: /Dunkelbraune Lederjacke/ })).toBeVisible();
});

test('fügt ein Kleidungsstück über den geführten Workflow hinzu', async ({ page }) => {
  await open(page, '/kleiderschrank/neu');
  await page.getByRole('button', { name: /Jacken & Mäntel/ }).click();
  await page.getByRole('button', { name: /^Parka$/ }).click();
  await page.getByRole('radio', { name: 'HEX' }).click();
  await page.locator('#garment-hex').fill('656749');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.locator('#g-brand').fill('Testmarke');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.getByRole('button', { name: 'Im Kleiderschrank speichern' }).click();
  await expect(page.getByText('Diese vorhandenen Teile passen besonders gut dazu:')).toBeVisible();
  await open(page, '/kleiderschrank');
  await expect(page.getByRole('button', { name: /Parka Olivgrün/ })).toBeVisible();
});

test('Outfit-Studio: Beispiel laden, analysieren und speichern', async ({ page }) => {
  await open(page, '/studio?example=tone-in-tone');
  await expect(page.getByRole('img', { name: /Outfit Ton-in-Ton/ })).toBeVisible();
  await page.getByRole('radio', { name: 'Analyse' }).click();
  await expect(page.getByText('Ein Farbton in mehreren Helligkeitsstufen')).toBeVisible();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Outfit gespeichert.')).toBeVisible();
  await page.getByRole('radio', { name: /Gespeichert \(1\)/ }).click();
  await expect(page.getByRole('button', { name: /Ton-in-Ton/ }).last()).toBeVisible();
});

test('Backup exportieren und wieder importieren', async ({ page }) => {
  await open(page, '/einstellungen');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Alle Profile sichern' }).click()]);
  const path = await download.path();
  expect(download.suggestedFilename()).toMatch(/^chromawardrobe-backup-full-.*\.json$/);
  await page.locator('input[type=file][accept*="json"]').setInputFiles(path!);
  await expect(page.getByText(/Gültiges Backup: 1 Profil/)).toBeVisible();
  await page.getByRole('button', { name: 'Importieren' }).click();
  await expect(page.getByText('1 Profil(e) importiert.')).toBeVisible();
});

test('lehnt ungültige Importdateien ab', async ({ page }) => {
  await open(page, '/einstellungen');
  await page.locator('input[type=file][accept*="json"]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"etwas anderes"}') });
  await expect(page.getByText('Die Datei ist kein ChromaWardrobe-Backup.')).toBeVisible();
});

test('kein horizontales Scrollen auf zentralen Seiten', async ({ page }) => {
  for (const r of ['/', '/kleiderschrank', '/studio', '/palette', '/wunschliste', '/empfehlungen', '/akademie/grau-braun', '/farbtyp/warm-autumn']) {
    await open(page, r);
    await page.waitForTimeout(300);
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(sw, `Überlauf auf ${r}`).toBeLessThanOrEqual(cw);
  }
});

test('Farbscanner: Kamera starten, Farbe übernehmen, Kamera beenden', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Die simulierte Kamera ist nur im Desktop-Projekt konfiguriert.');
  await open(page, '/scanner');
  await page.getByRole('radio', { name: 'Kamera (live)' }).click();
  await page.getByRole('button', { name: 'Kamera starten' }).click();
  await expect(page.getByRole('button', { name: 'Farbe übernehmen' })).toBeEnabled({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Farbe übernehmen' }).click();
  await expect(page.getByRole('button', { name: 'Als Kleidungsstück anlegen' })).toBeVisible();
  await page.getByRole('button', { name: 'Kamera beenden' }).click();
  const tracksLive = await page.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null;
    return !!(v?.srcObject as MediaStream | null)?.getTracks().some((t) => t.readyState === 'live');
  });
  expect(tracksLive).toBe(false);
});

test('mobile Navigation öffnet alle Bereiche', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Nur mobil');
  await open(page);
  await page.getByRole('button', { name: 'Mehr' }).click();
  await page.getByRole('dialog', { name: 'Alle Bereiche' }).getByRole('link', { name: 'Farbakademie' }).click();
  await expect(page.getByRole('heading', { name: 'Farbakademie' })).toBeVisible();
});

import { useEffect, useState } from 'react';
import { Download, HardDrive, Monitor, Moon, Shield, Sun, Trash2, Upload } from 'lucide-react';
import { useAppData } from '@/app/AppData';
import { useTheme, type ThemeChoice } from '@/app/theme';
import { Badge, Button, Callout, Card, Field, PageHeader, SectionTitle, Segmented, TextInput } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { store, SETTINGS } from '@/data/store';
import { useSetting } from '@/data/hooks';
import { APP_VERSION, backupFileName, exportAll, exportProfile, importBackup, validateBackup, type ImportMode, type ValidationResult } from '@/data/backup/backup';
import { addSampleProfile, setActiveProfile } from '@/data/services';
import { downloadJson } from './studio/exportImage';
import { nowIso } from '@/domain/id';
import { t } from '@/i18n';

export default function SettingsPage() {
  const { profile } = useAppData();
  const [theme, setTheme] = useTheme();
  const toast = useToast();
  const lastBackup = useSetting<string>(SETTINGS.lastBackupAt);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number; persisted?: boolean } | null>(null);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeText, setWipeText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const e = await navigator.storage?.estimate?.();
        const persisted = await navigator.storage?.persisted?.();
        setEstimate({ usage: e?.usage, quota: e?.quota, persisted });
      } catch {
        setEstimate(null);
      }
    })();
  }, []);

  const doExportAll = async () => {
    downloadJson(await exportAll(store), backupFileName('full'));
    await store.settings.set(SETTINGS.lastBackupAt, nowIso());
    toast.show('Backup erstellt.');
  };

  const mb = (b?: number) => (b === undefined ? '–' : `${(b / 1024 / 1024).toFixed(1)} MB`);

  return (
    <div>
      <PageHeader title={t.nav.settings} />
      <div className="space-y-10">
        <section aria-labelledby="look-h">
          <SectionTitle id="look-h">Darstellung</SectionTitle>
          <Segmented<ThemeChoice>
            label="Farbschema"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: <span className="flex items-center gap-1.5"><Sun className="h-4 w-4" /> Hell</span> },
              { value: 'dark', label: <span className="flex items-center gap-1.5"><Moon className="h-4 w-4" /> Dunkel</span> },
              { value: 'system', label: <span className="flex items-center gap-1.5"><Monitor className="h-4 w-4" /> System</span> },
            ]}
          />
          <p className="mt-2 text-sm text-muted">Die Oberfläche bleibt in beiden Modi neutral, damit Kleidungsfarben nicht verfälscht wirken.</p>
        </section>

        <section aria-labelledby="backup-h">
          <SectionTitle id="backup-h" hint="Deine Daten liegen nur in diesem Browser. Wird der Browserspeicher gelöscht, sind sie weg – erstelle deshalb regelmäßig Backups.">
            Backup & Wiederherstellung
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3 p-5">
              <p className="font-semibold">Exportieren</p>
              <p className="text-sm text-muted">
                Letztes vollständiges Backup: {lastBackup ? new Date(lastBackup).toLocaleString('de-DE') : 'noch keines'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={doExportAll}>
                  <Download className="h-4 w-4" /> Alle Profile sichern
                </Button>
                {profile && (
                  <Button variant="outline" onClick={async () => downloadJson(await exportProfile(store, profile.id), backupFileName('profile', profile.name))}>
                    <Download className="h-4 w-4" /> Nur „{profile.name}“
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted">JSON-Datei inklusive Fotos. Bewahre sie privat auf – sie enthält persönliche Daten. Lege sie nicht ins Git-Repository.</p>
            </Card>
            <Card className="space-y-3 p-5">
              <p className="font-semibold">Importieren / Wiederherstellen</p>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-sm hover:bg-surface-2">
                <Upload className="h-4 w-4" aria-hidden /> Backup-Datei wählen
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    if (f.size > 60 * 1024 * 1024) return setValidation({ ok: false, errors: ['Die Datei ist zu groß (max. 60 MB).'] });
                    setValidation(validateBackup(await f.text()));
                  }}
                />
              </label>
              {validation && !validation.ok && (
                <Callout tone="attention" title="Import nicht möglich">
                  <ul className="list-disc pl-4">
                    {validation.errors.map((er) => (
                      <li key={er}>{er}</li>
                    ))}
                  </ul>
                </Callout>
              )}
              {validation?.ok && validation.summary && (
                <div className="space-y-3 rounded-xl bg-surface-2 p-3 text-sm">
                  <p>
                    Gültiges Backup: {validation.summary.profiles} Profil(e), {validation.summary.garments} Kleidungsstücke, {validation.summary.outfits} Outfits,{' '}
                    {validation.summary.images} Bilder.
                  </p>
                  <Segmented<ImportMode>
                    label="Import-Modus"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: 'merge', label: 'Hinzufügen' },
                      { value: 'replace', label: 'Alles ersetzen' },
                    ]}
                  />
                  <p className="text-xs text-muted">
                    {mode === 'merge'
                      ? 'Die Profile werden zusätzlich angelegt. Vorhandene Daten bleiben unverändert.'
                      : 'Achtung: Alle lokalen Daten werden gelöscht und durch das Backup ersetzt.'}
                  </p>
                  <Button
                    variant={mode === 'replace' ? 'danger' : 'primary'}
                    onClick={async () => {
                      try {
                        const res = await importBackup(store, validation.data!, mode);
                        const first = Object.values(res.profileIdMap)[0];
                        if (first) await setActiveProfile(store, first);
                        setValidation(null);
                        toast.show(`${res.profiles} Profil(e) importiert.`);
                      } catch (e) {
                        toast.show(`Import fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`, { tone: 'error' });
                      }
                    }}
                  >
                    Importieren
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </section>

        <section aria-labelledby="storage-h">
          <SectionTitle id="storage-h">Speicher</SectionTitle>
          <Card className="flex flex-wrap items-center gap-4 p-5">
            <HardDrive className="h-5 w-5 text-muted" aria-hidden />
            <p className="text-sm">
              Belegt: {mb(estimate?.usage)} von verfügbar {mb(estimate?.quota)} ·{' '}
              {estimate?.persisted ? <Badge tone="positive">dauerhaft gespeichert</Badge> : <Badge>kann vom Browser geleert werden</Badge>}
            </p>
            {!estimate?.persisted && navigator.storage?.persist && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const ok = await navigator.storage.persist();
                  setEstimate((e) => ({ ...e, persisted: ok }));
                  toast.show(ok ? 'Der Browser speichert die Daten nun dauerhaft.' : 'Der Browser hat die dauerhafte Speicherung abgelehnt.');
                }}
              >
                Dauerhafte Speicherung anfragen
              </Button>
            )}
          </Card>
        </section>

        <section aria-labelledby="sample-h">
          <SectionTitle id="sample-h" hint="Beispielprofile sind gekennzeichnet und können jederzeit gelöscht werden.">
            Beispieldaten
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={async () => { await setActiveProfile(store, (await addSampleProfile(store, 'starter')).id); toast.show('Startprofil hinzugefügt.'); }}>
              Startprofil (Warmer Herbst) hinzufügen
            </Button>
            <Button variant="outline" onClick={async () => { await setActiveProfile(store, (await addSampleProfile(store, 'demo')).id); toast.show('Demo-Profil hinzugefügt.'); }}>
              Anonymes Demo-Profil hinzufügen
            </Button>
          </div>
        </section>

        <section aria-labelledby="privacy-h">
          <SectionTitle id="privacy-h">Datenschutz</SectionTitle>
          <Card className="space-y-2 p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4" aria-hidden /> Local-first
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>Alle Profile, Kleidungsstücke, Outfits und Fotos werden ausschließlich lokal im Browser (IndexedDB) gespeichert.</li>
              <li>Es gibt kein Tracking, keine Analyse-Dienste und keine externen KI-Dienste.</li>
              <li>Kamera und Fotos werden nur lokal ausgewertet und nie übertragen.</li>
              <li>Lokale Profile sind nicht voneinander abgeschottet – jeder mit Zugriff auf diesen Browser kann sie sehen.</li>
            </ul>
          </Card>
        </section>

        <section aria-labelledby="danger-h">
          <SectionTitle id="danger-h">Daten löschen</SectionTitle>
          <Button variant="danger" onClick={() => setWipeOpen(true)}>
            <Trash2 className="h-4 w-4" /> Alle lokalen Daten löschen
          </Button>
        </section>

        <p className="text-xs text-muted">ChromaWardrobe {APP_VERSION} · Deutsch · weitere Sprachen geplant</p>
      </div>

      <Modal
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        title="Alle Daten löschen?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setWipeOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              disabled={wipeText !== 'LÖSCHEN'}
              onClick={async () => {
                await store.clearAll();
                await store.settings.set(SETTINGS.seeded, true);
                setWipeOpen(false);
                setWipeText('');
                toast.show('Alle lokalen Daten wurden gelöscht.');
              }}
            >
              Endgültig löschen
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm">Alle Profile, Kleidungsstücke, Outfits und Fotos werden unwiderruflich gelöscht. Erstelle vorher ein Backup.</p>
        <Field label="Zur Bestätigung LÖSCHEN eingeben" htmlFor="wipe">
          <TextInput id="wipe" value={wipeText} onChange={(e) => setWipeText(e.target.value)} autoComplete="off" />
        </Field>
      </Modal>
    </div>
  );
}

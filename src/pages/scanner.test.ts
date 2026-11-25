import { describe, expect, it, vi } from 'vitest';
import { cameraErrorMessage } from './ScannerPage';

describe('Kameraberechtigungen', () => {
  it('erklärt verweigerte Berechtigungen verständlich', () => {
    vi.stubGlobal('isSecureContext', true);
    expect(cameraErrorMessage({ name: 'NotAllowedError' })).toMatch(/nicht erlaubt/);
    expect(cameraErrorMessage({ name: 'NotFoundError' })).toMatch(/keine passende Kamera/);
    expect(cameraErrorMessage({ name: 'NotReadableError' })).toMatch(/andere/);
    expect(cameraErrorMessage(new Error('x'))).toMatch(/Foto-Modus/);
    vi.unstubAllGlobals();
  });
  it('weist auf den sicheren Kontext (HTTPS/localhost) hin', () => {
    vi.stubGlobal('isSecureContext', false);
    expect(cameraErrorMessage({ name: 'NotAllowedError' })).toMatch(/HTTPS oder localhost/);
    vi.unstubAllGlobals();
  });
});

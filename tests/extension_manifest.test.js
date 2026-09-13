import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Chrome Extension Manifest & Files Verification', () => {
  const extensionDir = path.resolve(__dirname, '../extension');
  const manifestPath = path.join(extensionDir, 'manifest.json');

  it('has a valid manifest.json with MV3 schema', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('X Bookmarks Exporter');
    expect(manifest.permissions).toContain('downloads');
    expect(manifest.host_permissions).toContain('https://x.com/i/bookmarks*');
    expect(manifest.host_permissions).toContain('https://twitter.com/i/bookmarks*');
    expect(manifest.host_permissions).toContain('https://x.com/i/history*');
    expect(manifest.host_permissions).toContain('https://twitter.com/i/history*');

    // Check referenced files exist
    const bgScript = path.join(extensionDir, manifest.background.service_worker);
    expect(fs.existsSync(bgScript)).toBe(true);

    const popupHtml = path.join(extensionDir, manifest.action.default_popup);
    expect(fs.existsSync(popupHtml)).toBe(true);

    for (const cs of manifest.content_scripts) {
      expect(cs.matches).toContain('https://x.com/i/history*');
      expect(cs.matches).toContain('https://twitter.com/i/history*');
      for (const script of cs.js) {
        const csPath = path.join(extensionDir, script);
        expect(fs.existsSync(csPath)).toBe(true);
      }
    }
  });

  it('has a valid standalone console script', () => {
    const scriptPath = path.join(extensionDir, 'standalone', 'console-scraper.js');
    expect(fs.existsSync(scriptPath)).toBe(true);
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('runXBookmarksScraper');
    expect(content).toContain('window.__X_SCRAPER__');
  });
});

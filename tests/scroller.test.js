import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { checkPageStatus, isLoadingSpinnerVisible, getRandomDelay } from '../extension/src/scroller.js';

describe('Scroller Helpers & Page Status Detection', () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
      url: 'https://x.com/i/bookmarks',
    });
    global.document = dom.window.document;
    global.window = dom.window;
  });

  it('detects valid bookmarks page with no errors', () => {
    const status = checkPageStatus(document);
    expect(status.hasError).toBe(false);
  });

  it('detects non-bookmarks page error', () => {
    const foreignDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://x.com/home',
    });
    const status = checkPageStatus(foreignDom.window.document);
    expect(status.hasError).toBe(true);
    expect(status.errorType).toBe('INVALID_PAGE');
  });

  it('detects login required modal', () => {
    document.body.innerHTML = '<div data-testid="login"><span>Log in to X</span></div>';
    const status = checkPageStatus(document);
    expect(status.hasError).toBe(true);
    expect(status.errorType).toBe('LOGIN_REQUIRED');
  });

  it('detects rate limit or error banner', () => {
    document.body.innerHTML = '<div><span>Something went wrong. Try reloading.</span></div>';
    const status = checkPageStatus(document);
    expect(status.hasError).toBe(true);
    expect(status.errorType).toBe('RATE_LIMITED');
  });

  it('detects presence of loading spinner', () => {
    expect(isLoadingSpinnerVisible(document)).toBe(false);
    document.body.innerHTML = '<div role="progressbar">Loading</div>';
    expect(isLoadingSpinnerVisible(document)).toBe(true);
  });

  it('generates random delays within bounds', () => {
    for (let i = 0; i < 20; i++) {
      const delay = getRandomDelay(800, 1500);
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1500);
    }
  });
});

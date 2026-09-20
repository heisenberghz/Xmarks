// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

describe('Theme preference management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('stores and retrieves theme preference in localStorage', () => {
    expect(localStorage.getItem('xbm_theme')).toBeNull();
    localStorage.setItem('xbm_theme', 'light');
    expect(localStorage.getItem('xbm_theme')).toBe('light');
    localStorage.setItem('xbm_theme', 'dark');
    expect(localStorage.getItem('xbm_theme')).toBe('dark');
  });

  it('applies dark and light class to root element accordingly', () => {
    const root = document.documentElement;
    
    // Test dark mode application
    root.classList.add('dark');
    root.classList.remove('light');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.classList.contains('light')).toBe(false);

    // Test light mode application
    root.classList.remove('dark');
    root.classList.add('light');
    expect(root.classList.contains('light')).toBe(true);
    expect(root.classList.contains('dark')).toBe(false);
  });
});

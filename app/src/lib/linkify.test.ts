import { describe, it, expect } from 'vitest';
import { normalizeTweetText, tokenizeTextWithLinks } from './linkify';

describe('Linkify & URL Normalization', () => {
  it('normalizes https:// split across newlines (from X DOM)', () => {
    const broken = 'wtf this is crazy:\nhttps://\npdfcn.dev';
    const normalized = normalizeTweetText(broken);
    expect(normalized).toBe('wtf this is crazy:\nhttps://pdfcn.dev');
  });

  it('normalizes https:// split with text following domain', () => {
    const text = '- Unlimited glm-5.3-flash on\nhttps://\nz.ai plans from 5 pm every day for 10 hours';
    const tokens = tokenizeTextWithLinks(text);

    const linkToken = tokens.find((t) => t.type === 'link');
    expect(linkToken).toBeDefined();
    expect(linkToken?.content).toBe('https://z.ai');
    expect(linkToken?.url).toBe('https://z.ai');

    const restToken = tokens.find((t) => t.content.includes('plans from 5 pm'));
    expect(restToken).toBeDefined();
    expect(restToken?.type).toBe('text');
  });

  it('correctly tokenizes full URLs with trailing punctuation', () => {
    const text = 'Check out https://fuck-my-resume.vercel.app.';
    const tokens = tokenizeTextWithLinks(text);

    const linkToken = tokens.find((t) => t.type === 'link');
    expect(linkToken?.content).toBe('https://fuck-my-resume.vercel.app');
    expect(linkToken?.url).toBe('https://fuck-my-resume.vercel.app');

    const dotToken = tokens[tokens.length - 1];
    expect(dotToken.content).toBe('.');
    expect(dotToken.type).toBe('text');
  });

  it('tokenizes raw domain names without protocol and assigns https prefix to href', () => {
    const text = 'who made this opensourceui.in?';
    const tokens = tokenizeTextWithLinks(text);

    const linkToken = tokens.find((t) => t.type === 'link');
    expect(linkToken?.content).toBe('opensourceui.in');
    expect(linkToken?.url).toBe('https://opensourceui.in');
  });

  it('heals URL paths split across newlines (like Marcel card case)', () => {
    const text = 'with two skills:\nskills.sh/jakubkrehel/sk\nills/better-ui\n...';
    const tokens = tokenizeTextWithLinks(text);

    const linkToken = tokens.find((t) => t.type === 'link');
    expect(linkToken).toBeDefined();
    expect(linkToken?.content).toBe('skills.sh/jakubkrehel/skills/better-ui');
    expect(linkToken?.url).toBe('https://skills.sh/jakubkrehel/skills/better-ui');
  });

  it('heals URL paths ending in slash before newline', () => {
    const text = 'Check docs at https://docs.example.com/api/\nv1/endpoints';
    const tokens = tokenizeTextWithLinks(text);

    const linkToken = tokens.find((t) => t.type === 'link');
    expect(linkToken).toBeDefined();
    expect(linkToken?.content).toBe('https://docs.example.com/api/v1/endpoints');
    expect(linkToken?.url).toBe('https://docs.example.com/api/v1/endpoints');
  });
});

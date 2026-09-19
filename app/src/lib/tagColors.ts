const TAG_COLORS = [
  { bg: 'bg-blue-500/[0.1]', text: 'text-blue-300', border: 'border-blue-500/20', dot: '#3B82F6' },
  { bg: 'bg-emerald-500/[0.1]', text: 'text-emerald-300', border: 'border-emerald-500/20', dot: '#10B981' },
  { bg: 'bg-indigo-500/[0.1]', text: 'text-indigo-300', border: 'border-indigo-500/20', dot: '#6366F1' },
  { bg: 'bg-teal-500/[0.1]', text: 'text-teal-300', border: 'border-teal-500/20', dot: '#14B8A6' },
  { bg: 'bg-rose-500/[0.1]', text: 'text-rose-300', border: 'border-rose-500/20', dot: '#F43F5E' },
  { bg: 'bg-sky-500/[0.1]', text: 'text-sky-300', border: 'border-sky-500/20', dot: '#0EA5E9' },
  { bg: 'bg-violet-500/[0.1]', text: 'text-violet-300', border: 'border-violet-500/20', dot: '#8B5CF6' },
  { bg: 'bg-zinc-500/[0.15]', text: 'text-zinc-300', border: 'border-zinc-500/20', dot: '#71717A' },
];

export function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

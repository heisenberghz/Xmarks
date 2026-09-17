const TAG_COLORS = [
  { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/20' },
  { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/20' },
  { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20' },
  { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20' },
  { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/20' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/20' },
];

export function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

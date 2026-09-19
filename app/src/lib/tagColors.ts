const TAG_COLORS = [
  { bg: 'bg-amber-500/[0.12]', text: 'text-amber-300', border: 'border-amber-500/25', dot: '#F59E0B' },
  { bg: 'bg-emerald-500/[0.12]', text: 'text-emerald-300', border: 'border-emerald-500/25', dot: '#10B981' },
  { bg: 'bg-orange-500/[0.12]', text: 'text-orange-300', border: 'border-orange-500/25', dot: '#F97316' },
  { bg: 'bg-teal-500/[0.12]', text: 'text-teal-300', border: 'border-teal-500/25', dot: '#14B8A6' },
  { bg: 'bg-rose-500/[0.12]', text: 'text-rose-300', border: 'border-rose-500/25', dot: '#F43F5E' },
  { bg: 'bg-sky-500/[0.12]', text: 'text-sky-300', border: 'border-sky-500/25', dot: '#0EA5E9' },
  { bg: 'bg-yellow-500/[0.12]', text: 'text-yellow-300', border: 'border-yellow-500/25', dot: '#EAB308' },
  { bg: 'bg-stone-500/[0.15]', text: 'text-stone-300', border: 'border-stone-400/25', dot: '#A8A29E' },
];

export function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

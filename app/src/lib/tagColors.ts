// Refined slate tag styling — flat, solid, high-legibility, zero glow
const TAG_STYLE = {
  bg: 'bg-cardHover',
  text: 'text-slate-700 dark:text-slate-300',
  border: 'border-border',
  dot: '#64748b',
};

export function getTagColor(_tag?: string) {
  return TAG_STYLE;
}

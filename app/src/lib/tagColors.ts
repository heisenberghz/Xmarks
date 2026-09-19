// Flat solid neutral monochrome tag styling — zero warm tints, zero yellow, zero purple
const TAG_STYLE = {
  bg: 'bg-zinc-800/80',
  text: 'text-zinc-300',
  border: 'border-zinc-700',
  dot: '#71717a',
};

export function getTagColor(_tag?: string) {
  return TAG_STYLE;
}

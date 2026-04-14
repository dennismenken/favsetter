export function tagChipClass(name: string) {
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const idx = Math.abs(hash) % 8;
  return `tag-chip tag-c${idx}`;
}

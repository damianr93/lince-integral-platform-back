export function normalizeArgentinePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+549')) return clean.substring(4);
  if (clean.startsWith('549')) return clean.substring(3);
  if (clean.startsWith('+54')) return clean.substring(3);
  if (clean.startsWith('54')) return clean.substring(2);
  if (clean.startsWith('0')) return clean.substring(1);
  return clean;
}

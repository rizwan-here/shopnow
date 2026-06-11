export function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'store';
}

export function currency(value = 0, currencyCode = 'BDT', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode || 'BDT',
    maximumFractionDigits: ['JPY'].includes(currencyCode) ? 0 : 2
  }).format(Number(value || 0));
}

export function serialiseDocument(doc) {
  return JSON.parse(JSON.stringify(doc));
}

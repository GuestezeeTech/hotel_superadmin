/** GST used when a plan has no gst_percentage saved yet. */
export const DEFAULT_GST_PERCENTAGE = 18;

/** Default symbol when a plan has no currency_type. */
export const DEFAULT_CURRENCY_SYMBOL = '$';

const CURRENCY_SYMBOLS: Record<string, string> = {
  dollar: '$',
  dollars: '$',
  usd: '$',
  $: '$',
  rupee: '₹',
  rupees: '₹',
  inr: '₹',
  rs: '₹',
  '₹': '₹',
  euro: '€',
  eur: '€',
  '€': '€',
  pound: '£',
  gbp: '£',
  '£': '£',
  dirham: 'AED ',
  aed: 'AED '
};

/** Symbol for a plan's currency_type ("dollar", "USD", "$", "rupee", ...). */
export function currencySymbolOf(plan: any): string {
  const raw = String(plan?.currency_type ?? '').trim();
  if (!raw) {
    return DEFAULT_CURRENCY_SYMBOL;
  }
  return CURRENCY_SYMBOLS[raw.toLowerCase().replace(/\.$/, '')] ?? `${raw} `;
}

/** The plan's GST percentage (0-100), or 18 when it has none. */
export function gstPercentageOf(plan: any): number {
  const raw = plan?.gst_percentage;
  if (raw === null || raw === undefined || raw === '') {
    return DEFAULT_GST_PERCENTAGE;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : DEFAULT_GST_PERCENTAGE;
}

/** GST on an amount at the plan's rate, rounded to 2 decimals. */
export function gstFor(amount: number, plan: any): number {
  return +((amount * gstPercentageOf(plan)) / 100).toFixed(2);
}

/** Used when a plan has no inr_per_usd saved yet; set the real rate on the plans page. */
export const DEFAULT_INR_PER_USD = 83;

/** Rupees per US dollar saved on the plan (inr_per_usd), used to bill Indian hotels in INR. */
export function inrPerUsdOf(plan: any): number {
  const value = Number(plan?.inr_per_usd);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_INR_PER_USD;
}

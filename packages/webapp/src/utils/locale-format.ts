// NBooks: locale-aware money formatting options (fr-CA: "1 234,56 $").
import intl from 'react-intl-universal';

const NBSP = '\u00A0';

/**
 * Retrieves the current UI locale, falling back to English.
 */
export function getCurrentUiLocale(): string {
  try {
    return intl.getInitOptions()?.currentLocale || 'en';
  } catch (e) {
    return 'en';
  }
}

/**
 * Returns the `accounting.formatMoney` options overrides for the given locale.
 * Returns an empty object for locales that keep the default (English) format.
 */
export function getLocaleMoneyOptions(
  hasSymbol: boolean,
  noZero = false,
  locale: string = getCurrentUiLocale(),
) {
  if (locale !== 'fr') {
    return {};
  }
  const pos = hasSymbol ? `%v${NBSP}%s` : '%v';
  const neg = hasSymbol ? `-%v${NBSP}%s` : '-%v';

  return {
    thousand: NBSP,
    decimal: ',',
    format: { pos, neg, zero: noZero ? '' : pos },
  };
}

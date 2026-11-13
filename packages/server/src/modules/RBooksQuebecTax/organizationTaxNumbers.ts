/**
 * RBooks : numeros de TPS/TVH et de TVQ de l'entreprise, affiches sur les documents
 * (factures, soumissions, recus de vente, notes de credit) a la suite de l'adresse.
 *
 * Libelles en francais : « TPS : 123456789 RT0001 », « TVQ : 1234567890 TQ0001 ».
 * Les valeurs sont nettoyees (sanitize-html, aucune balise permise) comme le reste de l'adresse.
 */
import * as sanitizeHtml from 'sanitize-html';

const clean = (value?: string | null): string =>
  sanitizeHtml(String(value ?? '').trim(), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

/**
 * Lignes de texte des numeros de taxe de l'entreprise (sans balise).
 */
export const getOrganizationTaxNumberLines = (metadata: {
  taxNumber?: string | null;
  tvqNumber?: string | null;
}): string[] => {
  const lines: string[] = [];
  const tps = clean(metadata?.taxNumber);
  const tvq = clean(metadata?.tvqNumber);
  if (tps) lines.push(`TPS : ${tps}`);
  if (tvq) lines.push(`TVQ : ${tvq}`);
  return lines;
};

/**
 * Ajoute les numeros de taxe a l'adresse HTML de l'organisation.
 */
export const appendTaxNumbersToAddress = (
  addressHtml: string,
  metadata: { taxNumber?: string | null; tvqNumber?: string | null },
): string => {
  const lines = getOrganizationTaxNumberLines(metadata);
  if (!lines.length) return addressHtml;
  // L'adresse se termine souvent par un <br /> : on l'enleve pour ne pas creer une ligne vide.
  const base = (addressHtml || '').replace(/(<br\s*\/?>\s*)+$/i, '');
  return [base, ...lines].filter(Boolean).join('<br />');
};

/**
 * NBooks : choix du plan comptable par defaut a la creation d'une organisation.
 *
 * Le plan du Quebec (`database/tenant/seeds/data/accountsQuebec.ts`) est utilise quand :
 *  - la langue de l'organisation est `fr-CA` (ou `fr_CA`), ou
 *  - le pays/province est `CA-QC` (ou la province de l'adresse est QC/Quebec avec le pays CA), ou
 *  - la langue est `fr` (seul code francais accepte par NBooks) ET le pays est CA ou la devise CAD.
 * Dans tous les autres cas, le plan anglais de Bigcapital reste inchange.
 */
export interface QuebecChartMetadata {
  language?: string | null;
  location?: string | null;
  baseCurrency?: string | null;
  address?: { stateProvince?: string | null } | string | null;
}

const norm = (v?: string | null) => String(v ?? '').trim();

export const shouldUseQuebecChart = (
  metadata?: QuebecChartMetadata | null,
): boolean => {
  if (!metadata) return false;
  const language = norm(metadata.language).replace('_', '-').toLowerCase();
  const location = norm(metadata.location).toUpperCase();
  const currency = norm(metadata.baseCurrency).toUpperCase();

  let state = '';
  const address: any = metadata.address;
  if (address && typeof address === 'object') {
    state = norm(address.stateProvince);
  } else if (typeof address === 'string') {
    try {
      state = norm(JSON.parse(address)?.stateProvince);
    } catch {
      state = '';
    }
  }
  const stateIsQuebec = /^(qc|qu[eé]bec)$/i.test(state);

  if (language === 'fr-ca') return true;
  if (location === 'CA-QC') return true;
  if (location === 'CA' && stateIsQuebec) return true;
  if (language === 'fr' && (location === 'CA' || currency === 'CAD'))
    return true;
  return false;
};

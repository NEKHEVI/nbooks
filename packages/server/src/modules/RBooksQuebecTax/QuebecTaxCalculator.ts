/**
 * RBooks : calcul des taxes multiples par ligne (TPS + TVQ).
 *
 * Fonctions pures, sans acces a la base de donnees.
 *
 * Regle d'arrondi (a documenter dans le rapport de la tache 02) :
 * - chaque taxe est calculee separement, PAR LIGNE, et arrondie a 2 decimales
 *   (demi vers le haut, en valeur absolue) ;
 * - le total d'une taxe pour un document est la SOMME des lignes arrondies ;
 * - taxes en sus : taxe = montant x taux / 100 ;
 * - taxes incluses : base = montant / (1 + somme des taux / 100), puis
 *   taxe = base x taux / 100, arrondie par taxe.
 */

export interface ITaxComponent {
  taxRateId: number;
  code: string;
  name: string;
  /** Pourcentage, ex. 9.975 */
  rate: number;
  salesAccountId?: number | null;
  purchaseAccountId?: number | null;
  registrationNo?: string | null;
}

export interface ITaxComponentAmount {
  component: ITaxComponent;
  amount: number;
}

/**
 * Arrondit a 2 decimales (demi vers le haut sur la valeur absolue) sans bruit
 * de virgule flottante.
 */
export const roundMoney = (value: number): number => {
  const n = Number(value) || 0;
  const sign = n < 0 ? -1 : 1;
  const cents = Math.round(Number((Math.abs(n) * 100).toPrecision(12)));
  return (sign * cents) / 100;
};

/**
 * Lit les composantes d'une ligne (JSON texte ou tableau).
 */
export const parseTaxComponents = (raw: unknown): ITaxComponent[] => {
  if (!raw) return [];
  let list: any = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => c && c.rate !== undefined && c.rate !== null)
    .map((c) => ({
      taxRateId: Number(c.taxRateId),
      code: c.code,
      name: c.name,
      rate: Number(c.rate),
      salesAccountId: c.salesAccountId ?? null,
      purchaseAccountId: c.purchaseAccountId ?? null,
      registrationNo: c.registrationNo ?? null,
    }));
};

/**
 * Calcule le montant de chaque taxe pour une ligne.
 * @param {number} amount - quantite x prix de la ligne.
 * @param {ITaxComponent[]} components - taxes de la ligne.
 * @param {boolean} isInclusive - le montant contient deja les taxes.
 */
export const computeLineTaxComponents = (
  amount: number,
  components: ITaxComponent[],
  isInclusive: boolean,
): ITaxComponentAmount[] => {
  const total = Number(amount) || 0;
  const sumRates = components.reduce((s, c) => s + Number(c.rate), 0);
  const base = isInclusive ? total / (1 + sumRates / 100) : total;

  return components.map((component) => ({
    component,
    amount: roundMoney((base * Number(component.rate)) / 100),
  }));
};

/**
 * Somme des taxes d'une ligne.
 */
export const sumTaxComponentAmounts = (
  amounts: ITaxComponentAmount[],
): number => roundMoney(amounts.reduce((s, a) => s + a.amount, 0));

/**
 * Calcule les taxes d'une ligne a partir de ses champs bruts.
 */
export const computeEntryTaxComponents = (entry: {
  quantity?: number;
  rate?: number;
  isInclusiveTax?: number | boolean;
  taxComponents?: unknown;
}): ITaxComponentAmount[] => {
  const components = parseTaxComponents(entry.taxComponents);
  if (!components.length) return [];
  const amount = Number(entry.quantity) * Number(entry.rate);
  return computeLineTaxComponents(amount, components, !!entry.isInclusiveTax);
};

/**
 * Totaux par taxe (somme des lignes) pour un ensemble de lignes.
 */
export const aggregateTaxComponentAmounts = (
  entries: Array<Parameters<typeof computeEntryTaxComponents>[0]>,
): Array<{ component: ITaxComponent; amount: number }> => {
  const map = new Map<number, { component: ITaxComponent; amount: number }>();
  entries.forEach((entry) => {
    computeEntryTaxComponents(entry).forEach(({ component, amount }) => {
      const found = map.get(component.taxRateId);
      if (found) found.amount = roundMoney(found.amount + amount);
      else map.set(component.taxRateId, { component, amount });
    });
  });
  return Array.from(map.values());
};

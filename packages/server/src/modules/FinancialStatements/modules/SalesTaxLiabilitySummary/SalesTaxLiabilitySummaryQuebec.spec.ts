/**
 * NBooks (tache 12) : rapport de taxe de vente pour le Quebec.
 * - TPS et TVQ separees (la base d'un groupe « TPS + TVQ » est repartie sur ses composantes) ;
 * - taxe percue sur les ventes, taxe payee sur les achats (CTI/RTI) et taxe nette par periode.
 */
import { SalesTaxLiabilitySummary } from './SalesTaxLiabilitySummary';
import { SalesTaxLiabilitySummaryRepository } from './SalesTaxLiabilitySummaryRepository';
import { SalesTaxLiabilitySummaryQuery } from './SalesTaxLiability.types';
import { AccountingBasis } from '@/common/types/AccountingBasis';

const query: SalesTaxLiabilitySummaryQuery = {
  fromDate: '2026-11-01',
  toDate: '2026-11-30',
  basis: AccountingBasis.Accrual,
  numberFormat: {},
};

const TAX_RATES = [
  { id: 5, name: 'TPS', rate: 5, isGroup: 0, purchaseAccountId: 10 },
  { id: 6, name: 'TVQ', rate: 9.975, isGroup: 0, purchaseAccountId: 11 },
  { id: 7, name: 'TPS + TVQ', rate: 14.975, isGroup: 1, componentIds: '[5,6]' },
];

const createSummary = (repo: Partial<SalesTaxLiabilitySummaryRepository>) =>
  new SalesTaxLiabilitySummary(
    query,
    {
      taxRates: TAX_RATES,
      taxesPayableByTaxRateId: {},
      accountTransactionsByTaxRateId: {},
      taxesPaidByTaxRateId: {},
      ...repo,
    } as unknown as SalesTaxLiabilitySummaryRepository,
    { baseCurrency: 'CAD', dateFormat: 'YYYY MMM DD' },
  );

describe('SalesTaxLiabilitySummary : TPS / TVQ (Quebec)', () => {
  const summary = createSummary({
    // Ventes : base de 1 000 $ taxee par le groupe ; TPS 50 $ et TVQ 99,75 $ percues.
    accountTransactionsByTaxRateId: {
      7: { taxRateId: 7, credit: 1000, debit: 0 },
    },
    taxesPayableByTaxRateId: {
      5: { taxRateId: 5, credit: 50, debit: 0 },
      6: { taxRateId: 6, credit: 99.75, debit: 0 },
    },
    // Achats : CTI 14 $ et RTI 27,93 $ (deja nets de la part non recuperable).
    taxesPaidByTaxRateId: {
      5: { taxRateId: 5, credit: 0, debit: 14 },
      6: { taxRateId: 6, credit: 0, debit: 27.93 },
    },
  });
  const { taxRates, total } = summary.reportData();
  const byName = (name: string) =>
    taxRates.find((t) => t.taxName.startsWith(name))!;

  it('separe la TPS et la TVQ et masque la ligne du groupe', () => {
    expect(taxRates.map((t) => t.taxName)).toEqual([
      'TPS (5%)',
      'TVQ (9.975%)',
    ]);
  });

  it('repartit la base imposable du groupe sur chaque composante', () => {
    expect(byName('TPS').taxableAmount.amount).toBe(1000);
    expect(byName('TVQ').taxableAmount.amount).toBe(1000);
    expect(byName('TPS').taxPercentage.amount).toBeCloseTo(0.05, 5);
    expect(byName('TVQ').taxPercentage.amount).toBeCloseTo(0.09975, 5);
  });

  it('calcule la taxe percue, la taxe payee sur les achats et le net par taxe', () => {
    expect(byName('TPS').taxAmount.amount).toBe(50);
    expect(byName('TPS').paidTaxAmount.amount).toBe(14);
    expect(byName('TPS').netTaxAmount.amount).toBe(36);
    expect(byName('TVQ').taxAmount.amount).toBe(99.75);
    expect(byName('TVQ').paidTaxAmount.amount).toBe(27.93);
    expect(byName('TVQ').netTaxAmount.amount).toBeCloseTo(71.82, 2);
  });

  it('totalise percue, payee et nette', () => {
    expect(total.taxAmount.amount).toBeCloseTo(149.75, 2);
    expect(total.paidTaxAmount.amount).toBeCloseTo(41.93, 2);
    expect(total.netTaxAmount.amount).toBeCloseTo(107.82, 2);
    // Le total de la base ne compte pas deux fois la meme vente (une fois par composante).
    expect(total.taxableAmount.amount).toBe(2000);
  });

  it('affiche une taxe payee sans ventes (credit de taxe net)', () => {
    const only = createSummary({
      taxesPaidByTaxRateId: { 5: { taxRateId: 5, credit: 0, debit: 8.8 } },
    });
    const [tps] = only.reportData().taxRates;
    expect(tps.taxName).toBe('TPS (5%)');
    expect(tps.taxAmount.amount).toBe(0);
    expect(tps.paidTaxAmount.amount).toBe(8.8);
    expect(tps.netTaxAmount.amount).toBe(-8.8);
  });

  it('ne retient pas une taxe payee a zero', () => {
    const none = createSummary({
      taxesPaidByTaxRateId: { 5: { taxRateId: 5, credit: 0, debit: 0 } },
    });
    expect(none.reportData().taxRates).toEqual([]);
  });
});
describe('SalesTaxLiabilitySummaryRepository : taxe payee sur les achats', () => {
  const builder = (result: unknown) => {
    const b: any = {
      whereIn: jest.fn(() => b),
      modify: jest.fn(() => b),
      groupBy: jest.fn(() => b),
      select: jest.fn(() => b),
      sum: jest.fn(() => b),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    };
    return b;
  };

  it('lit les comptes a recevoir (purchase_account_id) des taxes, avec periode et base', async () => {
    const q = builder([
      { accountId: 10, credit: '0.000', debit: '16.080' },
      { accountId: 11, credit: '0.000', debit: '32.070' },
    ]);
    const repo: any = new SalesTaxLiabilitySummaryRepository();
    repo.filter = { fromDate: '2026-11-01', toDate: '2026-11-30' };
    repo.basis = AccountingBasis.Accrual;
    repo.taxRates = TAX_RATES;
    repo.accountTransactionModel = jest.fn(() => ({ query: () => q }));

    const paid = await repo.getTaxesPaidSumGroupedByRateId();

    expect(q.whereIn).toHaveBeenCalledWith('account_id', [10, 11]);
    expect(q.modify).toHaveBeenCalledWith(
      'filterDateRange',
      '2026-11-01',
      '2026-11-30',
    );
    expect(q.modify).toHaveBeenCalledWith(
      'filterByBasis',
      AccountingBasis.Accrual,
    );
    expect(paid[5]).toEqual({ taxRateId: 5, credit: 0, debit: 16.08 });
    expect(paid[6]).toEqual({ taxRateId: 6, credit: 0, debit: 32.07 });
    expect(paid[7]).toBeUndefined(); // un groupe n'a pas de compte propre
  });

  it("ne fait aucune requete si aucune taxe n'a de compte a recevoir", async () => {
    const repo: any = new SalesTaxLiabilitySummaryRepository();
    repo.taxRates = [{ id: 1, name: 'Tax', rate: 10 }];
    repo.accountTransactionModel = jest.fn();
    expect(await repo.getTaxesPaidSumGroupedByRateId()).toEqual({});
    expect(repo.accountTransactionModel).not.toHaveBeenCalled();
  });
});

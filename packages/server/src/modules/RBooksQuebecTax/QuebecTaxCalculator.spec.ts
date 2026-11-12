import {
  aggregateTaxComponentAmounts,
  computeEntryTaxComponents,
  computeLineTaxComponents,
  ITaxComponent,
  parseTaxComponents,
  roundMoney,
  sumTaxComponentAmounts,
} from './QuebecTaxCalculator';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';

const TPS: ITaxComponent = {
  taxRateId: 1,
  code: 'TPS',
  name: 'TPS',
  rate: 5,
  salesAccountId: 11,
  purchaseAccountId: 21,
};
const TVQ: ITaxComponent = {
  taxRateId: 2,
  code: 'TVQ',
  name: 'TVQ',
  rate: 9.975,
  salesAccountId: 12,
  purchaseAccountId: 22,
};
const GROUP = JSON.stringify([TPS, TVQ]);

const entry = (overrides: Record<string, any> = {}) =>
  Object.assign(new ItemEntry(), {
    quantity: 1,
    rate: 100,
    isInclusiveTax: 0,
    taxRate: 14.975,
    taxComponents: GROUP,
    ...overrides,
  });

describe('QuebecTaxCalculator', () => {
  it('rounds half up without floating point noise', () => {
    expect(roundMoney(9.975)).toBe(9.98);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(-9.975)).toBe(-9.98);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('100.00 $ gives TPS 5.00 / TVQ 9.98 / total 114.98', () => {
    const amounts = computeLineTaxComponents(100, [TPS, TVQ], false);
    expect(amounts.map((a) => a.amount)).toEqual([5, 9.98]);
    expect(100 + sumTaxComponentAmounts(amounts)).toBe(114.98);
  });

  it('tax inclusive: 114.98 $ gives base 100.00 with TPS 5.00 / TVQ 9.98', () => {
    const amounts = computeLineTaxComponents(114.98, [TPS, TVQ], true);
    expect(amounts.map((a) => a.amount)).toEqual([5, 9.98]);
    expect(114.98 - sumTaxComponentAmounts(amounts)).toBe(100);
  });

  it('rounds each tax per line and sums the lines', () => {
    const entries = [
      { quantity: 1, rate: 10.1, taxComponents: GROUP },
      { quantity: 3, rate: 3.33, taxComponents: GROUP },
      { quantity: 2, rate: 0.99, taxComponents: GROUP },
    ];
    const totals = aggregateTaxComponentAmounts(entries);
    const tps = totals.find((t) => t.component.code === 'TPS');
    const tvq = totals.find((t) => t.component.code === 'TVQ');
    // Lignes : TPS 0.51 + 0.50 + 0.10 ; TVQ 1.01 + 1.00 + 0.20
    expect(tps.amount).toBe(1.11);
    expect(tvq.amount).toBe(2.21);
  });

  it('ignores lines without components', () => {
    expect(computeEntryTaxComponents({ quantity: 1, rate: 50 })).toEqual([]);
    expect(parseTaxComponents('not json')).toEqual([]);
  });

  it('credit note (negative amount) mirrors the invoice', () => {
    const amounts = computeLineTaxComponents(-100, [TPS, TVQ], false);
    expect(amounts.map((a) => a.amount)).toEqual([-5, -9.98]);
  });

  it('ItemEntry.taxAmount sums the rounded component taxes', () => {
    expect(entry().taxAmount).toBe(14.98);
    expect(entry({ isInclusiveTax: 1, rate: 114.98 }).taxAmount).toBe(14.98);
    expect(
      entry({ isInclusiveTax: 1, rate: 114.98 }).subtotalExcludingTax,
    ).toBeCloseTo(100, 5);
  });

  it('single tax behaviour is unchanged (no components)', () => {
    const single = entry({ taxComponents: null, taxRate: 10, rate: 200 });
    expect(single.taxAmount).toBe(20);
    const inclusive = entry({
      taxComponents: null,
      taxRate: 10,
      rate: 110,
      isInclusiveTax: 1,
    });
    expect(inclusive.taxAmount).toBeCloseTo(10, 10);
  });
});

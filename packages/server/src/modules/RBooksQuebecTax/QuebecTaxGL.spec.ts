import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { InvoiceAccrualGL } from '@/modules/SaleInvoices/ledger/InvoiceAccrualGL';
import { BillGL } from '@/modules/Bills/commands/BillsGL';

const TPS = {
  taxRateId: 1,
  code: 'TPS',
  name: 'TPS',
  rate: 5,
  salesAccountId: 11,
  purchaseAccountId: 21,
};
const TVQ = {
  taxRateId: 2,
  code: 'TVQ',
  name: 'TVQ',
  rate: 9.975,
  salesAccountId: 12,
  purchaseAccountId: 22,
};

const makeEntry = (overrides: Record<string, any> = {}) =>
  Object.assign(new ItemEntry(), {
    id: 1,
    itemId: 10,
    quantity: 1,
    rate: 100,
    isInclusiveTax: 0,
    discount: 0,
    taxRateId: 3,
    taxRate: 14.975,
    taxComponents: JSON.stringify([TPS, TVQ]),
    sellAccountId: 40,
    costAccountId: 50,
    item: { type: 'service' },
    ...overrides,
  });

const sum = (entries: any[], key: 'debit' | 'credit') =>
  entries.reduce((s, e) => s + (e[key] || 0), 0);

describe('Quebec taxes in the general ledger', () => {
  it('invoice: one credit per tax in its own account, balanced', () => {
    const entries = [makeEntry(), makeEntry({ id: 2, rate: 10.1 })];
    const taxAmount = entries.reduce((s, e) => s + e.taxAmount, 0);
    const subtotal = entries.reduce((s, e) => s + e.amount, 0);
    const invoice: any = {
      id: 1,
      exchangeRate: 1,
      currencyCode: 'CAD',
      invoiceDate: '2026-11-01',
      entries,
      totalLocal: subtotal + taxAmount,
      discountAmountLocal: 0,
      adjustmentLocal: 0,
    };
    const gl = new InvoiceAccrualGL(invoice);
    gl.setARAccountId(1);
    gl.setTaxPayableAccountId(99);
    gl.setDiscountAccountId(98);
    gl.setOtherChargesAccountId(97);
    const list = gl.getInvoiceGLEntries();

    const tps = list.filter((e) => e.accountId === 11);
    const tvq = list.filter((e) => e.accountId === 12);
    expect(tps.map((e) => e.credit)).toEqual([5, 0.51]);
    expect(tvq.map((e) => e.credit)).toEqual([9.98, 1.01]);
    expect(tps.every((e) => e.taxRateId === 1 && e.taxRate === 5)).toBe(true);
    expect(tvq.every((e) => e.taxRateId === 2)).toBe(true);
    expect(list.some((e) => e.accountId === 99)).toBe(false);
    expect(Math.abs(sum(list, 'debit') - sum(list, 'credit'))).toBeLessThan(
      0.0001,
    );
  });

  it('invoice: single tax line still goes to the tax payable account', () => {
    const entry = makeEntry({ taxComponents: null, taxRate: 10, taxRateId: 5 });
    const invoice: any = {
      id: 1,
      exchangeRate: 1,
      currencyCode: 'CAD',
      invoiceDate: '2026-11-01',
      entries: [entry],
      totalLocal: 110,
      discountAmountLocal: 0,
      adjustmentLocal: 0,
    };
    const gl = new InvoiceAccrualGL(invoice);
    gl.setARAccountId(1);
    gl.setTaxPayableAccountId(99);
    const list = gl.getInvoiceGLEntries();
    const tax = list.find((e) => e.accountId === 99);
    expect(tax.credit).toBeCloseTo(10, 10);
    expect(tax.taxRateId).toBe(5);
  });

  it('bill: one debit per tax in the receivable (ITC/ITR) accounts, balanced', () => {
    const entry = makeEntry();
    const bill: any = {
      id: 1,
      exchangeRate: 1,
      currencyCode: 'CAD',
      billDate: '2026-11-01',
      entries: [entry],
      totalLocal: 100 + entry.taxAmount,
      discountAmountLocal: 0,
      adjustmentLocal: 0,
    };
    const ledger = new BillGL(bill, [], [])
      .setPayableAccountId(1)
      .setTaxPayableAccountId(99)
      .setPurchaseDiscountAccountId(3)
      .setOtherExpensesAccountId(4)
      .getBillLedger();
    const list = ledger.getEntries();
    expect(list.find((e) => e.accountId === 21).debit).toBe(5);
    expect(list.find((e) => e.accountId === 22).debit).toBe(9.98);
    expect(list.some((e) => e.accountId === 99)).toBe(false);
    expect(Math.abs(sum(list, 'debit') - sum(list, 'credit'))).toBeLessThan(
      0.0001,
    );
  });
});

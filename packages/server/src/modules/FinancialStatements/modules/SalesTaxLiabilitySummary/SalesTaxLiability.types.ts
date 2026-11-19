import {
  IFinancialSheetCommonMeta,
  INumberFormatQuery,
} from '../../types/Report.types';
import { IFinancialTable } from '../../types/Table.types';
import { DateInput } from '@/common/types/Date';
import { AccountingBasis } from '@/common/types/AccountingBasis';

export interface SalesTaxLiabilitySummaryQuery {
  fromDate: DateInput;
  toDate: DateInput;
  basis: AccountingBasis;
  numberFormat?: Partial<INumberFormatQuery>;
}

export interface SalesTaxLiabilitySummaryAmount {
  amount: number;
  formattedAmount: string;
  currencyCode: string;
}

export interface SalesTaxLiabilitySummaryTotal {
  taxableAmount: SalesTaxLiabilitySummaryAmount;
  taxAmount: SalesTaxLiabilitySummaryAmount;
  collectedTaxAmount: SalesTaxLiabilitySummaryAmount;
  /** NBooks : taxe payee sur les achats (CTI/RTI). */
  paidTaxAmount: SalesTaxLiabilitySummaryAmount;
  /** NBooks : taxe nette a remettre = taxe percue - taxe payee sur les achats. */
  netTaxAmount: SalesTaxLiabilitySummaryAmount;
}

export interface SalesTaxLiabilitySummaryRate {
  id: number;
  taxName: string;
  taxableAmount: SalesTaxLiabilitySummaryAmount;
  taxAmount: SalesTaxLiabilitySummaryAmount;
  taxPercentage: any;
  collectedTaxAmount: SalesTaxLiabilitySummaryAmount;
  /** NBooks : taxe payee sur les achats (CTI/RTI). */
  paidTaxAmount: SalesTaxLiabilitySummaryAmount;
  /** NBooks : taxe nette a remettre = taxe percue - taxe payee sur les achats. */
  netTaxAmount: SalesTaxLiabilitySummaryAmount;
}

export enum SalesTaxLiabilitySummaryTableRowType {
  TaxRate = 'TaxRate',
  Total = 'Total',
}

export interface SalesTaxLiabilitySummaryReportData {
  taxRates: SalesTaxLiabilitySummaryRate[];
  total: SalesTaxLiabilitySummaryTotal;
}

export type SalesTaxLiabilitySummaryPayableById = Record<
  string,
  { taxRateId: number; credit: number; debit: number }
>;

/** NBooks : taxe payee sur les achats, par taux de taxe (comptes a recevoir CTI/RTI). */
export type SalesTaxLiabilitySummaryPaidById = Record<
  string,
  { taxRateId: number; credit: number; debit: number }
>;

export type SalesTaxLiabilitySummarySalesById = Record<
  string,
  { taxRateId: number; credit: number; debit: number }
>;

export interface SalesTaxLiabilitySummaryMeta
  extends IFinancialSheetCommonMeta {
  formattedFromDate: string;
  formattedToDate: string;
  formattedDateRange: string;
}

export interface ISalesTaxLiabilitySummaryTable extends IFinancialTable {
  query: SalesTaxLiabilitySummaryQuery;
  meta: SalesTaxLiabilitySummaryMeta;
}

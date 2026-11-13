import { flow } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import { isEmpty, sumBy } from 'lodash';
import {
  SalesTaxLiabilitySummaryQuery,
  SalesTaxLiabilitySummaryRate,
  SalesTaxLiabilitySummaryReportData,
  SalesTaxLiabilitySummaryTotal,
} from './SalesTaxLiability.types';
import { FinancialSheet } from '../../common/FinancialSheet';
import { ModelObject } from 'objection';
import { TaxRateModel } from '@/modules/TaxRates/models/TaxRate.model';
import { SalesTaxLiabilitySummaryRepository } from './SalesTaxLiabilitySummaryRepository';
import {
  IFinancialReportMeta,
  DEFAULT_REPORT_META,
} from '../../types/Report.types';

/**
 * RBooks : identifiants des composantes d'un groupe de taxes (JSON texte ou tableau).
 */
const parseGroupComponentIds = (taxRate: any): number[] => {
  const raw = taxRate?.componentIds;
  if (!raw) return [];
  try {
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(list) ? list.map(Number) : [];
  } catch {
    return [];
  }
};

export class SalesTaxLiabilitySummary extends FinancialSheet {
  private query: SalesTaxLiabilitySummaryQuery;
  private repository: SalesTaxLiabilitySummaryRepository;

  /**
   * Sales tax liability summary constructor.
   * @param {SalesTaxLiabilitySummaryQuery} query
   * @param {SalesTaxLiabilitySummaryRepository} repository
   * @param {IFinancialReportMeta} meta
   */
  constructor(
    query: SalesTaxLiabilitySummaryQuery,
    repository: SalesTaxLiabilitySummaryRepository,
    meta: IFinancialReportMeta,
  ) {
    super();

    this.query = query;
    this.repository = repository;
    this.baseCurrency = meta.baseCurrency;
    this.dateFormat = meta.dateFormat || DEFAULT_REPORT_META.dateFormat;
    this.numberFormat = {
      ...this.numberFormat,
      ...this.query.numberFormat,
    };
  }

  /**
   * Retrieves the tax rate liability node.
   * @param {ITaxRate} taxRate
   * @returns {SalesTaxLiabilitySummaryRate}
   */
  private taxRateLiability = (
    taxRate: ModelObject<TaxRateModel>,
  ): SalesTaxLiabilitySummaryRate => {
    const payableTax = this.repository.taxesPayableByTaxRateId[taxRate.id];

    const payableTaxAmount = payableTax
      ? payableTax.credit - payableTax.debit
      : 0;
    const salesTaxAmount = this.getTaxableSalesAmount(taxRate);

    // RBooks : taxe payee sur les achats (CTI/RTI) et taxe nette a remettre.
    const paidTax = this.repository.taxesPaidByTaxRateId?.[taxRate.id];
    const paidTaxAmount = paidTax ? paidTax.debit - paidTax.credit : 0;
    const netTaxAmount = payableTaxAmount - paidTaxAmount;

    // Calculates the tax percentage.
    const taxPercentage = this.getPercentageBasis(
      salesTaxAmount,
      payableTaxAmount,
    );

    // Calculates the payable tax amount.
    const collectedTaxAmount = payableTax ? payableTax.debit : 0;

    return {
      id: taxRate.id,
      taxName: `${taxRate.name} (${taxRate.rate}%)`,
      taxableAmount: this.getAmountMeta(salesTaxAmount),
      taxAmount: this.getAmountMeta(payableTaxAmount),
      taxPercentage: this.getPercentageTotalAmountMeta(taxPercentage),
      collectedTaxAmount: this.getAmountMeta(collectedTaxAmount),
      paidTaxAmount: this.getAmountMeta(paidTaxAmount),
      netTaxAmount: this.getAmountMeta(netTaxAmount),
    };
  };

  /**
   * RBooks : montant imposable d'une taxe. Une ligne taxee par un groupe (TPS + TVQ)
   * porte l'identifiant du groupe : la base est rattachee a chacune de ses composantes.
   * @param {ModelObject<TaxRateModel>} taxRate
   * @returns {number}
   */
  private getTaxableSalesAmount = (
    taxRate: ModelObject<TaxRateModel>,
  ): number => {
    const sales = this.repository.accountTransactionsByTaxRateId;
    const net = (id: number) =>
      sales[id] ? Number(sales[id].credit) - Number(sales[id].debit) : 0;

    const groups = (this.repository.taxRates || []).filter(
      (group: any) =>
        group.isGroup && parseGroupComponentIds(group).includes(taxRate.id),
    );
    return groups.reduce(
      (total, group) => total + net(group.id),
      net(taxRate.id),
    );
  };

  /**
   * Filters the non-transactions tax rates.
   * @param {SalesTaxLiabilitySummaryRate[]} nodes
   * @returns {SalesTaxLiabilitySummaryRate[]}
   */
  private filterNonTransactionsTaxRates = (
    nodes: SalesTaxLiabilitySummaryRate[],
  ): SalesTaxLiabilitySummaryRate[] => {
    return nodes.filter((node) => {
      const salesTrxs = this.repository.accountTransactionsByTaxRateId[node.id];
      const payableTrxs = this.repository.taxesPayableByTaxRateId[node.id];
      const paidTrxs = this.repository.taxesPaidByTaxRateId?.[node.id];

      return (
        !isEmpty(salesTrxs) ||
        !isEmpty(payableTrxs) ||
        (!isEmpty(paidTrxs) && (paidTrxs.debit !== 0 || paidTrxs.credit !== 0))
      );
    });
  };

  /**
   * Retrieves the tax rates liability nodes.
   * @returns {SalesTaxLiabilitySummaryRate[]}
   */
  private taxRatesLiability = (): SalesTaxLiabilitySummaryRate[] => {
    // RBooks : les groupes (TPS + TVQ) n'ont pas de ligne propre : leur base et leurs
    // montants sont repartis sur leurs composantes (TPS, TVQ).
    const taxRates = this.repository.taxRates.filter(
      (taxRate: any) =>
        !(taxRate.isGroup && parseGroupComponentIds(taxRate).length),
    );
    return flow(
      A.map(this.taxRateLiability),
      this.filterNonTransactionsTaxRates,
    )(taxRates);
  };

  /**
   * Retrieves the tax rates total node.
   * @param {SalesTaxLiabilitySummaryRate[]} nodes
   * @returns {SalesTaxLiabilitySummaryTotal}
   */
  private taxRatesTotal = (
    nodes: SalesTaxLiabilitySummaryRate[],
  ): SalesTaxLiabilitySummaryTotal => {
    const taxableAmount = sumBy(nodes, 'taxableAmount.amount');
    const taxAmount = sumBy(nodes, 'taxAmount.amount');
    const collectedTaxAmount = sumBy(nodes, 'collectedTaxAmount.amount');
    const paidTaxAmount = sumBy(nodes, 'paidTaxAmount.amount');
    const netTaxAmount = sumBy(nodes, 'netTaxAmount.amount');

    return {
      taxableAmount: this.getTotalAmountMeta(taxableAmount),
      taxAmount: this.getTotalAmountMeta(taxAmount),
      collectedTaxAmount: this.getTotalAmountMeta(collectedTaxAmount),
      paidTaxAmount: this.getTotalAmountMeta(paidTaxAmount),
      netTaxAmount: this.getTotalAmountMeta(netTaxAmount),
    };
  };

  /**
   * Retrieves the report data.
   * @returns {SalesTaxLiabilitySummaryReportData}
   */
  public reportData = (): SalesTaxLiabilitySummaryReportData => {
    const taxRates = this.taxRatesLiability();
    const total = this.taxRatesTotal(taxRates);

    return { taxRates, total };
  };
}

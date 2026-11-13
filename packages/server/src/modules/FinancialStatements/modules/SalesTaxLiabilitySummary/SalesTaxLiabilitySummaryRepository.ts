import { ACCOUNT_TYPE } from '@/constants/accounts';
import {
  SalesTaxLiabilitySummaryPaidById,
  SalesTaxLiabilitySummaryPayableById,
  SalesTaxLiabilitySummaryQuery,
  SalesTaxLiabilitySummarySalesById,
} from './SalesTaxLiability.types';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { keyBy, uniq } from 'lodash';
import { TaxRateModel } from '@/modules/TaxRates/models/TaxRate.model';
import { AccountTransaction } from '@/modules/Accounts/models/AccountTransaction.model';
import { Account } from '@/modules/Accounts/models/Account.model';
import { ModelObject } from 'objection';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { AccountingBasis } from '@/common/types/AccountingBasis';
import { AccountingBasisService } from '../../common/AccountingBasisService';

@Injectable({ scope: Scope.TRANSIENT })
export class SalesTaxLiabilitySummaryRepository {
  @Inject(TaxRateModel.name)
  private readonly taxRateModel: TenantModelProxy<typeof TaxRateModel>;

  @Inject(AccountTransaction.name)
  private readonly accountTransactionModel: TenantModelProxy<
    typeof AccountTransaction
  >;

  @Inject(Account.name)
  private readonly accountModel: TenantModelProxy<typeof Account>;

  @Inject(AccountingBasisService)
  private readonly accountingBasisService: AccountingBasisService;

  /**
   * The report accounting basis.
   * @param {AccountingBasis}
   */
  basis: AccountingBasis;

  /**
   * @param {SalesTaxLiabilitySummarySalesById}
   */
  accountTransactionsByTaxRateId: SalesTaxLiabilitySummarySalesById;

  /**
   * @param {SalesTaxLiabilitySummaryPayableById}
   */
  taxesPayableByTaxRateId: SalesTaxLiabilitySummaryPayableById;

  /**
   * RBooks : taxe payee sur les achats (comptes a recevoir CTI/RTI) par taux.
   * @param {SalesTaxLiabilitySummaryPaidById}
   */
  taxesPaidByTaxRateId: SalesTaxLiabilitySummaryPaidById = {};

  /**
   * @param {Array<ModelObject<TaxRateModel>>}
   */
  taxRates: Array<ModelObject<TaxRateModel>>;

  /**
   * @param {SalesTaxLiabilitySummaryQuery}
   */
  filter: SalesTaxLiabilitySummaryQuery;

  /**
   * Load data.
   * @param {SalesTaxLiabilitySummaryQuery} filter
   */
  async load(filter: SalesTaxLiabilitySummaryQuery) {
    this.filter = filter;

    await this.initAccountingBasis();
    await this.initTaxRates();
    await this.initTaxesPayableByTaxRateId();
    await this.initAccountTransactionsByTaxRateId();
    await this.initTaxesPaidByTaxRateId();
  }

  /**
   * RBooks : initialise la taxe payee sur les achats par taux.
   */
  async initTaxesPaidByTaxRateId() {
    this.taxesPaidByTaxRateId = await this.getTaxesPaidSumGroupedByRateId();
  }

  /**
   * RBooks : taxe payee sur les achats (CTI/RTI), par taux de taxe.
   * Lit le compte purchase_account_id de chaque taxe (TPS a recevoir, TVQ a recevoir) :
   * inclut donc les factures fournisseurs avec taxes ET les lignes imputees directement
   * a ces comptes (factures capturees).
   * @returns {Promise<SalesTaxLiabilitySummaryPaidById>}
   */
  public async getTaxesPaidSumGroupedByRateId(): Promise<SalesTaxLiabilitySummaryPaidById> {
    const withPurchaseAccount = (this.taxRates || []).filter(
      (taxRate: any) => taxRate.purchaseAccountId && !taxRate.isGroup,
    );
    const accountsIds = uniq(
      withPurchaseAccount.map((taxRate: any) => taxRate.purchaseAccountId),
    );
    if (!accountsIds.length) return {};

    const groupedByAccount = await this.accountTransactionModel()
      .query()
      .whereIn('account_id', accountsIds)
      .modify('filterDateRange', this.filter.fromDate, this.filter.toDate)
      .modify('filterByBasis', this.basis)
      .groupBy('account_id')
      .select(['account_id'])
      .sum('credit as credit')
      .sum('debit as debit');

    const byAccountId = keyBy(groupedByAccount, 'accountId');

    return withPurchaseAccount.reduce((acc, taxRate: any) => {
      const found = byAccountId[taxRate.purchaseAccountId] as any;
      acc[taxRate.id] = {
        taxRateId: taxRate.id,
        credit: Number(found?.credit ?? 0),
        debit: Number(found?.debit ?? 0),
      };
      return acc;
    }, {} as SalesTaxLiabilitySummaryPaidById);
  }

  /**
   * Initialize the default accounting basis.
   */
  async initAccountingBasis() {
    this.basis = await this.accountingBasisService.resolve(this.filter.basis);
  }

  /**
   * Initialize tax rates.
   */
  async initTaxRates() {
    const taxRates = await this.getTaxRates();
    this.taxRates = taxRates;
  }

  /**
   * Initialize account transactions by tax rate id.
   */
  async initAccountTransactionsByTaxRateId() {
    const transactionsByTaxRateId = await this.taxesSalesSumGroupedByRateId();

    this.accountTransactionsByTaxRateId = transactionsByTaxRateId;
  }

  /**
   * Initialize taxes payable by tax rate id.
   */
  async initTaxesPayableByTaxRateId() {
    const payableTaxes = await this.getTaxesPayableSumGroupedByRateId();

    this.taxesPayableByTaxRateId = payableTaxes;
  }

  /**
   * Retrieve tax rates.
   * @param {number} tenantId
   * @returns {Promise<TaxRate[]>}
   */
  public getTaxRates = () => {
    return this.taxRateModel().query().orderBy('name', 'desc');
  };

  /**
   * Retrieve taxes payable sum grouped by tax rate id.
   * @returns {Promise<SalesTaxLiabilitySummaryPayableById>}
   */
  public async getTaxesPayableSumGroupedByRateId(): Promise<SalesTaxLiabilitySummaryPayableById> {
    // Retrieves tax payable accounts.
    const taxPayableAccounts = await this.accountModel()
      .query()
      .whereIn('accountType', [ACCOUNT_TYPE.TAX_PAYABLE]);

    const payableAccountsIds = taxPayableAccounts.map((account) => account.id);

    const groupedTaxesById = await this.accountTransactionModel()
      .query()
      .whereIn('account_id', payableAccountsIds)
      .whereNot('tax_rate_id', null)
      .modify('filterDateRange', this.filter.fromDate, this.filter.toDate)
      .modify('filterByBasis', this.basis)
      .groupBy('tax_rate_id')
      .select(['tax_rate_id'])
      .sum('credit as credit')
      .sum('debit as debit');

    return keyBy(groupedTaxesById, 'taxRateId');
  }

  /**
   * Retrieve taxes sales sum grouped by tax rate id.
   * @returns {Promise<SalesTaxLiabilitySummarySalesById>}
   */
  public taxesSalesSumGroupedByRateId =
    async (): Promise<SalesTaxLiabilitySummarySalesById> => {
      const incomeAccounts = await this.accountModel()
        .query()
        .whereIn('accountType', [
          ACCOUNT_TYPE.INCOME,
          ACCOUNT_TYPE.OTHER_INCOME,
        ]);
      const incomeAccountsIds = incomeAccounts.map((account) => account.id);

      const groupedTaxesById = await this.accountTransactionModel()
        .query()
        .whereIn('account_id', incomeAccountsIds)
        .whereNot('tax_rate_id', null)
        .modify('filterDateRange', this.filter.fromDate, this.filter.toDate)
        .modify('filterByBasis', this.basis)
        .groupBy('tax_rate_id')
        .select(['tax_rate_id'])
        .sum('credit as credit')
        .sum('debit as debit');

      return keyBy(groupedTaxesById, 'taxRateId');
    };
}

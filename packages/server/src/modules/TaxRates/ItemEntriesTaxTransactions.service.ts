import { Inject, Injectable } from '@nestjs/common';
import { keyBy, sumBy } from 'lodash';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { TaxRateModel } from './models/TaxRate.model';
import { TenantModelProxy } from '../System/models/TenantBaseModel';
import { FeaturesManager } from '../Features/FeaturesManager';
import { Features } from '@/common/types/Features';

const parseComponentIds = (raw: any): number[] => {
  if (!raw) return [];
  try {
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(list) ? list.map(Number) : [];
  } catch {
    return [];
  }
};

@Injectable()
export class ItemEntriesTaxTransactions {
  constructor(
    @Inject(ItemEntry.name)
    private itemEntryModel: TenantModelProxy<typeof ItemEntry>,

    @Inject(TaxRateModel.name)
    private taxRateModel: TenantModelProxy<typeof TaxRateModel>,

    private readonly featuresManager: FeaturesManager,
  ) {}

  /**
   * Associates tax amount withheld to the model.
   * @param model
   * @returns
   */
  public assocTaxAmountWithheldFromEntries = (model: any) => {
    const entries = model.entries.map((entry) =>
      this.itemEntryModel().fromJson(entry),
    );
    const taxAmountWithheld = sumBy(entries, 'taxAmount');

    if (taxAmountWithheld) {
      model.taxAmountWithheld = taxAmountWithheld;
    }
    return model;
  };

  /**
   * Associates tax rate id from tax code to entries.
   * @param {any} entries
   */
  public assocTaxRateIdFromCodeToEntries = async (entries: any) => {
    const isSalesTaxEnabled = await this.featuresManager.accessible(
      Features.SALES_TAX,
    );
    if (!isSalesTaxEnabled) return entries;

    const entriesWithCode = entries.filter((entry) => entry.taxCode);
    const taxCodes = entriesWithCode.map((entry) => entry.taxCode);
    const foundTaxCodes = await this.taxRateModel()
      .query()
      .whereIn('code', taxCodes);

    const taxCodesMap = keyBy(foundTaxCodes, 'code');

    return entries.map((entry) => {
      if (entry.taxCode) {
        entry.taxRateId = taxCodesMap[entry.taxCode]?.id;
      }
      return entry;
    });
  };

  /**
   * Associates tax rate from tax id to entries.
   * @returns {Promise<ItemEntry[]>}
   */
  public assocTaxRateFromTaxIdToEntries = async (entries: ItemEntry[]) => {
    const isSalesTaxEnabled = await this.featuresManager.accessible(
      Features.SALES_TAX,
    );
    if (!isSalesTaxEnabled) return entries;

    const entriesWithId = entries.filter((e) => e.taxRateId);
    const taxRateIds = entriesWithId.map((e) => e.taxRateId);
    const foundTaxes = await this.taxRateModel()
      .query()
      .whereIn('id', taxRateIds);

    const taxRatesMap = keyBy(foundTaxes, 'id');

    // RBooks : charge les composantes des groupes de taxes (ex. TPS + TVQ).
    const groupComponentIds = foundTaxes
      .filter((t: any) => t.isGroup)
      .flatMap((t: any) => parseComponentIds(t.componentIds));
    const componentTaxes = groupComponentIds.length
      ? await this.taxRateModel().query().whereIn('id', groupComponentIds)
      : [];
    const componentsMap = keyBy(componentTaxes, 'id');

    return entries.map((entry) => {
      if (entry.taxRateId) {
        const tax: any = taxRatesMap[entry.taxRateId];

        if (tax?.isGroup) {
          const components = parseComponentIds(tax.componentIds)
            .map((id) => componentsMap[id] as any)
            .filter(Boolean)
            .map((c) => ({
              taxRateId: c.id,
              code: c.code,
              name: c.name,
              rate: Number(c.rate),
              salesAccountId: c.salesAccountId ?? null,
              purchaseAccountId: c.purchaseAccountId ?? null,
              registrationNo: c.registrationNo ?? null,
            }));
          entry.taxRate = components.reduce((s, c) => s + c.rate, 0);
          entry.taxComponents = JSON.stringify(components);
        } else {
          entry.taxRate = tax?.rate;
          entry.taxComponents = null;
        }
      }
      return entry;
    });
  };
}

import { TenantSeeder } from '@/libs/migration-seed/TenantSeeder';

/**
 * RBooks : pour une organisation en CAD, cree les 4 comptes de taxe
 * (TPS/TVQ a payer, TPS/TVQ a recevoir), les taux TPS 5 % et TVQ 9,975 % et le
 * groupe « TPS + TVQ ».
 */
export default class SeedQuebecTaxes extends TenantSeeder {
  async up(knex) {
    const currency = this.tenant?.metadata?.baseCurrency;
    if (currency !== 'CAD') return;

    const common = {
      description: '',
      active: 1,
      index: 1,
      predefined: 0,
      currencyCode: currency,
      seededAt: new Date(),
      parent_account_id: null,
    };
    const accounts = [
      {
        name: 'TPS à payer',
        slug: 'tps-a-payer',
        account_type: 'tax-payable',
        code: '20007',
      },
      {
        name: 'TVQ à payer',
        slug: 'tvq-a-payer',
        account_type: 'tax-payable',
        code: '20008',
      },
      {
        name: 'TPS à recevoir (CTI)',
        slug: 'tps-a-recevoir-cti',
        account_type: 'other-current-asset',
        code: '10011',
      },
      {
        name: 'TVQ à recevoir (RTI)',
        slug: 'tvq-a-recevoir-rti',
        account_type: 'other-current-asset',
        code: '10012',
      },
    ];
    const ids: Record<string, number> = {};
    for (const account of accounts) {
      const [id] = await knex('accounts').insert({ ...common, ...account });
      ids[account.slug] = id;
    }

    const [tpsId] = await knex('tax_rates').insert({
      name: 'TPS',
      code: 'TPS',
      description: 'Taxe sur les produits et services (5 %)',
      rate: 5,
      active: 1,
      is_group: 0,
      sales_account_id: ids['tps-a-payer'],
      purchase_account_id: ids['tps-a-recevoir-cti'],
    });
    const [tvqId] = await knex('tax_rates').insert({
      name: 'TVQ',
      code: 'TVQ',
      description: 'Taxe de vente du Québec (9,975 %)',
      rate: 9.975,
      active: 1,
      is_group: 0,
      sales_account_id: ids['tvq-a-payer'],
      purchase_account_id: ids['tvq-a-recevoir-rti'],
    });
    await knex('tax_rates').insert({
      name: 'TPS + TVQ',
      code: 'TPS-TVQ',
      description: 'TPS 5 % et TVQ 9,975 % sur la même ligne',
      rate: 14.975,
      active: 1,
      is_group: 1,
      component_ids: JSON.stringify([tpsId, tvqId]),
    });
  }
}

import { TenantSeeder } from '@/libs/migration-seed/TenantSeeder';
import { AccountsData } from '../data/accounts';
import { QuebecAccountsData } from '../data/accountsQuebec';
import { shouldUseQuebecChart } from '@/modules/RBooksQuebecTax/quebecChart';

export default class SeedAccounts extends TenantSeeder {
  /**
   * Seeds initial accounts to the organization.
   */
  up(knex) {
    // RBooks : plan comptable du Quebec (noms deja en francais) pour une organisation
    // fr-CA / CA-QC ; sinon plan Bigcapital traduit selon la langue.
    const isQuebec = shouldUseQuebecChart(this.tenant?.metadata);
    const data = isQuebec
      ? QuebecAccountsData.map((account) => ({
          ...account,
          active: 1,
          index: 1,
          currencyCode: this.tenant.metadata.baseCurrency,
          seededAt: new Date(),
        }))
      : AccountsData.map((account) => ({
          ...account,
          name: this.i18n.t(account.name),
          description: account.description
            ? this.i18n.t(account.description)
            : '',
          currencyCode: this.tenant.metadata.baseCurrency,
          seededAt: new Date(),
        }));
    return knex('accounts').then(async () => {
      // Inserts seed entries.
      return knex('accounts').insert(data);
    });
  }
}

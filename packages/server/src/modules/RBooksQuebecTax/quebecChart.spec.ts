import { shouldUseQuebecChart } from './quebecChart';
import { QuebecAccountsData } from '@/database/tenant/seeds/data/accountsQuebec';
import { AccountsData } from '@/database/tenant/seeds/data/accounts';
import { ACCOUNT_TYPE } from '@/constants/accounts';

describe('NBooks : plan comptable du Quebec', () => {
  describe('choix de la variante', () => {
    it('utilise le plan QC pour fr-CA, CA-QC, fr + CAD', () => {
      expect(shouldUseQuebecChart({ language: 'fr-CA' })).toBe(true);
      expect(shouldUseQuebecChart({ language: 'fr_CA' })).toBe(true);
      expect(shouldUseQuebecChart({ language: 'en', location: 'CA-QC' })).toBe(
        true,
      );
      expect(
        shouldUseQuebecChart({ language: 'fr', baseCurrency: 'CAD' }),
      ).toBe(true);
      expect(shouldUseQuebecChart({ language: 'fr', location: 'CA' })).toBe(
        true,
      );
      expect(
        shouldUseQuebecChart({
          language: 'en',
          location: 'CA',
          address: { stateProvince: 'Québec' },
        }),
      ).toBe(true);
    });

    it('garde le plan anglais Bigcapital sinon', () => {
      expect(shouldUseQuebecChart(undefined)).toBe(false);
      expect(
        shouldUseQuebecChart({
          language: 'en',
          baseCurrency: 'CAD',
          location: 'CA',
        }),
      ).toBe(false);
      expect(
        shouldUseQuebecChart({
          language: 'en',
          baseCurrency: 'USD',
          location: 'US',
        }),
      ).toBe(false);
      expect(
        shouldUseQuebecChart({
          language: 'fr',
          baseCurrency: 'EUR',
          location: 'FR',
        }),
      ).toBe(false);
      expect(
        shouldUseQuebecChart({
          language: 'en',
          location: 'CA',
          address: { stateProvince: 'Ontario' },
        }),
      ).toBe(false);
    });
  });

  describe('donnees du plan', () => {
    const slugs = QuebecAccountsData.map((a) => a.slug);
    const codes = QuebecAccountsData.map((a) => a.code);

    it("n'a ni slug ni code en double", () => {
      expect(new Set(slugs).size).toBe(slugs.length);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('a des codes numeriques a 4 chiffres, coherents avec le type', () => {
      const root = (type: string) => {
        if (
          [
            'bank',
            'cash',
            'accounts-receivable',
            'inventory',
            'other-current-asset',
            'fixed-asset',
            'non-current-asset',
          ].includes(type)
        )
          return '1';
        if (
          [
            'accounts-payable',
            'credit-card',
            'tax-payable',
            'other-current-liability',
            'long-term-liability',
            'non-current-liability',
          ].includes(type)
        )
          return '2';
        if (type === 'equity') return '3';
        if (['income', 'other-income'].includes(type)) return '4';
        return '5'; // charges
      };
      QuebecAccountsData.forEach((a) => {
        expect(a.code).toMatch(/^\d{4}$/);
        const first = a.code[0];
        if (a.account_type === 'other-expense' || a.slug === 'discount') return; // 6xxx
        expect([root(a.account_type)]).toContain(first);
      });
    });

    it('conserve tous les slugs systeme du plan Bigcapital (sauf le doublon owner-drawings)', () => {
      const upstream = Array.from(
        new Set(AccountsData.map((a: any) => a.slug)),
      );
      upstream.forEach((slug) => expect(slugs).toContain(slug));
    });

    it('utilise des types de compte valides', () => {
      const valid = Object.values(ACCOUNT_TYPE) as string[];
      QuebecAccountsData.forEach((a) =>
        expect(valid).toContain(a.account_type),
      );
    });

    it('contient les comptes de taxes de la tache 02 (memes slugs, une seule fois)', () => {
      [
        'tps-a-payer',
        'tvq-a-payer',
        'tps-a-recevoir-cti',
        'tvq-a-recevoir-rti',
      ].forEach((s) => expect(slugs.filter((x) => x === s)).toHaveLength(1));
      const byslug = Object.fromEntries(
        QuebecAccountsData.map((a) => [a.slug, a]),
      );
      expect(byslug['tps-a-payer'].account_type).toBe('tax-payable');
      expect(byslug['tvq-a-recevoir-rti'].account_type).toBe(
        'other-current-asset',
      );
    });

    it('contient les retenues, cotisations et salaires', () => {
      const names = QuebecAccountsData.map((a) => a.name);
      [
        'Retenues à la source à payer - fédéral',
        'Retenues à la source à payer - Québec',
        'RRQ à payer',
        'RQAP à payer',
        'AE à payer',
        'FSS à payer',
        'CNESST à payer',
        'Salaires à payer',
      ].forEach((n) => expect(names).toContain(n));
    });

    it('aligne les charges sur les categories de la capture (code et nom)', () => {
      const categories: Array<[string, string]> = [
        ['5910', 'À classer — épicerie'],
        ['5100', 'Carburant'],
        ['5110', 'Entretien véhicule'],
        ['5120', 'Stationnement & péages'],
        ['5200', 'Repas & représentation'],
        ['5300', 'Déplacements & hébergement'],
        ['5400', 'Fournitures de bureau'],
        ['5410', 'Matériel, outillage & équipement'],
        ['5420', 'Informatique & électronique'],
        ['5500', 'Logiciels & abonnements'],
        ['5600', 'Télécommunications'],
        ['5700', 'Formation & congrès'],
        ['5800', 'Santé & avantages employés'],
        ['5900', 'À classer'],
      ];
      categories.forEach(([code, name]) => {
        const acc = QuebecAccountsData.find((a) => a.code === code);
        expect(acc).toBeDefined();
        expect(acc!.name).toBe(name);
        expect(acc!.account_type).toBe('expense');
      });
    });
  });
});

/**
 * RBooks : plan comptable par defaut du Quebec (francais), utilise a la creation d'une
 * organisation quand la langue est le francais canadien ou le pays/province est CA-QC
 * (voir `modules/RBooksQuebecTax/quebecChart.ts`). Le plan anglais (`accounts.ts`) est inchange.
 *
 * - Codes a 4 chiffres : 1xxx actifs, 2xxx passifs, 3xxx capitaux propres, 4xxx revenus, 5xxx charges.
 * - Les `slug` de Bigcapital (bank-account, accounts-receivable, tax-payable, ...) sont conserves :
 *   le code s'en sert pour retrouver les comptes systeme.
 * - Les comptes de taxes reprennent ceux de la tache 02 (memes slugs : tps-a-payer, tvq-a-payer,
 *   tps-a-recevoir-cti, tvq-a-recevoir-rti). La semence des taxes (20261112130200) les retrouve
 *   par slug au lieu de les recreer : aucun doublon.
 * - Les comptes de charges 5100 a 5910 portent les memes codes et noms que les categories de
 *   l'app de capture (data/categories.json de rbooks-capture).
 * - Les noms sont directement en francais (pas de cle de traduction).
 *
 * LISTE A VALIDER PAR UN CPA avant usage reel (voir docs/rbooks/PLAN-COMPTABLE-QC.md).
 */
type Seed = {
  name: string;
  slug: string;
  account_type: string;
  code: string;
  description?: string;
  predefined?: number;
};

const a = (
  code: string,
  name: string,
  account_type: string,
  slug: string,
  predefined = 0,
  description = '',
): Seed => ({ code, name, account_type, slug, predefined, description });

export const QuebecAccountsData: Seed[] = [
  // ---- Actifs ----
  a('1010', 'Compte bancaire', 'bank', 'bank-account', 1),
  a('1020', "Compte d'épargne", 'bank', 'saving-bank-account'),
  a('1030', 'Fonds non déposés', 'cash', 'undeposited-funds', 1),
  a('1040', 'Petite caisse', 'cash', 'petty-cash', 1),
  a('1100', 'Comptes clients', 'accounts-receivable', 'accounts-receivable', 1),
  a(
    '1150',
    'Stocks (inventaire)',
    'inventory',
    'inventory-asset',
    1,
    'Valeur des produits disponibles pour la vente.',
  ),
  a(
    '1190',
    "Charges payées d'avance",
    'other-current-asset',
    'prepaid-expenses',
    1,
  ),
  a(
    '1195',
    'Compte de transit Stripe',
    'other-current-asset',
    'stripe-clearing',
    1,
  ),
  a(
    '1210',
    'TPS à recevoir (CTI)',
    'other-current-asset',
    'tps-a-recevoir-cti',
    0,
    'Crédits de taxe sur les intrants (TPS payée sur les achats).',
  ),
  a(
    '1220',
    'TVQ à recevoir (RTI)',
    'other-current-asset',
    'tvq-a-recevoir-rti',
    0,
    'Remboursements de la taxe sur les intrants (TVQ payée sur les achats).',
  ),
  a('1500', 'Équipement informatique', 'fixed-asset', 'computer-equipment'),
  a('1510', 'Équipement de bureau', 'fixed-asset', 'office-equipment'),
  a('1520', 'Véhicules', 'fixed-asset', 'vehicles'),
  a('1590', 'Amortissement cumulé', 'fixed-asset', 'accumulated-depreciation'),

  // ---- Passifs ----
  a('2010', 'Comptes fournisseurs', 'accounts-payable', 'accounts-payable', 1),
  a('2020', 'Carte de crédit', 'credit-card', 'credit-card'),
  a(
    '2100',
    'TPS à payer',
    'tax-payable',
    'tps-a-payer',
    0,
    'TPS perçue sur les ventes.',
  ),
  a(
    '2110',
    'TVQ à payer',
    'tax-payable',
    'tvq-a-payer',
    0,
    'TVQ perçue sur les ventes.',
  ),
  a('2120', 'Taxes à payer (non ventilées)', 'tax-payable', 'tax-payable', 1),
  a(
    '2150',
    'Comptes de dépenses à rembourser',
    'other-current-liability',
    'expense-claims-payable',
    0,
    'Dépenses payées personnellement par un employé ou un actionnaire.',
  ),
  a(
    '2200',
    'Retenues à la source à payer - fédéral',
    'other-current-liability',
    'retenues-source-federal',
    0,
    "Impôt fédéral retenu sur la paie, à remettre à l'ARC.",
  ),
  a(
    '2210',
    'Retenues à la source à payer - Québec',
    'other-current-liability',
    'retenues-source-quebec',
    0,
    'Impôt du Québec retenu sur la paie, à remettre à Revenu Québec.',
  ),
  a(
    '2220',
    'RRQ à payer',
    'other-current-liability',
    'rrq-a-payer',
    0,
    "Cotisations au Régime de rentes du Québec (part de l'employé et de l'employeur).",
  ),
  a(
    '2230',
    'RQAP à payer',
    'other-current-liability',
    'rqap-a-payer',
    0,
    "Cotisations au Régime québécois d'assurance parentale.",
  ),
  a(
    '2240',
    'AE à payer',
    'other-current-liability',
    'ae-a-payer',
    0,
    "Cotisations à l'assurance-emploi.",
  ),
  a(
    '2250',
    'FSS à payer',
    'other-current-liability',
    'fss-a-payer',
    0,
    'Contribution au Fonds des services de santé.',
  ),
  a(
    '2260',
    'CNESST à payer',
    'other-current-liability',
    'cnesst-a-payer',
    0,
    'Cotisations à la CNESST.',
  ),
  a('2270', 'Salaires à payer', 'other-current-liability', 'salaires-a-payer'),
  a('2280', 'Vacances à payer', 'other-current-liability', 'vacances-a-payer'),
  a(
    '2300',
    "Revenus reçus d'avance",
    'other-current-liability',
    'revenue-received-in-advance',
    0,
    'Montants payés à l’avance par les clients pour des produits ou services.',
  ),
  a(
    '2310',
    "Revenus perçus d'avance",
    'other-current-liability',
    'unearned-revenue',
    1,
  ),
  a(
    '2400',
    "Comptes de l'actionnaire",
    'other-current-liability',
    'owner-drawings',
  ),
  a('2500', 'Emprunt bancaire', 'long-term-liability', 'loan'),
  a(
    '2900',
    "Soldes d'ouverture des passifs",
    'other-current-liability',
    'opening-balance-liabilities',
  ),

  // ---- Capitaux propres ----
  a('3010', 'Capital-actions', 'equity', 'owner-equity', 1),
  a('3020', 'Dividendes et retraits', 'equity', 'drawings', 1),
  a('3100', 'Bénéfices non répartis', 'equity', 'retained-earnings', 1),
  a(
    '3900',
    "Solde d'ouverture des capitaux propres",
    'equity',
    'opening-balance-equity',
    1,
  ),

  // ---- Revenus ----
  a('4010', 'Ventes de produits', 'income', 'sales-of-product-income', 1),
  a('4020', 'Revenus de services', 'income', 'sales-of-service-income'),
  a('4090', 'Revenus non classés', 'income', 'uncategorized-income', 1),
  a('4100', 'Autres revenus', 'other-income', 'other-income'),
  a('4110', 'Frais divers facturés', 'other-income', 'other-charges', 1),

  // ---- Coût des ventes et charges (5100 a 5910 : mêmes codes que la capture) ----
  a(
    '5000',
    'Coût des marchandises vendues',
    'cost-of-goods-sold',
    'cost-of-goods-sold',
    1,
  ),
  a('5010', 'Salaires et traitements', 'expense', 'salaires-traitements'),
  a(
    '5020',
    "Charges sociales de l'employeur",
    'expense',
    'charges-sociales-employeur',
    0,
    "RRQ, RQAP, AE, FSS et CNESST - part de l'employeur.",
  ),
  a('5050', 'Loyer', 'expense', 'rent'),
  a('5060', 'Assurances', 'expense', 'assurances'),
  a(
    '5070',
    'Services publics (électricité, chauffage)',
    'expense',
    'services-publics',
  ),
  a(
    '5080',
    'Honoraires professionnels',
    'expense',
    'honoraires-professionnels',
  ),
  a('5090', 'Publicité et promotion', 'expense', 'publicite-promotion'),
  a('5100', 'Carburant', 'expense', 'carburant'),
  a('5110', 'Entretien véhicule', 'expense', 'entretien-vehicule'),
  a('5120', 'Stationnement & péages', 'expense', 'stationnement-peages'),
  a('5200', 'Repas & représentation', 'expense', 'repas-representation'),
  a(
    '5300',
    'Déplacements & hébergement',
    'expense',
    'deplacements-hebergement',
  ),
  a('5400', 'Fournitures de bureau', 'expense', 'office-expenses'),
  a(
    '5410',
    'Matériel, outillage & équipement',
    'expense',
    'materiel-outillage-equipement',
  ),
  a(
    '5420',
    'Informatique & électronique',
    'expense',
    'informatique-electronique',
  ),
  a('5500', 'Logiciels & abonnements', 'expense', 'logiciels-abonnements'),
  a('5600', 'Télécommunications', 'expense', 'telecommunications'),
  a('5700', 'Formation & congrès', 'expense', 'formation-congres'),
  a(
    '5800',
    'Santé & avantages employés',
    'expense',
    'sante-avantages-employes',
  ),
  a('5900', 'À classer', 'expense', 'a-classer'),
  a('5910', 'À classer — épicerie', 'expense', 'a-classer-epicerie'),
  a('5950', 'Frais bancaires', 'expense', 'bank-fees-and-charges'),
  a('5970', 'Amortissement', 'expense', 'depreciation-expense'),

  // ---- Autres charges ----
  a('6000', 'Autres dépenses', 'other-expense', 'other-expenses', 1),
  a(
    '6010',
    'Gain ou perte de change',
    'other-expense',
    'exchange-grain-loss',
    1,
  ),
  a('6020', "Rabais d'achat", 'other-expense', 'purchase-discount', 1),
  a('6030', 'Rabais accordés', 'other-income', 'discount', 1),
  a('6040', 'Intérêts sur emprunts', 'other-expense', 'interets-emprunts'),
];

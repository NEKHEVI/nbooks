# Plan Québec : TPS 5 % + TVQ 9,975 % sur une même ligne (tâche 02)

Lecture seulement, aucun code modifié. Tous les chemins sont relatifs à `C:\DEV\CODEGOD\RAWLF\rbooks\`.

## 1. Comment le code gère les taxes aujourd'hui

### 1.1 Données (migrations tenant)

- `packages/server/src/database/tenant/migrations/20230810191606_create_tax_rates.ts` crée :
  - `tax_rates` (`name`, `code`, `rate`, `description`, `is_non_recoverable`, `is_compound`, `active`, `deleted_at`) ;
  - `tax_rate_transactions` (`tax_rate_id`, `reference_type`, `reference_id`, `rate`, `tax_account_id`) : une ligne par taxe et par document ;
  - sur `items_entries` : `is_inclusive_tax`, `tax_rate_id`, `tax_rate` ; sur `sales_invoices` : `is_inclusive_tax`, `tax_amount_withheld` ; sur `accounts_transactions` : `tax_rate_id`, `tax_rate`.
- `20231004012644_add_tax_amount_withheld_to_bills_table.ts` fait la même chose pour `bills`. `20231004020636_add_sell_purchase_tax_to_items_table.ts` ajoute `sell_tax_rate_id` et `purchase_tax_rate_id` aux articles.
- Les montants de taxe d'une ligne ne sont PAS stockés : ils sont recalculés à la volée.

### 1.2 Une seule taxe par ligne

- `packages/server/src/modules/TransactionItemEntry/models/ItemEntry.ts` : une ligne a un seul `taxRateId` et un seul `taxRate` (pourcentage copié). Le getter `taxAmount` (ligne ~157) calcule `amount * taxRate / 100` (exclusive) ou `amount * taxRate / (100 + taxRate)` (incluse) via `packages/server/src/modules/TaxRates/utils.ts`. `subtotalInclusingTax`, `subtotalExcludingTax` et `totalExcludingTax` en dépendent.
- `packages/server/src/modules/TaxRates/ItemEntriesTaxTransactions.service.ts` : `assocTaxRateIdFromCodeToEntries` et `assocTaxRateFromTaxIdToEntries` remplissent `taxRateId` et `taxRate` sur chaque ligne à partir du code ou de l'identifiant ; `assocTaxAmountWithheldFromEntries` additionne les `taxAmount` dans `taxAmountWithheld` du document. Utilisé par `modules/SaleInvoices/commands/CommandSaleInvoiceDTOTransformer.service.ts` et `modules/Bills/commands/BillDTOTransformer.service.ts`.
- `packages/server/src/modules/TaxRates/WriteTaxTransactionsItemEntries.ts` : regroupe les lignes par `taxRateId` et écrit une ligne `tax_rate_transactions` par taxe, avec seulement le taux (pas le montant). Déclenché par `subscribers/WriteInvoiceTaxTransactionsSubscriber.ts` et `WriteBillTaxTransactionsSubscriber.ts`.
- Un seul taux est donc possible par ligne. Pour avoir TPS + TVQ, il faudrait aujourd'hui une taxe unique « 14,975 % » : le PDF et les rapports ne pourraient pas séparer les deux, et la TVQ n'irait pas dans son propre compte.

### 1.3 Colonnes inutilisées ou trop étroites

- `is_compound` et `is_non_recoverable` existent (DTO `modules/TaxRates/dtos/TaxRate.dto.ts`, formulaire webapp `containers/TaxRates/dialogs/TaxRateFormDialog/TaxRateForm.schema.ts`) mais AUCUN calcul ne s'en sert (seul `containers/TaxRates/containers/_utils.tsx` les affiche).
- RISQUE BLOQUANT : `table.decimal('rate')` et `table.decimal('tax_rate')` sont déclarés sans précision. Avec Knex et MariaDB, cela donne `DECIMAL(8,2)` : **9,975 % serait arrondi à 9,98 %**. Même chose pour `tax_rate_transactions.rate` et `accounts_transactions.tax_rate`. Il faut une migration qui passe ces colonnes à `DECIMAL(9,5)`.
- Le formulaire webapp limite le taux à 0–100 sans règle de décimales : à vérifier avec 9,975.

### 1.4 Écritures au grand livre

- Facture : `packages/server/src/modules/SaleInvoices/ledger/InvoiceAccrualGL.ts`. `getInvoiceItemEntry` crédite le compte de revenus avec `entry.totalExcludingTax` ; `getInvoiceTaxEntry` (ligne ~135) crédite `taxPayableAccountId` de `entry.taxAmount` : UNE écriture par ligne taxée, toutes dans le même compte. Le compte vient de `InvoiceGLEntries.ts` : `accountRepository.findOrCreateTaxPayable()` (compte `tax-payable`, défini dans `modules/Accounts/Accounts.constants.ts`).
- Facture fournisseur : `packages/server/src/modules/Bills/commands/BillsGL.ts`, `getBillTaxEntry` (ligne ~155) débite le même compte `tax-payable` du `entry.taxAmount`. Les CTI/RTI sont donc compensés dans le compte de taxe à payer : pas de compte « à recevoir » et pas de part non récupérable.
- `modules/Ledger/Ledger.ts` et `modules/Ledger/utils.ts` copient `taxRateId` et `taxRate` sur chaque écriture ; `accounts_transactions` garde donc le taux mais pas un montant de taxe séparé.
- Rapport `modules/FinancialStatements/modules/SalesTaxLiabilitySummary/` (`SalesTaxLiabilitySummaryRepository.ts`) : regroupe `accounts_transactions` par `tax_rate_id`. Il fonctionnera par composante (TPS, TVQ) si chaque écriture porte l'identifiant de SA taxe.
- Les dépenses (`modules/Expenses`) n'ont AUCUNE gestion de taxe (aucune occurrence de « tax » dans le module). Seules les factures fournisseurs (Bills) portent des taxes. Important pour la capture de factures (voir `PLAN-CAPTURE-FACTURES.md`).

### 1.5 Affichage et PDF

- `modules/SaleInvoices/queries/SaleInvoiceTaxEntry.transformer.ts` : le montant par taxe est calculé comme `sous-total du document x taux` (`taxRateAmount`), pas comme la somme des lignes réellement taxées. Si une facture mélange des lignes taxées et non taxées, ou des taux différents, le montant affiché (tiroir, PDF, lien de paiement) ne correspond pas au grand livre. À corriger dans la tâche 02. Utilisé par `SaleInvoice.transformer.ts` (`taxes`), `Bills/queries/Bill.transformer.ts` et `GetInvoicePaymentLink.transformer.ts`.
- PDF : `modules/SaleInvoices/utils.ts` transforme `invoice.taxes` en `taxes: [{ label, amount }]` ; le gabarit `shared/pdf-templates/src/components/InvoicePaperTemplate.tsx` affiche déjà une liste de lignes de taxes. Le PDF peut donc afficher « TPS » et « TVQ » séparément sans changer le gabarit : il suffit de fournir deux éléments.
- Interface : `packages/webapp/src/containers/Drawers/InvoiceDetailDrawer/InvoiceDetailTableFooter.tsx` et `BillDrawer/BillDetailTableFooter.tsx` affichent « nom [taux %] » et le montant par taxe ; le tableau de saisie `containers/Entries/ItemsEntriesTable.tsx` et `components/TaxRates/TaxRatesSuggestInputCell.tsx` permettent de choisir UNE taxe par ligne.
- Fonctionnalité : `Features.SALES_TAX` (`modules/Features/FeaturesConfigure.ts`, activée par défaut) et `SalesTaxFeatureGuard.ts` ; le contrôleur est aussi sous `RequireSubscriptionFeature(SalesTax)` (offre cloud : à vérifier hors cloud).
- Langues de l'interface : `packages/webapp/src/lang/` ne contient que `ar`, `en`, `es`, `sv`. Il n'y a PAS de français : à créer (fr-CA) pour l'interface ajoutée.
## 2. Design proposé pour la tâche 02

Principe : garder `taxRateId` partout (articles, importation, saisie) et faire d'un « groupe » une taxe comme les autres, pour toucher le moins possible au code Bigcapital.

### 2.1 Tables (migrations tenant dans `packages/server/src/database/tenant/migrations/`)

1. `AAAAMMJJ_rbooks_tax_rates_precision` : `tax_rates.rate`, `tax_rate_transactions.rate`, `items_entries.tax_rate`, `accounts_transactions.tax_rate` passent à `DECIMAL(9,5)`. Test : sauvegarder 9,975 et le relire.
2. `AAAAMMJJ_rbooks_tax_groups` :
   - `tax_rates` : ajouter `is_group` (booléen, faux par défaut), `sales_account_id` (compte de taxe perçue, nullable), `purchase_account_id` (compte de taxe payée ou à recevoir, nullable), `registration_no` (no de TPS ou de TVQ).
   - nouvelle table `tax_rate_components` : `id`, `group_id` vers `tax_rates.id`, `component_id` vers `tax_rates.id`, `position`. Le groupe « TPS+TVQ (QC) » a pour composantes TPS 5 % et TVQ 9,975 %.
3. `AAAAMMJJ_rbooks_item_entry_taxes` : nouvelle table `item_entry_taxes` : `id`, `item_entry_id`, `tax_rate_id` (la composante), `rate`, `base_amount`, `tax_amount`, `account_id`, `recoverable_ratio` (1 par défaut, 0,5 pour les repas). C'est la source unique des montants de taxe (PDF, grand livre, rapports).
4. Semences : comptes « TPS à payer », « TVQ à payer » (ventes) et « TPS à recevoir (CTI) », « TVQ à recevoir (RTI) » (achats) dans `database/tenant/seeds/` (sur le modèle de `20230912121909_update_tax_payable_account.ts`), plus les taxes TPS, TVQ et le groupe TPS+TVQ pour une organisation du Québec.
5. Paramètres d'organisation : numéros de TPS et de TVQ de l'entreprise (affichés sur les factures).

### 2.2 Serveur (nouveau module `packages/server/src/modules/RBooksQuebecTax/`)

- `QuebecTaxCalculator` : fonction pure, en entiers de cents ou avec decimal.js (le flottant JavaScript est interdit pour l'argent). Prend les lignes et les taxes, retourne les montants par ligne et par composante. Règles : TPS et TVQ calculées toutes deux sur le prix avant taxes (la TVQ n'est plus calculée sur la TPS depuis 2013, donc `is_compound` reste faux) ; arrondi par composante au niveau du document, écart d'arrondi réparti sur la plus grosse ligne pour que la somme des lignes égale le total ; mode « taxes incluses » supporté.
- `ItemEntry.taxAmount` : si une ligne a des `item_entry_taxes`, la valeur est leur somme ; sinon comportement actuel. Un seul getter modifié dans `ItemEntry.ts`.
- Un nouveau subscriber (sans modifier `WriteTaxTransactionsItemEntries.ts`) écrit `item_entry_taxes` et un `tax_rate_transactions` PAR composante, avec le montant.
- Grand livre : dans `InvoiceAccrualGL.getInvoiceTaxEntry` et `BillsGL.getBillTaxEntry`, passer d'une écriture par ligne à une écriture par composante et par compte (`item_entry_taxes.account_id`), avec le `taxRateId` de la composante pour que `SalesTaxLiabilitySummary` fonctionne. Factures fournisseurs : débit « TPS à recevoir » et « TVQ à recevoir » ; la part non récupérable (repas 50 %) s'ajoute à la charge de la ligne.
- Corriger `SaleInvoiceTaxEntry.transformer.ts` pour lire `item_entry_taxes` (somme réelle) au lieu de `sous-total x taux`.
- API : `POST` et `PUT /tax-rates` acceptent `isGroup` et `components: [{ taxRateId }]`, valident la somme et l'absence de boucle ; `GET /tax-rates` renvoie `components` et le taux effectif (14,975). Les documents gardent leur API (une ligne garde `taxRateId`, qui peut être un groupe). Ajouter `taxes: [{ code, name, rate, amount, registrationNo }]` à la réponse des factures. Régénérer le SDK avec `pnpm run generate:sdk-types` (`shared/sdk-ts`).
- Fichiers d'upstream touchés (changements minuscules) : `ItemEntry.ts`, `InvoiceAccrualGL.ts`, `BillsGL.ts`, `SaleInvoiceTaxEntry.transformer.ts`. Tout le reste va dans le nouveau module.
- Dépenses : `modules/Expenses` n'a pas de taxes. Soit on les y ajoute, soit on saisit les dépenses comme factures fournisseurs payées. Recommandé : factures fournisseurs, pour réutiliser les taxes (décision à prendre avant la tâche capture).

### 2.3 Interface (packages/webapp)

- `containers/TaxRates/dialogs/TaxRateFormDialog/` : case « Groupe de taxes », liste des composantes, comptes, no de taxe ; taux à 3 décimales.
- `ItemsEntriesTable` : la cellule de taxe reste unique (un groupe se choisit comme une taxe) ; afficher « TPS+TVQ (14,975 %) ».
- Pieds de tiroir facture et facture fournisseur : une ligne par composante (TPS 5 % ; TVQ 9,975 %) avec les montants stockés.
- PDF : deux lignes de taxes et les numéros de TPS et de TVQ de l'entreprise en pied de page.
- Nouveaux textes en français québécois : créer `lang/fr` ou une couche de textes RBooks.

### 2.4 Tests à écrire (serveur, Jest)

- Calculateur : 100,00 $ donne TPS 5,00 et TVQ 9,98 (9,975 arrondi) ; arrondi sur plusieurs lignes ; prix taxes incluses ; ligne non taxée ; repas à 50 %.
- Grand livre : débits = crédits, deux comptes séparés, `SalesTaxLiabilitySummary` par composante.
- Migration : 9,975 stocké et relu sans perte.
- Non-régression : un document avec une taxe simple donne les mêmes montants qu'avant.

## 3. Risques

1. **Précision DECIMAL(8,2)** (section 1.3) : bloquant tant que la migration n'est pas faite ; les données existantes restent valides.
2. **Arrondi** : la règle (par ligne ou par document) doit être confirmée avec le comptable ; un écart de quelques cents entre le PDF et le grand livre est la plainte la plus courante.
3. **Fusions upstream** : `ItemEntry.ts`, `BillsGL.ts` et `InvoiceAccrualGL.ts` sont des fichiers actifs d'upstream ; garder les changements minuscules et couverts par des tests.
4. **Documents existants** : les factures déjà créées n'ont pas de `item_entry_taxes` ; garder le calcul actuel en repli, ou faire une migration de rattrapage.
5. **Rapports** : le rapport existant regroupe par `tax_rate_id` ; vérifier qu'il sépare bien les composantes et qu'il peut alimenter plus tard un sommaire de déclaration TPS/TVQ.
6. **Offre cloud** : `RequireSubscriptionFeature(SalesTax)` sur le contrôleur des taxes ; confirmer le comportement hors cloud (installation locale).
7. **Taxes incluses** : avec deux taxes, la base se calcule en divisant par `1 + 0,05 + 0,09975` (pas par deux divisions successives) ; couvrir par un test.
8. **Cas hors Québec** : TVH, TPS seule, exportations, services exonérés ou détaxés : prévoir des groupes « TPS seule », « Exonéré » et « Détaxé ».
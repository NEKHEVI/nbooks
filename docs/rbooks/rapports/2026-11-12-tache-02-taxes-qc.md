# Rapport tâche 02 : TPS 5 % + TVQ 9,975 % sur une même ligne (2026-11-12)

Branche : `rbooks/02-taxes-qc`, fusionnée en fast-forward dans `rbooks/main`. Aucun push.

## Résumé

| Étape | État |
|---|---|
| Démarrage réel (Docker, migrations, serveur 3000, interface 4000) | Fait |
| 1. Précision DECIMAL(9,5) | Fait (essai réel : 9,975 stocké et relu intact) |
| 2. Plusieurs taxes par ligne (groupes) | Fait (design simplifié, voir plus bas) |
| 3. Calcul par ligne, taxes incluses et en sus | Fait |
| 4. Grand livre : une écriture par taxe, 4 comptes | Fait |
| 5. Affichage tiroir, PDF, rapport de taxe | Fait (tiroir et PDF vérifiés par l'API) |
| 6. Saisie : groupe « TPS + TVQ » par défaut | Fait pour le choix sur la ligne et la création par défaut ; écran de création de groupe : reste à faire |
| 7. Tests | Fait |
| Données de démo | Fait (voir DEMO-DEMAIN.md) |

## Règle d'arrondi

- Chaque taxe est calculée séparément, par ligne, et arrondie à 2 décimales (demi vers le haut, sur la valeur absolue, donc symétrique pour les notes de crédit).
- Taxes en sus : taxe = quantité x prix x taux / 100.
- Taxes incluses : base = montant / (1 + somme des taux / 100), puis taxe = base x taux / 100, arrondie par taxe. 114,98 $ donne TPS 5,00 + TVQ 9,98 et base 100,00 $.
- Le total d'une taxe pour un document = somme des lignes arrondies (jamais sous-total x taux). Total du document = somme des lignes, donc PDF, tiroir et grand livre concordent au cent près.
- À faire valider par le comptable (risque du plan).

## Design choisi et pourquoi

Le plan prévoyait une table de liaison et une table `item_entry_taxes`. Pour livrer avant la démo avec le moins de code touché dans Bigcapital :

- Un groupe est un taux comme les autres (`tax_rates.is_group = 1`) avec la liste de ses composantes dans `tax_rates.component_ids` (JSON texte, ex. `[5,6]`). Le taux du groupe = somme des composantes (14,975).
- À l'enregistrement d'une facture ou d'une facture fournisseur, si la taxe de la ligne est un groupe, les composantes (id, code, nom, taux, compte de vente, compte d'achat) sont copiées dans `items_entries.tax_components` (JSON texte). Tout est calculé à partir de cette copie : aucune relecture de la table des taxes, une ligne ancienne ne change jamais si on modifie un taux.
- Une ligne sans groupe garde exactement le comportement Bigcapital (une taxe, mêmes formules, aucun arrondi ajouté).
- `tax_rate_transactions` reçoit une ligne PAR taxe (TPS, TVQ) avec le montant réel (`amount` = somme des lignes). Le tiroir et le PDF lisent ce montant ; sans montant (anciens documents), l'ancien calcul sert de repli.

## Migrations ajoutées (aucune migration existante modifiée)

Dans `C:\DEV\CODEGOD\RAWLF\rbooks\packages\server\src\database\tenant\migrations\` :

- `20261112130000_rbooks_tax_rates_precision.ts` : `tax_rates.rate`, `tax_rate_transactions.rate`, `items_entries.tax_rate`, `accounts_transactions.tax_rate` en DECIMAL(9,5).
- `20261112130100_rbooks_tax_groups.ts` : `tax_rates.is_group`, `component_ids`, `sales_account_id`, `purchase_account_id`, `registration_no` ; `items_entries.tax_components` ; `tax_rate_transactions.amount`.
- Semence `seeds\core\20261112130200_seed_quebec_taxes.ts` : pour une organisation en CAD, comptes « TPS à payer » (20007), « TVQ à payer » (20008), « TPS à recevoir (CTI) » (10011), « TVQ à recevoir (RTI) » (10012), taux TPS 5 %, TVQ 9,975 % et groupe « TPS + TVQ ».

## Code

Nouveau module : `packages\server\src\modules\RBooksQuebecTax\` (calculateur pur, assistant de groupe, tests).

Fichiers Bigcapital touchés (petits changements) : `TransactionItemEntry\models\ItemEntry.ts` (getter `taxAmount`), `SaleInvoices\ledger\InvoiceAccrualGL.ts`, `Bills\commands\BillsGL.ts`, `SaleInvoices\queries\SaleInvoiceTaxEntry.transformer.ts`, `SaleInvoices\utils.ts` (libellé PDF « TPS (5%) »), `TaxRates\ItemEntriesTaxTransactions.service.ts`, `TaxRates\WriteTaxTransactionsItemEntries.ts`, `TaxRates\dtos\TaxRate.dto.ts`, services de création et d'édition de taux, `TaxRateTransaction.model.ts`.

API des taux : `POST` et `PUT /api/tax-rates` acceptent `isGroup`, `componentIds`, `salesAccountId`, `purchaseAccountId`, `registrationNo`.

## Tests

- Avant : 533 réussis, 1 échec (0 lié aux taxes : `TransactionsByCustomersPdf.spec.ts`, deux arguments `undefined` en trop, déjà présent avant la tâche).
- Après : 544 réussis, le même 1 échec. 11 tests ajoutés (calculateur : 100,00 $ donne 5,00 / 9,98 / 114,98, taxes incluses, plusieurs lignes avec arrondis, une seule taxe inchangée, note de crédit ; grand livre : facture et facture fournisseur équilibrées, bons comptes, une taxe simple vers « Tax Payable »).
- Essai réel : organisation de démo créée, 4 factures, 2 factures fournisseurs, 1 paiement ; bilan équilibré (actifs 1 816,63 $ = passifs et avoir 1 816,63 $), TPS à payer 74,38 $ et TVQ à payer 148,39 $ égales à la somme des documents.
- Compilation : `pnpm run build:server` réussie.

## Reste à faire

1. Écran « Taxes » : case « Groupe de taxes », choix des composantes et des comptes (l'API est prête).
2. Numéros de TPS et de TVQ de l'entreprise sur le PDF et dans les paramètres.
3. Rapport de taxe de vente : rattacher la base imposable à chaque taxe (aujourd'hui rattachée au groupe).
4. Base de caisse : séparer TPS et TVQ dans `PaymentReceivedCashGL` et `BillPaymentCashGL`.
5. Part non récupérable (repas 50 %), TVH, exportations, détaxé.
6. Modifier un taux composant après coup crée un nouveau taux (comportement Bigcapital) : le groupe garde l'ancien. Prévoir de mettre à jour les groupes.
7. Total pendant la saisie dans le formulaire (taux combiné) à aligner sur l'arrondi par taxe.
8. Test automatisé de migration (la vérification de 9,975 a été faite sur la vraie base).

## Risques pour les mises à jour depuis Bigcapital

- `ItemEntry.ts`, `InvoiceAccrualGL.ts`, `BillsGL.ts` : changements de quelques lignes, couverts par les tests.
- `WriteTaxTransactionsItemEntries.ts` : méthode d'écriture réécrite (conflit probable).
- Nouvelles colonnes sur des tables Bigcapital : une migration amont du même nom de colonne créerait un conflit.
- Les semences en français ne s'appliquent qu'aux nouvelles organisations en CAD.
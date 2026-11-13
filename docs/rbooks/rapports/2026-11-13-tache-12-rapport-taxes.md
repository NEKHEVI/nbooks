# Tache 12 - Rapport de taxes (Sales Tax Liability) : TPS/TVQ percues, payees, nettes

Branche `rbooks/12-rapport-taxes`. Date : 2026-11-13.

## Diagnostic

Le rapport d'origine de Bigcapital :

- ne comptait que les ventes (montants percus sur les comptes de taxes a payer) ;
- calculait la base sur le groupe TPS+TVQ, sans separer les composantes ;
- n'affichait aucun achat (CTI/RTI) ;
- n'avait aucune colonne de montant net par periode.

## Correctif (minimal)

- Nouvelles colonnes : taxe percue (ventes), taxe payee (achats, CTI/RTI), taxe nette = percue - payee.
- Une ligne par composante (TPS, TVQ), les groupes sont eclates selon `component_ids`.
- Les achats sont lus sur les comptes de taxes a recevoir, via `accounts_transactions.tax_rate_id`.
- Totaux percu, paye et net en pied de tableau.
- i18n en/fr, webapp `dynamicColumns.ts` et `SalesTaxLiabilitySummaryTable.tsx`.
- Test : `SalesTaxLiabilitySummaryQuebec.spec.ts`. Module complet : 5 suites, 20 tests verts.

## Resultats sur donnees reelles (demo + factures capturees par T1)

| Periode | Taxe | Percue | Payee | Nette |
|---|---|---|---|---|
| Toutes | TPS | 74.38 | 24.88 | 49.50 |
| Toutes | TVQ | 148.39 | 49.63 | 98.76 |
| Novembre 2026 | TPS | 74.38 | 8.80 | 65.58 |
| Novembre 2026 | TVQ | 148.39 | 17.56 | 130.83 |
| Juin 2026 (factures capturees) | TPS | 0 | 16.08 | -16.08 |
| Juin 2026 (factures capturees) | TVQ | 0 | 32.07 | -32.07 |

Le bilan concorde : TPS a recevoir 24.88, TVQ a recevoir 49.63, TPS a payer 74.38, TVQ a payer 148.39.

## Captures

`docs/rbooks/captures-taxes/` : 01 toutes periodes, 02 novembre 2026, 03 juin 2026 (achats captures), 04 bilan, 05 factures fournisseurs. Script : `capturer.cjs`.

## Limites

- Net = taxe percue - taxe payee ; les remises aux gouvernements (debits sur les comptes a payer) reduisent la taxe percue.
- Base comptable "cash" : les paiements ne separent pas TPS et TVQ.
- Le montant imposable total compte la base une fois par composante.
- Les types du sdk-ts ne sont pas regeneres.
- A valider par un CPA avant toute declaration reelle.
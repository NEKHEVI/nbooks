# Rapport tâche 11 : plan comptable québécois par défaut (2026-11-13)

Branche `rbooks/11-plan-comptable-qc`, fusionnée dans `rbooks/main`. Aucun push. Document de référence : `C:\DEV\CODEGOD\RAWLF\rbooks\docs\rbooks\PLAN-COMPTABLE-QC.md` (liste complète de 72 comptes, **à valider par un CPA**).

## Où Bigcapital crée les comptes

À la création d'une organisation, la semence `packages\server\src\database\tenant\seeds\core\20190423085242_seed_accounts.ts` insère la liste `AccountsData` de `seeds\data\accounts.ts` (noms traduits par i18n). La tâche 02 ajoutait ensuite 4 comptes de taxes (semence `20261112130200_seed_quebec_taxes.ts`, devise CAD).

## Ce qui a été fait

- Nouveau fichier `seeds\data\accountsQuebec.ts` : plan québécois (noms en français, codes à 4 chiffres : 1xxx actifs, 2xxx passifs, 3xxx capitaux, 4xxx revenus, 5xxx charges, 6xxx autres). Il garde tous les `slug` système de Bigcapital.
- Nouveau `packages\server\src\modules\RBooksQuebecTax\quebecChart.ts` : `shouldUseQuebecChart` choisit la variante (langue `fr-CA`, ou pays `CA-QC`, ou `CA` + province QC, ou langue `fr` avec pays CA ou devise CAD). Sinon plan anglais inchangé.
- `20190423085242_seed_accounts.ts` : choisit la variante (changement de quelques lignes, plan anglais intact).
- `20261112130200_seed_quebec_taxes.ts` : retrouve les comptes TPS/TVQ par `slug` au lieu de les recréer : aucun doublon avec le plan québécois.
- Contenu : TPS/TVQ à payer (2100, 2110) et à recevoir (1210, 1220) ; retenues à la source fédéral (2200) et Québec (2210) ; RRQ (2220), RQAP (2230), AE (2240), FSS (2250), CNESST (2260), salaires (2270) et vacances (2280) à payer ; comptes de dépenses à rembourser (2150) ; charges 5100 à 5910 identiques aux catégories de la capture (code et nom), plus salaires (5010) et charges sociales (5020).
- Capture (`rbooks-capture`) : le compte TPS/TVQ à recevoir est aussi retrouvé par les codes 1210/1220 (commit 68de1bb).

## Vérification

- Espace de travail de test créé par l'API (`POST /api/workspaces`, langue fr, pays CA, CAD) : 72 comptes en français, 1 seul compte par taxe, taux TPS 5 %, TVQ 9,975 % et groupe « TPS + TVQ » reliés aux bons comptes ; puis supprimé (base retirée). Espace anglais (en, CA, CAD) : plan Bigcapital habituel, 38 comptes ; puis supprimé.
- Tests : `quebecChart.spec.ts` (choix de la variante, aucun doublon de slug ou de code, codes à 4 chiffres cohérents avec le type, slugs système conservés, comptes de taxes uniques, retenues/cotisations présentes, charges alignées sur les catégories de la capture). Jest serveur : 611 réussis, 1 échec déjà présent avant (`TransactionsByCustomersPdf.spec.ts`). `tsc` serveur sans erreur.
- Organisation de démo : non remplacée. Ajout de 30 comptes manquants seulement (retenues, cotisations, salaires, charges alignées sur la capture). Les factures capturées vont maintenant au bon compte de charge (ex. 5410 pour RONA, 5200 pour un restaurant).

## Limites

- Le plan est une proposition : un CPA doit valider noms, regroupements, numérotation et comptes de paie (voir le document du plan).
- L'organisation de démo garde son plan à 5 chiffres (mélange de codes) : seule une nouvelle organisation reçoit le plan complet.
- Le plan n'est pas encore choisi par une option dans l'assistant de création : il découle de la langue/pays/devise.
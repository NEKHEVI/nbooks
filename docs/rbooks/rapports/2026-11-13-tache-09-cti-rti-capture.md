# Rapport tâche 09 : CTI/RTI automatiques pour les factures capturées (2026-11-13)

Dépôt principal du code : `C:\DEV\CODEGOD\RAWLF\rbooks-capture` (branche `rbooks/09-cti-rti-capture`, fusionnée en fast-forward dans `main`, commit c24afdc). Le serveur RBooks n'a pas été modifié.

## Choix : lignes imputées directement aux comptes de taxes à recevoir

Le mécanisme de taxes de RBooks (groupe « TPS + TVQ » sur la ligne) a été examiné et écarté pour les achats capturés :

- il recalcule les taxes à partir des taux (5 % et 9,975 %) : les montants imprimés sur le reçu (arrondis du commerçant, pourboire non taxé, écarts d'un cent) ne seraient pas reproduits, donc le total du Bill ne serait pas toujours égal au reçu ;
- il ne sait pas réclamer une part (repas à 50 %), ni ne rien réclamer faute de numéros de taxe du fournisseur.

On utilise donc des lignes de facture fournisseur avec `costAccountId` = compte « TPS à recevoir (CTI) » (10011) ou « TVQ à recevoir (RTI) » (10012). Le serveur accepte ce champ par ligne (BillDTOTransformer) : aucune modification du serveur.

## Règles (module `rbcapture\taxes.py`, fonctions pures en Decimal)

- Part réclamable = montant imprimé x ratio de la catégorie (`cti_rti` de `data\categories.json` : repas 5200 = 0,5, santé 5800 = 0, le reste 1). Arrondi demi vers le haut ; le reste de la taxe est une dépense.
- Sans numéro de TPS OU sans numéro de TVQ du fournisseur : rien n'est réclamé, tout en dépense, note sur le Bill (« Aucune taxe réclamée (...) »).
- Taxes estimées (non imprimées) : rien réclamé, taxes non ventilées (une seule ligne de dépense).
- Le total des lignes égale toujours le total du reçu : l'écart est absorbé par la ligne « Sous-total ».
- La date du Bill reste celle du reçu.
- Différence avec l'ancienne règle du moteur (`depenses.py`) : l'ancienne acceptait une réclamation sous 30 $ sans numéro ; la règle demandée est stricte (aucun numéro, aucune réclamation).

## Vérification réelle (RBooks local, envoi par l'app de capture)

| Reçu | Résultat dans RBooks |
|---|---|
| RONA 327,89 $ (5410, numéros présents) | Dépense 285,96 ; TPS à recevoir 14,00 ; TVQ à recevoir 27,93 ; fournisseurs 327,89 |
| Le Rialto 95,43 $ (repas 5200, numéros présents) | Dépense 83,00 + 2,07 + 4,14 ; TPS à recevoir 2,08 ; TVQ à recevoir 4,14 ; fournisseurs 95,43 |
| Le Rouge Gorge 147,12 $ (repas, sans numéros, taxes estimées) | Dépense 125,32 + pourboire 21,80 ; rien réclamé ; fournisseurs 147,12 |

Chaque écriture de journal est équilibrée. Bilan après les trois envois : actifs 1 864,78 $ = passifs et avoir 1 864,78 $ ; TPS à recevoir 24,88 $ (4,25 + 4,55 + 14,00 + 2,08) ; TVQ à recevoir 49,63 $ (8,48 + 9,08 + 27,93 + 4,14).

## Tests

`python -m pytest` dans `C:\DEV\CODEGOD\RAWLF\rbooks-capture` : 36 réussis (13 nouveaux dans `tests\test_taxes.py` : cas normal, repas 50 %, arrondi, pourboire, sans TPS, sans TVQ, sans numéros, catégorie sans CTI, taxes estimées, écart du commerçant, total seulement, balayage « total = reçu » ; le test du client RBooks vérifie les comptes imputés).

## Limites

- Les articles de dépense utilisent le compte de dépense dont le code égale la catégorie (5410...) ; sinon « Frais de bureau ». La tâche 11 (plan comptable du Québec) fournit des comptes de dépenses alignés.
- Le rapport de taxe de vente ne voyait que les taxes liées à un taux : voir tâche 4 (rapport de taxes).
- À valider par un CPA : règle « sans numéro, aucune réclamation » même sous 30 $, repas à 50 % (CTI et RTI), arrondi par taxe.
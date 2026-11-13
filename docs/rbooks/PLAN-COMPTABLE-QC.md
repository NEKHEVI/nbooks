# Plan comptable du Québec par défaut (tâche 11)

> **À VALIDER PAR UN CPA avant tout usage réel.** Cette liste est une proposition de départ pour une PME québécoise de services : les noms, les regroupements, la numérotation et le choix des comptes de paie doivent être confirmés par un comptable professionnel agréé. Aucune écriture réelle ne doit s'y appuyer avant cette validation.

## Quand est-il utilisé

À la création d'une organisation (assistant ou nouvel espace de travail), RBooks sème le plan du Québec au lieu du plan anglais de Bigcapital quand l'une de ces conditions est vraie (`packages\server\src\modules\RBooksQuebecTax\quebecChart.ts`) :

- la langue de l'organisation est `fr-CA` ;
- le pays est `CA-QC`, ou le pays est `CA` et la province de l'adresse est QC / Québec ;
- la langue est `fr` (le seul code français accepté par RBooks) et le pays est `CA` ou la devise est `CAD`.

Dans tous les autres cas, le plan anglais de Bigcapital reste inchangé (38 comptes avec les taxes, vérifié sur une organisation de test en anglais). Une organisation existante n'est jamais modifiée par ce changement.

## Où est le code

- Liste des comptes : `C:\DEV\CODEGOD\RAWLF\rbooks\packages\server\src\database\tenant\seeds\data\accountsQuebec.ts` (nouveau fichier).
- Choix de la variante : `quebecChart.ts` + semence existante `seeds\core\20190423085242_seed_accounts.ts` (changement de quelques lignes).
- Les comptes de TPS/TVQ sont ceux de la tâche 02 (mêmes `slug` : `tps-a-payer`, `tvq-a-payer`, `tps-a-recevoir-cti`, `tvq-a-recevoir-rti`). La semence des taxes (`20261112130200_seed_quebec_taxes.ts`) retrouve maintenant ces comptes par `slug` au lieu de les recréer : aucun doublon (vérifié : 1 compte de chaque).
- Les `slug` système de Bigcapital (`bank-account`, `accounts-receivable`, `tax-payable`, `other-expenses`, etc.) sont conservés : le code s'en sert pour retrouver les comptes.

## Règles de numérotation

Codes à 4 chiffres : 1xxx actifs, 2xxx passifs, 3xxx capitaux propres, 4xxx revenus, 5xxx coût des ventes et charges, 6xxx autres produits et charges. Les charges 5100 à 5910 portent les mêmes codes et les mêmes noms que les catégories de l'app de capture (`C:\DEV\CODEGOD\RAWLF\rbooks-capture\data\categories.json`), de sorte que les factures capturées tombent dans le bon compte. Les comptes de taxes à recevoir sont 1210 (TPS/CTI) et 1220 (TVQ/RTI), comme prévu par la capture.

## Paie et remises (à valider)

Comptes de passif créés pour les remises à l'État : retenues à la source fédéral (2200) et Québec (2210), RRQ (2220), RQAP (2230), AE (2240), FSS (2250), CNESST (2260), salaires (2270) et vacances (2280) à payer. Côté charges : salaires et traitements (5010) et charges sociales de l'employeur (5020). Un CPA doit confirmer : la ventilation part employé / part employeur, le compte des cotisations de l'employeur, le traitement des vacances et les comptes de la CNESST et du FSS selon la taille de l'entreprise.

## Liste complète (72 comptes)
### Actifs (1xxx)

| Code | Nom | Type RBooks | Remarque |
|---|---|---|---|
| 1010 | Compte bancaire | Banque | Compte système (ne peut pas être supprimé). |
| 1020 | Compte d'épargne | Banque |  |
| 1030 | Fonds non déposés | Encaisse | Compte système (ne peut pas être supprimé). |
| 1040 | Petite caisse | Encaisse | Compte système (ne peut pas être supprimé). |
| 1100 | Comptes clients | Comptes clients | Compte système (ne peut pas être supprimé). |
| 1150 | Stocks (inventaire) | Stocks | Valeur des produits disponibles pour la vente. Compte système (ne peut pas être supprimé). |
| 1190 | Charges payées d'avance | Autre actif à court terme | Compte système (ne peut pas être supprimé). |
| 1195 | Compte de transit Stripe | Autre actif à court terme | Compte système (ne peut pas être supprimé). |
| 1210 | TPS à recevoir (CTI) | Autre actif à court terme | Crédits de taxe sur les intrants (TPS payée sur les achats). |
| 1220 | TVQ à recevoir (RTI) | Autre actif à court terme | Remboursements de la taxe sur les intrants (TVQ payée sur les achats). |
| 1500 | Équipement informatique | Immobilisation |  |
| 1510 | Équipement de bureau | Immobilisation |  |
| 1520 | Véhicules | Immobilisation |  |
| 1590 | Amortissement cumulé | Immobilisation |  |

### Passifs (2xxx)

| Code | Nom | Type RBooks | Remarque |
|---|---|---|---|
| 2010 | Comptes fournisseurs | Comptes fournisseurs | Compte système (ne peut pas être supprimé). |
| 2020 | Carte de crédit | Carte de crédit |  |
| 2100 | TPS à payer | Taxe à payer | TPS perçue sur les ventes. |
| 2110 | TVQ à payer | Taxe à payer | TVQ perçue sur les ventes. |
| 2120 | Taxes à payer (non ventilées) | Taxe à payer | Compte système (ne peut pas être supprimé). |
| 2150 | Comptes de dépenses à rembourser | Autre passif à court terme | Dépenses payées personnellement par un employé ou un actionnaire. |
| 2200 | Retenues à la source à payer - fédéral | Autre passif à court terme | Impôt fédéral retenu sur la paie, à remettre à l'ARC. |
| 2210 | Retenues à la source à payer - Québec | Autre passif à court terme | Impôt du Québec retenu sur la paie, à remettre à Revenu Québec. |
| 2220 | RRQ à payer | Autre passif à court terme | Cotisations au Régime de rentes du Québec (part de l'employé et de l'employeur). |
| 2230 | RQAP à payer | Autre passif à court terme | Cotisations au Régime québécois d'assurance parentale. |
| 2240 | AE à payer | Autre passif à court terme | Cotisations à l'assurance-emploi. |
| 2250 | FSS à payer | Autre passif à court terme | Contribution au Fonds des services de santé. |
| 2260 | CNESST à payer | Autre passif à court terme | Cotisations à la CNESST. |
| 2270 | Salaires à payer | Autre passif à court terme |  |
| 2280 | Vacances à payer | Autre passif à court terme |  |
| 2300 | Revenus reçus d'avance | Autre passif à court terme | Montants payés à l’avance par les clients pour des produits ou services. |
| 2310 | Revenus perçus d'avance | Autre passif à court terme | Compte système (ne peut pas être supprimé). |
| 2400 | Comptes de l'actionnaire | Autre passif à court terme |  |
| 2500 | Emprunt bancaire | Passif à long terme |  |
| 2900 | Soldes d'ouverture des passifs | Autre passif à court terme |  |

### Capitaux propres (3xxx)

| Code | Nom | Type RBooks | Remarque |
|---|---|---|---|
| 3010 | Capital-actions | Capitaux propres | Compte système (ne peut pas être supprimé). |
| 3020 | Dividendes et retraits | Capitaux propres | Compte système (ne peut pas être supprimé). |
| 3100 | Bénéfices non répartis | Capitaux propres | Compte système (ne peut pas être supprimé). |
| 3900 | Solde d'ouverture des capitaux propres | Capitaux propres | Compte système (ne peut pas être supprimé). |

### Revenus (4xxx)

| Code | Nom | Type RBooks | Remarque |
|---|---|---|---|
| 4010 | Ventes de produits | Revenu | Compte système (ne peut pas être supprimé). |
| 4020 | Revenus de services | Revenu |  |
| 4090 | Revenus non classés | Revenu | Compte système (ne peut pas être supprimé). |
| 4100 | Autres revenus | Autre revenu |  |
| 4110 | Frais divers facturés | Autre revenu | Compte système (ne peut pas être supprimé). |

### Coût des ventes et charges (5xxx)

| Code | Nom | Type RBooks | Remarque |
|---|---|---|---|
| 5000 | Coût des marchandises vendues | Coût des ventes | Compte système (ne peut pas être supprimé). |
| 5010 | Salaires et traitements | Charge |  |
| 5020 | Charges sociales de l'employeur | Charge | RRQ, RQAP, AE, FSS et CNESST - part de l'employeur. |
| 5050 | Loyer | Charge |  |
| 5060 | Assurances | Charge |  |
| 5070 | Services publics (électricité, chauffage) | Charge |  |
| 5080 | Honoraires professionnels | Charge |  |
| 5090 | Publicité et promotion | Charge |  |
| 5100 | Carburant | Charge |  |
| 5110 | Entretien véhicule | Charge |  |
| 5120 | Stationnement & péages | Charge |  |
| 5200 | Repas & représentation | Charge |  |
| 5300 | Déplacements & hébergement | Charge |  |
| 5400 | Fournitures de bureau | Charge |  |
| 5410 | Matériel, outillage & équipement | Charge |  |
| 5420 | Informatique & électronique | Charge |  |
| 5500 | Logiciels & abonnements | Charge |  |
| 5600 | Télécommunications | Charge |  |
| 5700 | Formation & congrès | Charge |  |
| 5800 | Santé & avantages employés | Charge |  |
| 5900 | À classer | Charge |  |
| 5910 | À classer — épicerie | Charge |  |
| 5950 | Frais bancaires | Charge |  |
| 5970 | Amortissement | Charge |  |

### Autres produits et charges (6xxx)

| Code | Nom | Type RBooks | Remarque |
|---|---|---|---|
| 6000 | Autres dépenses | Autre charge | Compte système (ne peut pas être supprimé). |
| 6010 | Gain ou perte de change | Autre charge | Compte système (ne peut pas être supprimé). |
| 6020 | Rabais d'achat | Autre charge | Compte système (ne peut pas être supprimé). |
| 6030 | Rabais accordés | Autre revenu | Compte système (ne peut pas être supprimé). |
| 6040 | Intérêts sur emprunts | Autre charge |  |

## Points particuliers à valider

- Deux comptes « revenus reçus / perçus d'avance » (2300 et 2310) viennent de Bigcapital (comptes système distincts) ; un seul suffira peut-être.
- « Rabais accordés » (6030) garde le type « autre revenu » de Bigcapital.
- Pas de comptes pour : TVH (hors Québec), impôts sur le revenu de la société, dons, créances douteuses, immobilisations incorporelles. À ajouter selon le client.
- Les charges 5100 à 5910 suivent les catégories de la capture, pas une classification fiscale (T2125, CO-17). Le CPA peut les regrouper.
- Le plan est semé à la création : le modifier ensuite se fait dans Comptabilité > Plan comptable.

## Organisation de démo

L'organisation de démo existante (plan à 5 chiffres, noms traduits) n'a PAS été remplacée. On y a seulement AJOUTÉ les comptes manquants, sans toucher aux autres : retenues, cotisations et salaires à payer (2150, 2200 à 2280), et les charges alignées sur la capture (5010, 5020, 5060 à 5090, 5100 à 5910). Les comptes TPS/TVQ à payer et à recevoir de la démo gardent leurs codes 20007, 20008, 10011 et 10012 (la capture les retrouve par code ou par nom).

## Test

Un espace de travail de test (langue `fr`, pays `CA`, devise `CAD`) a été créé par l'API `POST /api/workspaces` puis supprimé : 72 comptes en français, un seul compte par taxe, taux TPS 5 %, TVQ 9,975 % et groupe « TPS + TVQ » reliés aux bons comptes. Un espace en anglais (`en`, `CA`, `CAD`) a donné le plan Bigcapital habituel (38 comptes). Tests unitaires : `packages\server\src\modules\RBooksQuebecTax\quebecChart.spec.ts`.
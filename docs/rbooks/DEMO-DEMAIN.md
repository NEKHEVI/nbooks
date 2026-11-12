# Démo RBooks : guide pour demain matin

Données 100 % fictives. Aucun vrai client, aucun vrai courriel.

## Ouvrir la démo

1. Vérifier que Docker Desktop tourne et que les serveurs répondent :
   - interface : http://localhost:4000
   - API : http://localhost:3000 (le fichier `C:\DEV\CODEGOD\RAWLF\_tmp_rbooks\SERVEUR-PRET.txt` existe quand elle répond)
2. Ouvrir http://localhost:4000 et se connecter.
   - Courriel : `demo@rbooks.test`
   - Mot de passe : dans le fichier `C:\DEV\CODEGOD\RAWLF\secrets\rbooks-demo.txt` (le copier, ne pas l'afficher à l'écran devant le client).
3. Organisation : « Entreprise Démo RBooks inc. » (CAD, America/Toronto).

Si les serveurs sont arrêtés (redémarrage de l'ordinateur) : suivre `C:\DEV\CODEGOD\RAWLF\rbooks\docs\rbooks\DEMARRAGE.md`, sections 2 et 4 seulement (`docker compose up -d`, puis `pnpm run dev:server` et `pnpm run dev:webapp` dans un PowerShell avec `fnm use 18.16.1`). Les données restent dans MariaDB (volume Docker), il n'y a rien à recréer.

## Parcours de démo en 8 étapes

1. **Tableau de bord** : montrer l'organisation en dollars canadiens.
2. **Ventes > Factures** : ouvrir la liste. Quatre factures : FAC-0001 à FAC-0004, une déjà payée (FAC-0001).
3. **FAC-0001** (ouvrir le tiroir de détail) : 100,00 $ avant taxes, **TPS [5%] 5,00**, **TVQ [9.975%] 9,98**, total **114,98 $**. Souligner que les deux taxes sont séparées.
4. **FAC-0002** (cliquer « Éditer » pour montrer l'entrée) : sur la même ligne, le taux choisi est « TPS + TVQ [14.975%] ». Montrer la liste déroulante de taxes : TPS, TVQ et le groupe « TPS + TVQ ». TPS 34,38 / TVQ 68,58 / total 790,46 $.
5. **FAC-0003** : facture en **taxes incluses** (574,88 $ = 500,00 $ + TPS 25,00 + TVQ 49,88). Le total ne change pas.
6. **Télécharger / imprimer le PDF** d'une facture (menu du tiroir) : deux lignes de taxes, « TPS (5%) » et « TVQ (9.975%) ».
7. **Achats > Factures fournisseurs** : PE-88123 (station-service, 85,00 $ + taxes = 97,73 $) et QR-4471 (quincaillerie, 104,63 $). Les taxes payées vont aux comptes « TPS à recevoir (CTI) » et « TVQ à recevoir (RTI) ».
8. **Rapports** : *Bilan* (TPS à payer 74,38 $, TVQ à payer 148,39 $, TPS à recevoir 8,80 $, TVQ à recevoir 17,56 $, bilan équilibré à 1 816,63 $) et *État des résultats* (revenus 1 567,50 $, dépenses 176,00 $, bénéfice 1 391,50 $). Terminer par le rapport *Sommaire de la taxe de vente* (TPS 74,38 $ et TVQ 148,39 $ séparées).

Clients fictifs : Boulangerie Le Pétrin inc., Cabinet Tremblay & Associés, Garage Lévesque 2000 inc.
Fournisseurs fictifs : Petro-Express Québec (station-service), Quincaillerie Rouleau et fils, Papeterie Bureau Plus.

## Ce qui ne marche pas encore (le dire franchement au client)

- **Interface en anglais** : le français est fait dans une autre branche (`rbooks/06-francais`) et n'est pas fusionné. Seuls les comptes de taxe et les taux de la démo sont en français.
- **Création d'un groupe de taxes dans l'écran Taxes** : l'écran ne propose pas encore la case « Groupe ». Le groupe « TPS + TVQ » existe (créé à l'ouverture de l'organisation) et l'API accepte `isGroup` et `componentIds`.
- **Total affiché pendant la saisie** : le formulaire calcule avec le taux combiné 14,975 % ; le serveur recalcule chaque taxe par ligne à l'enregistrement. Un écart d'un cent peut apparaître avant d'enregistrer, jamais après.
- **Numéros de TPS/TVQ de l'entreprise** : pas encore imprimés sur le PDF.
- **Dépenses** (module Dépenses) : pas de taxes. Saisir les achats comme factures fournisseurs.
- **Base imposable du rapport de taxe de vente** : rattachée au groupe « TPS + TVQ », pas à chaque taxe (les montants de taxe, eux, sont séparés).
- **Comptabilité de caisse** : les paiements en base de caisse ne séparent pas encore TPS et TVQ (la démo est en comptabilité d'exercice).
- **Part non récupérable** (repas 50 %), TVH, exportations : pas faits.
- **Conteneur Garage (fichiers joints, logo)** : redémarre en boucle, donc pas de pièces jointes ni de logo.
- **Courriels** : aucun serveur de courriel configuré (envoi de factures impossible).
- Une organisation créée AVANT cette tâche n'a pas les taxes du Québec ; seules les nouvelles organisations en CAD les reçoivent.
# Démo RBooks : guide unique pour demain matin

Données 100 % fictives. Aucun vrai client, aucun vrai courriel. Dernière vérification : 2026-11-12, démarrage à froid testé (tout arrêté, puis relancé avec le script ci-dessous).

## 1. Tout démarrer (une commande)

```powershell
powershell -ExecutionPolicy Bypass -File C:\DEV\CODEGOD\RAWLF\demarrer-demo-rbooks.ps1
```

Le script lance Docker Desktop au besoin, puis MariaDB/Redis/Gotenberg/ClickHouse/Garage, le serveur (3000), l'interface (4000) et l'app de capture (4100). Il ne relance pas ce qui tourne déjà. Compter 1 à 4 minutes à froid. À la fin il affiche les adresses :

- RBooks : http://localhost:4000 (courriel `demo@rbooks.test`, mot de passe dans `C:\DEV\CODEGOD\RAWLF\secrets\rbooks-demo.txt`, à copier sans l'afficher devant le client)
- Capture (ordinateur) : http://localhost:4100
- Capture (téléphone) : `http://<IP de l'ordi>:4100`, même Wi-Fi (le script affiche l'IP). Une seule fois, pare-feu (PowerShell administrateur) : `New-NetFirewallRule -DisplayName "RBooks Capture 4100" -Direction Inbound -Protocol TCP -LocalPort 4100 -Action Allow -Profile Private`

Tout arrêter (Docker reste en marche) : `powershell -ExecutionPolicy Bypass -File C:\DEV\CODEGOD\RAWLF\arreter-demo-rbooks.ps1`

Journaux en cas de problème : `C:\DEV\CODEGOD\RAWLF\_tmp_rbooks\` (`dev-server.log`, `dev-webapp.log`, `capapp.log`).

Organisation : « Entreprise Démo RBooks inc. » (CAD, America/Toronto), **langue : français** (déjà réglée). Les noms du plan comptable ont été traduits en français.

## 2. Parcours de démo (≈ 15 minutes)

Captures de référence (ce que vous devez voir) : `C:\DEV\CODEGOD\RAWLF\rbooks\docs\rbooks\captures-demo\` (01 à 12).

1. **Connexion et accueil** : écran en français, nom « RBooks ». Montrer l'organisation en dollars canadiens.
2. **Ventes > Factures** : quatre factures FAC-0001 à FAC-0004, FAC-0001 payée.
3. **FAC-0001** (cliquer la ligne, tiroir de détail) : 100,00 $ avant taxes, **TPS [5%] 5,00**, **TVQ [9.975%] 9,98**, total **114,98 $**. Les deux taxes sont séparées.
4. **FAC-0002** (« Modifier la facture ») : sur une même ligne, taux « TPS + TVQ [14.975%] ». Montrer la liste déroulante. TPS 34,38 / TVQ 68,58 / total 790,46 $.
5. **FAC-0003** : taxes incluses (574,88 $ = 500,00 + TPS 25,00 + TVQ 49,88).
6. **Taux de taxe** (menu Préférences, ou http://localhost:4000/tax-rates) : TPS, TVQ, « TPS + TVQ (Groupe) ». **Nouveau** : montrer la case « Groupe », le choix des taxes et le taux du groupe calculé (14,975 %). Ne pas enregistrer un groupe de test, ou le supprimer ensuite.
7. **PDF** d'une facture (Imprimer) : lignes « TPS (5%) » et « TVQ (9.975%) ».
8. **Achats > Factures fournisseurs** : PE-88123 (97,73 $) et QR-4471 (104,63 $).
9. **Rapports** (comptabilité d'exercice par défaut) : *Bilan* (TPS à payer 74,38 $, TVQ à payer 148,39 $, TPS à recevoir 8,80 $, TVQ à recevoir 17,56 $, actifs 1 816,63 $ = passifs et avoir) ; *État des résultats* (revenus 1 567,50 $, dépenses 176,00 $, bénéfice 1 391,50 $) ; *Sommaire de la taxe de vente* (TPS 74,38 $ et TVQ 148,39 $).
10. **Capture par téléphone jusqu'à la facture fournisseur** (voir `C:\DEV\CODEGOD\RAWLF\rbooks-capture\DEMO.md`) :
    1. Ouvrir http://<IP>:4100 (ou localhost:4100). Bandeau « Mode démo (cache) » : aucune IA payante.
    2. « Charger les factures de test » : 10 photos, 4 doublons écartés, un reçu RONA recollé, 5 factures à vérifier.
    3. Onglet « À vérifier » : montants lus, alertes (pas de no de TPS/TVQ, etc.). « Corriger » une valeur pour montrer l'alerte d'équilibre.
    4. **Approuver** la facture RONA (327,89 $) : elle est envoyée tout de suite à RBooks.
    5. Dans RBooks, **Achats > Factures fournisseurs** : `CAP-D0002-...`, fournisseur « RONA+ Anjou », total **327,89 $**, deux photos jointes (vérifié par l'API ; le tiroir n'affiche pas encore la liste des pièces jointes).
    6. Remettre à zéro entre deux démos : bouton « Remettre la démo à zéro » dans la capture, puis supprimer la facture `CAP-...` dans RBooks (sinon les totaux des rapports changent). L'état actuel est propre : aucun envoi de test dans RBooks.

## 3. Ce qu'il ne faut PAS cliquer / ce qui ne marche pas encore

- **Montants formatés** : les rapports et le tiroir affichent `CA$1,816.63` (format anglais) ; le français `1 234,56 $` ne s'applique qu'aux champs gérés par le navigateur. À dire franchement si on le demande.
- **Textes encore en anglais** : noms des taux de taxe par défaut (« Tax on Sales », etc.), descriptions de ces taux, « Discount » dans le tiroir, certains écrans secondaires (mots en dur dans le code). Éviter les écrans Paramètres avancés, importations, API.
- **Courriels** : aucun serveur de courriel. Ne pas cliquer « Envoyer par courriel » (échec), ni « Mot de passe oublié ».
- **Pièces jointes** : le téléversement et le lien à une facture fonctionnent (Garage réparé), mais le tiroir n'affiche pas la liste ; le logo de l'organisation n'a pas été testé.
- **Capture** : la facture fournisseur créée met TPS et TVQ en lignes de dépense (pas de CTI/RTI automatiques) et reprend la date de la photo (RONA : 2026-06-12, donc « En retard »). Le mode « Lecture IA réelle » n'est pas activé (aucune clé).
- **Dépenses** (module Dépenses) : pas de taxes ; saisir les achats comme factures fournisseurs.
- **Base de caisse** : en comptabilité de caisse les paiements ne séparent pas TPS et TVQ. Les rapports sont réglés par défaut sur « comptabilité d'exercice » ; ne pas basculer sur « Comptant » pendant la démo (le Bilan perd la TPS/TVQ séparées).
- **Total pendant la saisie** d'une facture : calculé avec le taux combiné 14,975 % ; le serveur recalcule par taxe à l'enregistrement (écart possible d'un cent avant d'enregistrer).
- **Numéros de TPS/TVQ de l'entreprise** : pas imprimés sur le PDF. Part non récupérable (repas 50 %), TVH, exportations : pas faits.
- Colonne « Taux » du tiroir de facture = prix unitaire (comportement hérité) ; elle n'est pas le taux de taxe.
- Le serveur tourne en mode développement (compilation à chaud) : ne pas modifier de fichiers pendant la démo.

## 4. Si quelque chose casse

- Le serveur ne répond pas : relancer le script de démarrage (rien n'est perdu, les données sont dans le volume Docker MariaDB).
- Garage (fichiers joints) en boucle de redémarrage : vérifier `GARAGE_RPC_SECRET` (64 caractères hexadécimaux) et `GARAGE_ADMIN_TOKEN` dans `C:\DEV\CODEGOD\RAWLF\rbooks\.env` (jamais commités). Les clés S3 de l'organisation sont dans le même fichier.
- Reconnexion : mot de passe dans le fichier de secrets (ne jamais l'afficher).
- Captures d'écran de contrôle : `node docs\rbooks\captures-demo\capturer.cjs` depuis `C:\DEV\CODEGOD\RAWLF\rbooks` (Node 18, headless, aucune fenêtre).
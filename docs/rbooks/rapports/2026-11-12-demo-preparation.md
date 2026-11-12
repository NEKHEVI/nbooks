# Préparation de la démo (2026-11-12, soirée)

Guide unique : `docs/rbooks/DEMO-DEMAIN.md`. Captures headless : `docs/rbooks/captures-demo/` (scripts `capturer.cjs`, `capturer-groupe.cjs`, `capturer-capture.cjs`).

## Fait
- Rebuild shared, server, webapp ; serveur 3000 et interface 4000 relancés. `ACCEPTED_LOCALES` contient `fr`. Tests : fr.spec + QuebecTax 59/59 ; suite complète 592/593 (même échec préexistant `TransactionsByCustomersPdf.spec.ts`).
- Organisation de démo passée en `fr`. Comptes par défaut renommés en français par l'API (stockés en base).
- Bogue corrigé : `moment/locale/fr-ca` (import dynamique non analysable par Vite en dev) bloquait l'affichage de l'application en français ; table d'imports explicites dans `AppIntlLoader.tsx`.
- Rapports (bilan, état des résultats, balance, flux, taxe de vente) : base par défaut passée de « comptant » à « exercice » (la base de caisse ne sépare pas TPS/TVQ).
- Écran de connexion : logo « Bigcapital » remplacé par le mot-symbole RBooks.
- Tiroir de facture : « Send Mail » et « Adjustment » traduits. Écran Taux de taxe : titre, colonnes, boutons, formulaire traduits.
- **Groupes de taxes dans l'écran Taux de taxe** : case « Groupe », choix des composantes, taux calculé. Essai réel (groupe créé puis supprimé).
- **Garage** : cause = `GARAGE_RPC_SECRET` vide dans `.env` (le conteneur exige 64 caractères hexadécimaux). Secrets générés dans `.env` (ignoré par git), disposition du nœud, bucket `bigcapital`, clé `bigcapital` créés avec `docker exec bigcapital-garage /garage ...` (l'image n'a pas de bash, donc `setup.sh` ne peut pas tourner), `S3_ENDPOINT=http://localhost:3900` (le serveur tourne sur l'hôte). Bogue corrigé dans `Attachments.controller.ts` : `import mime from 'mime-types'` donnait `undefined` (500 au téléchargement) → `import * as mime`. Vérifié : téléversement, lien à une facture, téléchargement (200, image/png).
- **Capture de bout en bout** (rbooks-capture) : correction de `rbooks.py` (la connexion renvoie `access_token`/`organization_id` en snake_case ; champ `account_root_type` ; compte de dépense par défaut « Frais de bureau »). RONA 327,89 $ approuvée → facture fournisseur `CAP-D0002-...`, total 327,89 $, 2 photos jointes. Envoi de test supprimé ensuite (état de démo propre : 2 factures fournisseurs), capture remise à zéro.
- Scripts `demarrer-demo-rbooks.ps1` et `arreter-demo-rbooks.ps1` (racine RAWLF). Test à froid réussi (tout arrêté, y compris les conteneurs).

## Reste
Voir la section 3 de `DEMO-DEMAIN.md` (formats de montants anglais dans les rapports, textes en dur, courriels, liste des pièces jointes dans le tiroir).
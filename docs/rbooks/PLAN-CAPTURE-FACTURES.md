# Plan : capture des factures (portage du pipeline Python en module RBooks)

Lecture seulement, aucun code écrit. Source lue : `C:\DEV\CODEGOD\RAWLF\QUICKBOOK-FACTURE TEST\depenses\` (`depenses.py` 625 lignes, `README.md`, `categories.json`, `marchands.json`, `requirements.txt`). Aucune clé API lue ni copiée ; aucune lecture IA lancée.

## 1. Ce que fait le Python aujourd'hui

Entrée : dossier de photos par employé. Sorties : CSV (transactions, à vérifier, par employé, écritures de journal, format QuickBooks, trimestres, estimés). Étapes, dans l'ordre :

1. Inventaire des photos (`.jpg .jpeg .png .webp .heic .heif`), employé = sous-dossier.
2. Doublons : SHA-256 du fichier, puis empreinte visuelle dHash 16x16 (distance de Hamming <= 6).
3. Prétraitement : rotation EXIF, contraste CLAHE (espace LAB), réduction à 1568 px, JPEG qualité 90.
4. Lecture par Claude Vision avec un prompt JSON strict (marchand, no TPS, no TVQ, date, articles, sous-total, TPS, TVQ, TVH, pourboire, total, mode de paiement, 4 derniers chiffres de carte, no d'autorisation, fragment haut/milieu/bas, confiance, notes). Modèle rapide d'abord (Haiku), escalade vers Sonnet si confiance < 0,8 ou calcul incohérent. Résultat mis en cache par SHA (jamais payé deux fois).
5. Fusion des reçus photographiés en plusieurs morceaux, clé = employé + no d'autorisation (>= 4 caractères).
6. Marchand retrouvé par numéro de TPS (registre `marchands.json` + autres reçus du lot).
7. Validation, catégorie (règles apprises par no de TPS puis mots-clés de `categories.json`), calcul CTI/RTI et part déductible.
8. Sorties comptables, trimestres, estimés.

## 2. Règles à reprendre (liste de référence)

Montants (toujours en `Decimal`, arrondi `ROUND_HALF_UP` à 0,01 ; en TypeScript : decimal.js ou entiers de cents) :

- R1 Lecture des nombres : `D()` accepte « 1 234,56 $ », « 1,234.56 », nombres ; si virgule et point présents, le dernier séparateur est la décimale.
- R2 Constantes : TPS 5 %, TVQ 9,975 %, tolérance de calcul 0,03 $.
- R3 Cohérence : si total illisible, erreur « Total illisible ». Si sous-total et au moins une taxe : sous-total + TPS + TVQ + TVH + pourboire = total (écart <= 0,03). Si « montant avant pourboire » et pourboire : leur somme = total.
- R4 Escalade : confiance < 0,8 ou calcul incohérent => relecture avec le modèle précis.
- R5 Alerte « Confiance de lecture faible » si confiance < 0,7 ; alerte « Date illisible » si date nulle.
- R6 TPS <= 5,05 % du sous-total sinon alerte ; pourboire > 25 % du montant avant pourboire sinon alerte.
- R7 Taxes non détaillées (reçu de terminal) et catégorie avec CTI/RTI > 0 : base = (total - pourboire) / 1,14975 ; TPS = base x 5 %, TVQ = base x 9,975 % ; marquées « estimées » (alerte, CTI/RTI NON réclamés).
- R8 Sous-total manquant : total - pourboire - taxes.
- R9 CTI/RTI : réclamables seulement si le fournisseur a un no de TPS lisible, ou si le total < 30 $ ; sinon alerte « Demander la facture détaillée » (total >= 30 $). Ratio de la catégorie (repas 0,5). CTI = (TPS + TVH) x ratio ; RTI = TVQ x ratio ; dépense nette = total - CTI - RTI ; montant déductible = net x part déductible de la catégorie (repas 0,5).
- R10 Catégorie : 1) règle apprise par no de TPS ou nom de marchand ; 2) mots-clés (regex insensible à la casse) sur marchand + suggestion du modèle + articles, la catégorie avec le plus de correspondances gagne, égalité = première dans la liste ; 3) sinon « 5900 À classer » + alerte. Catégories (`categories.json`) : 5100 Carburant, 5110 Entretien véhicule, 5120 Stationnement et péages, 5200 Repas et représentation (50 %/50 %), 5300 Déplacements et hébergement, 5400 Fournitures de bureau, 5410 Matériel et outillage, 5420 Informatique, 5500 Logiciels et abonnements, 5600 Télécommunications, 5700 Formation, 5800 Santé et avantages (alerte, CTI 0), 5900 À classer.
- R11 Doublon de transaction : même (date, total, no d'autorisation ou marchand) => alerte « Doublon probable ».
- R12 Le registre des marchands s'enrichit seul (no TPS => marchand + catégorie) et peut être corrigé à la main ; la correction s'applique aux prochains reçus.
- R13 Statut : `A_VERIFIER` dès qu'il y a une alerte, sinon `OK`. Les « infos » (reçu reconstitué, marchand déduit) ne bloquent pas.
- R14 Fusion : champs vides complétés par les autres morceaux, articles sans doublons, notes concaténées, confiance = minimum.
- R15 Trimestre fiscal avec début d'exercice configurable ; estimés : >= 8 trimestres saisonnier x tendance (bornée 0,5 à 2), 2-7 moyenne pondérée, 1 reconduction. (Reporter, mais pas dans la première version du module.)
- R16 Écritures (partie double) : dépense nette (débit), TPS à recevoir (débit), TVQ à recevoir (débit), à rembourser à l'employé (crédit = total). Comptes de bilan du Python : 1210, 1220, 2150.
## 3. Ce qui existe déjà dans RBooks (Bigcapital) et qu'on réutilise

- Pièces jointes : `packages/server/src/modules/Attachments/`. `POST /attachments` (champ `file`, `Attachments.controller.ts`, `S3UploadPipeline.ts`) téléverse vers S3/Garage et crée un `DocumentModel` avec une `key`. Les documents acceptent ensuite `attachments: [{ key }]` dans leur DTO (`Bill.dto.ts`, `Expense.dto.ts`) ; les subscribers `events/AttachmentsOnBills.ts` et `AttachmentsOnExpenses.ts` valident et lient les clés à la création. Aussi `LinkAttachment.ts` pour lier après coup.
- Factures fournisseurs : `modules/Bills/` (`CreateBill.service.ts`, DTO `Bill.dto.ts` : `billNumber`, `billDate`, `dueDate`, `vendorId`, `entries[]` avec `taxRateId`, `attachments`). Elles portent les taxes (voir `PLAN-QUEBEC.md`).
- Dépenses : `modules/Expenses/` (`CreateExpense.service.ts`, DTO `Expense.dto.ts` : `paymentAccountId`, `categories[]` avec `expenseAccountId` et `amount`, `payeeId`, `publish`, `attachments`). Aucune taxe aujourd'hui.
- Fournisseurs : `modules/Vendors/`. Files d'attente : BullMQ déjà présent (`@nestjs/bullmq`, exemples `modules/Auth/processors/*.processor.ts`).
- Absent des dépendances du serveur : lecteur d'images (sharp), SDK Anthropic, decimal.js, conversion HEIC. À ajouter dans le module seulement.

## 4. Architecture proposée

Nouveau module serveur `packages/server/src/modules/RBooksCapture/` (aucun fichier d'upstream modifié sauf l'enregistrement du module dans `app.module.ts`) et un nouveau dossier webapp `packages/webapp/src/containers/RBooksCapture/`.

### 4.1 Tables tenant (migrations RBooks)

- `capture_documents` : `id`, `status` (`RECU`, `LECTURE`, `A_VERIFIER`, `PRET`, `COMPTABILISE`, `REJETE`, `DOUBLON`), `employee_user_id`, `attachment_key` (fichier original), `sha256`, `dhash`, `duplicate_of_id`, `merged_into_id`, `extraction_json`, `model_used`, `confidence`, `alerts_json`, `category_code`, `vendor_id`, `created_bill_id` ou `created_expense_id`, horodatages.
- `capture_merchant_rules` : `tax_no` (no de TPS normalisé), `merchant_name`, `expense_account_id`, `source` (appris ou manuel). Remplace `marchands.json`.
- `capture_categories` : `code`, `name`, `account_id`, `deductible_ratio`, `recoverable_ratio`, `keywords` (regex), `warning`. Remplace `categories.json` ; semée avec les 13 catégories actuelles, éditable dans l'interface, chaque catégorie liée à un compte de dépense du plan comptable.

### 4.2 Services (NestJS, TypeScript)

1. `CaptureUploadService` : reçoit la photo, calcule SHA-256 (`crypto`) et dHash (sharp : niveaux de gris, 17x16), écarte les doublons (R2), téléverse via le module Attachments, crée `capture_documents`, met un travail en file BullMQ.
2. `CaptureImagePrepService` : rotation EXIF, réduction 1568 px, contraste (sharp `.clahe()`), JPEG 90 ; HEIC converti par `heic-convert` (iPhone).
3. `CaptureReadingService` : appelle l'API Messages d'Anthropic avec le MÊME prompt JSON (à copier tel quel dans un fichier `capture-prompt.ts` pour garder la parité), modèle rapide puis escalade vers le modèle précis (R4), validation du JSON (zod). Clé dans `ANTHROPIC_API_KEY` du `.env` du serveur seulement, jamais envoyée au navigateur. Cache par SHA dans `capture_documents.extraction_json`. Plafond mensuel de dépense configurable (variable d'environnement) et compteur d'appels.
4. `CaptureValidationService` : règles R1 à R9, R11, R13 en fonctions pures testables (aucune dépendance à Nest), avec decimal.js.
5. `CaptureMergeService` : R14 (fusion par no d'autorisation) ; les morceaux fusionnés pointent vers le document principal.
6. `CaptureCategorizeService` : R10 et R12 (règles apprises, mots-clés, apprentissage à la validation humaine).
7. `CapturePostingService` : crée l'écriture à partir d'un document validé (section 4.4).
8. `CaptureController` : `POST /capture/upload` (multipart, plusieurs fichiers), `GET /capture/documents?status=`, `GET /capture/documents/:id`, `PATCH /capture/documents/:id` (corrections), `POST /capture/documents/:id/approve`, `POST /capture/documents/:id/reject`, `POST /capture/documents/:id/merge`. Permissions : nouveau sujet de rôle « Capture » (voir `modules/Roles/`).

### 4.3 Capture sur téléphone et caméra

- Page webapp `/capture` adaptée au cellulaire : `<input type="file" accept="image/*" capture="environment" multiple>` (ouvre la caméra arrière sur iPhone et Android, aucune application à installer), glisser-déposer sur ordinateur, et bouton « Caméra » en `getUserMedia` (HTTPS obligatoire hors localhost). Aperçu, bouton « Ajouter une autre partie du reçu » pour les reçus longs, envoi de plusieurs photos, état de chaque photo (reçue, lue, à vérifier).
- Employés : un utilisateur RBooks à rôle limité « Capture seulement » (peut téléverser et voir ses propres reçus) ; le dossier par employé du Python devient `employee_user_id`.
- Option plus tard : adresse courriel de dépôt ou lien partageable par employé.

### 4.4 File « à vérifier » et comptabilisation

- Écran « À vérifier » : liste filtrable (statut, employé, alerte), photo à gauche, champs lus à droite avec les alertes en évidence, modification des montants et de la catégorie, boutons Approuver / Rejeter / Fusionner. Une correction de catégorie crée ou met à jour la règle marchande (R12).
- Un reçu `OK` sans alerte passe à `PRET` ; la comptabilisation automatique est désactivée par défaut (réglage « approuver avant de comptabiliser »).
- Comptabilisation (`CapturePostingService`) :
  - Option recommandée : **facture fournisseur** (Bill) créée et marquée payée par l'employé : fournisseur trouvé ou créé par no de TPS (`Vendors`), une ligne par reçu avec le compte de dépense de la catégorie et la taxe TPS+TVQ de la tâche 02, pièce jointe = photo originale (`attachments: [{ key }]`). Le paiement à l'employé passe par un compte « Comptes de dépenses à rembourser » (équivalent du 2150 du Python) via un paiement de facture ou un journal.
  - Pourquoi pas `Expenses` : le module n'a pas de taxes ; il faudrait d'abord les y ajouter. À trancher avec la tâche 02.
  - Part non récupérable des repas (50 %) : ligne de taxe avec `recoverable_ratio` 0,5 (tâche 02, table `item_entry_taxes`).
  - Idempotence : `created_bill_id` empêche une double comptabilisation ; tout se fait dans une transaction (`UnitOfWork`).
- Exports CSV du Python (trimestres, estimés, QuickBooks) : non repris dans la première version ; les rapports de RBooks les remplacent. Les estimés (R15) viendront en tâche ultérieure.

## 5. Plan de tests

- Parité : exécuter le Python sur les reçus d'essai (le dossier `sortie` existant sert de référence) et vérifier que les fonctions TypeScript donnent les mêmes montants (CTI, RTI, net, déductible) sans appeler l'IA : on rejoue les JSON en cache `cache\<sha>.json`.
- Unitaires : R1 à R14, y compris 1 234,56 $, taxes estimées, seuil de 30 $, repas à 50 %, catégorie à égalité, fusion de 3 morceaux.
- Intégration : photo -> file -> à vérifier -> approuvée -> Bill avec pièce jointe -> écritures équilibrées. L'appel Anthropic est remplacé par un double (mock) ; un seul test manuel avec une vraie clé et un reçu fictif, à lancer par Frederic.

## 6. Risques

1. **Coût et clé API** : plafond mensuel, cache par SHA, pas de relecture automatique ; clé seulement côté serveur.
2. **Vie privée (Loi 25)** : les photos contiennent des noms, des 4 derniers chiffres de carte et des adresses ; envoi à Anthropic à documenter dans la politique de confidentialité du client, conservation et suppression des photos à définir.
3. **Erreurs de lecture** : l'IA peut inventer ou confondre ; toujours valider les montants en code (R3, R6) et garder l'humain dans la boucle au début.
4. **HEIC et grosses photos** : conversion et limite de taille (par exemple 15 Mo) ; vérifier le plafond de `FileInterceptor` et du proxy.
5. **Dépendance à la tâche 02** : sans TPS/TVQ séparées sur la ligne, la facture fournisseur ne peut pas séparer CTI et RTI.
6. **Fuseaux et dates** : « 06/12/26 » ambigu ; garder la règle du prompt (déduire le format du contexte) et alerter si la date est dans le futur.
7. **Fichiers d'upstream** : on n'ajoute qu'un module ; seul `app.module.ts` est modifié.
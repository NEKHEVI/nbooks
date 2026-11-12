# Rapport tâche 01 : mise en place de RBooks (2026-11-12)

## Résumé

| Étape | État |
|---|---|
| 1. Git (remote upstream, branche books/main, UPSTREAM.md) | Fait |
| 2. AGPL (NOTICE.md, lien « Code source » via RBOOKS_SOURCE_URL) | Fait |
| 3. Nom affiché RBooks + logo texte temporaire | Fait (liste ci-dessous) |
| 4. Démarrage local | PARTIEL : Node 18.16.1, pnpm 9, pnpm install, uild:server, uild:shared OK ; BLOQUÉ à Docker (voir Blocages). Créer le compte et la facture de test reste à faire. DEMARRAGE.md écrit. |
| 5. Tests de référence | Fait (chiffres ci-dessous) |
| 6. PLAN-QUEBEC.md | Fait |
| 7. PLAN-CAPTURE-FACTURES.md | Fait |
| 8. Commit local | Fait sur books/main (aucun push) |

## Blocages

- **Docker Desktop ne démarre pas son moteur** : lancé à 12:40 (heure locale), toujours sans réponse après plus de 15 minutes (docker version et docker info ne retournent pas de serveur ; le processus mmem existe). Sans MariaDB et Redis, impossible de lancer les migrations, le serveur, de créer le compte de test ni la facture. Pas d'interaction avec l'écran faite (la machine est utilisée). Commande à lancer dès que Docker répond (voir DEMARRAGE.md, sections 2 à 5) :
  `cd C:\DEV\CODEGOD\RAWLF\rbooks; docker compose up -d; pnpm run system:migrate:latest; pnpm run dev:server`
  Si Docker reste bloqué : fermer Docker Desktop, wsl --shutdown, rouvrir Docker Desktop.
- Le pnpm global de la machine exige Node 22.13 ; j'ai installé pnpm@9.15.9 dans le Node 18 de fnm (le fichier de verrouillage est en version 9).
- Le hook git pre-commit (.husky/pre-commit) exécute 
pm run format puis git add -A : il doit être lancé dans un PowerShell où nm use 18.16.1 est actif, sinon le commit échoue. Il a donc regroupé tout dans un seul commit.

## Tests de référence (serveur, pnpm run test, Jest)

- AVANT toute compilation (les paquets partagés n'étaient pas compilés), sur le dépôt non modifié : 90 suites réussies, 13 suites non exécutées (erreur TS2307 « Cannot find module @bigcapital/utils / pdf-templates »), 486 tests réussis, 0 test échoué.
- APRÈS pnpm run build:server, avec nos modifications : 102 suites sur 103 réussies ; 533 tests sur 534 réussis. Le seul échec est src/modules/FinancialStatements/modules/TransactionsByCustomer/TransactionsByCustomersPdf.spec.ts (convertToPdf appelé avec deux arguments undefined de plus que prévu) : sans lien avec nos changements (aucun fichier touché dans ce module), à considérer comme un échec d'upstream. Je n'ai pas relancé cette suite sur le code non modifié après compilation.
- Test modifié pour le renommage : modules/BankingPlaid/queries/GetPlaidLinkToken.service.spec.ts (nom du client Plaid par défaut « RBooks »).

## Fichiers modifiés pour le nom affiché (étape 3)

Seuls les textes affichés ont changé : aucun paquet @bigcapital/*, dossier, identifiant de code, clé STORAGE_KEY ni clé de langue n'a été renommé.

- `packages/server/src/common/config/plaid.ts`
- `packages/server/src/modules/BankingPlaid/queries/GetPlaidLinkToken.service.spec.ts`
- `packages/server/src/modules/Auth/AuthMailMessages.esrvice.ts`
- `packages/server/src/modules/UsersModule/commands/SendInviteUsersMailMessage.service.ts`
- `packages/server/src/modules/CreditNotes/constants.ts`
- `packages/server/src/modules/PaymentReceived/constants.ts`
- `packages/server/src/modules/SaleInvoices/constants.ts`
- `packages/server/src/modules/SaleReceipts/constants.ts`
- `packages/server/static/mail/ItemReorderPoint.html`
- `packages/server/static/mail/ResetPassword.html`
- `packages/server/static/mail/SignupVerifyEmail.html`
- `packages/server/static/mail/UserInvite.html`
- `packages/webapp/index.html`
- `packages/webapp/src/constants/app.tsx`
- `packages/webapp/src/lang/en/index.json`
- `packages/webapp/src/lang/ar/index.json`
- `packages/webapp/src/lang/es/index.json`
- `packages/webapp/src/lang/sv/index.json`
- `packages/webapp/src/containers/CashFlow/AccountTransactions/AccountTransactionsFilterTabs.tsx`
- `packages/webapp/src/containers/Dialogs/ExportDialog/ExportDialogFormContent.tsx`
- `packages/webapp/src/containers/GlobalErrors/GlobalErrors.tsx`
- `packages/webapp/src/containers/Import/ImportFileMapping.tsx`
- `packages/webapp/src/containers/PaymentPortal/InvoicePaymentPagePreview.tsx`
- `packages/webapp/src/containers/PaymentPortal/PaymentPage.tsx`
- `packages/webapp/src/containers/PaymentPortal/PaymentPortal.tsx`
- `packages/webapp/src/containers/Preferences/PaymentMethods/dialogs/StripePreSetupDialog/StripePreSetupDialogContent.tsx`
- `packages/webapp/src/containers/Sales/CreditNotes/CreditNoteSendMailDrawer/_constants.ts`
- `packages/webapp/src/containers/Sales/Estimates/EstimateSendMailDrawer/_constants.ts`
- `packages/webapp/src/containers/Sales/Invoices/InvoiceCustomize/InvoiceMailReceiptPreview.tsx`
- `packages/webapp/src/containers/Subscriptions/TrialStatus.tsx`

Autres fichiers :

- packages/webapp/src/static/json/icons.tsx : les icônes igcapital et mini-bigcapital (logos) remplacées par un logo texte « RBooks » en pixels (temporaire ; les noms d'icônes internes sont gardés).
- packages/server/static/images/bigcapital.png : logo des courriels remplacé par un PNG texte « RBooks » (temporaire).
- packages/webapp/src/constants/footerLinks.tsx : les liens Bigcapital (blogue, Discord, documentation) retirés ; reste seulement le lien « Code source ».

Non modifié volontairement : titres Swagger (main.ts, OpenApiExport.command.ts), exemples « BIGCAPITAL, INC » des fichiers *.swagger.ts, commentaires de code, fichier packages/webapp/public/bigcapital.svg (non affiché), texte des PDF (le gabarit shared/pdf-templates ne contient aucun « Bigcapital » ; le nom vient des données de l'organisation), README.md et DISCLAIMER d'upstream.

## Lien « Code source » (AGPL, étape 2)

- Variable d'environnement serveur RBOOKS_SOURCE_URL (vide par défaut = lien masqué) : packages/server/src/common/config/rbooks.ts, enregistrée dans config/index.ts, ajoutée à .env.example.
- Exposée par la réponse de métadonnées du tableau de bord (booksSourceUrl, Dashboard.service.ts et DTO, shared/sdk-ts mis à jour à la main : openapi.json et src/schema.ts).
- Affichée par DashboardFooter.tsx (en bas à droite, après connexion). Limite : le lien n'apparaît pas sur l'écran de connexion (les métadonnées exigent une session). À reprendre avec une route publique si Frederic veut le lien avant connexion (l'AGPL vise les utilisateurs du service).

## Autres constats utiles

- Compilation de l'interface (`pnpm run build:shared` puis `vite build` dans `packages\webapp`) : réussie avec nos modifications.

- Compte et facture de test : non faits (Docker).
- Fichier .env local créé avec un APP_JWT_SECRET généré (non affiché, ignoré par git).
- Le pré-commit reformate tout le monorepo avec Prettier ; il n'a produit aucun changement hors de nos fichiers (46 fichiers dans le commit).
- Pas de langue française dans l'interface (packages/webapp/src/lang/ : ar, en, es, sv).

## Prochaine tâche recommandée

Relancer l'étape 4 dès que Docker répond (migrations, serveur, compte test, une facture), puis la tâche 02 (TPS 5 % + TVQ 9,975 %), qui commence par la migration de précision DECIMAL(9,5) : voir PLAN-QUEBEC.md.
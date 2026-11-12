# Tâche 06 : français québécois (fr-CA)

Date : 2026-11-12. Branche : `rbooks/06-francais` (worktree `C:\DEV\CODEGOD\RAWLF\rbooks-wt-fr`), créée depuis `rbooks/main`. Aucune fusion, aucun push.

## Ce qui est fait

### Webapp
- `packages/webapp/src/lang/fr/index.json` : 2 491 clés, identiques à `en/index.json` (vérifié par script et par test). Variables (`{name}`, `{{x}}`) et HTML conservés. Vocabulaire québécois : facture, facture fournisseur, note de crédit, note de crédit fournisseur, soumission (estimate), grand livre, état des résultats, bilan, balance de vérification, comptes clients / comptes fournisseurs, encaissement, dépense, courriel, texto, succursale.
- `packages/webapp/src/lang/fr/authentication.tsx` et `locale.tsx` (messages de validation yup en français).
- Format de date du tableau : `date_formats` en `YYYY-MM-DD` (AAAA-MM-JJ). Les noms de mois viennent de moment `fr-ca`.
- Montants : nouveau fichier `packages/webapp/src/utils/locale-format.ts`, branché dans `formattedAmount` et `formattedNumber` (`packages/webapp/src/utils/index.tsx`). En français : `1 234,56 $` (espace insécable, virgule décimale, symbole après). L'anglais ne change pas.
- Enregistrement de la langue : `AppIntlLoader.tsx` (liste `SUPPORTED_LOCALES`, moment `fr` vers `fr-ca`) et `constants/languagesOptions.tsx` (choix « Français » dans les préférences générales).
- `services/axios.tsx` : l'en-tête `Accept-Language` était forcé à `ar` ; il suit maintenant le cookie `locale` (synchronisé avec la langue de l'organisation). Sans ça, le serveur ne recevait jamais `fr`.

### Serveur
- `packages/server/src/i18n/fr/` : 45 fichiers, 783 textes traduits (rapports financiers, champs d'import/export, gabarits PDF `paper`, courriels `mail.*`, journal d'audit, rôles par défaut Administrateur / Employé, types de transaction). Mêmes clés et mêmes variables que `en`.
- `ACCEPTED_LOCALES` = `['en', 'ar', 'fr']` dans `Organization.constants.ts` et `Organization/constants.ts` (sinon l'API refuse la langue `fr`).
- Le build serveur copie déjà `i18n/**/*` (nest-cli.json) : rien d'autre à faire.

### Tests
- `packages/server/src/i18n/fr.spec.ts` (nouveau, 48 tests) : mêmes fichiers, mêmes clés et mêmes variables entre `en` et `fr`, côté serveur et côté webapp. Résultat : 48/48 verts.
- Build webapp (`pnpm build:webapp`, Node 18.16.1, pnpm 9.15.9) : OK ; le fr est dans le paquet.

## Comment activer le français
1. Réglages > Préférences > Général > Langue : choisir « Français », enregistrer. L'application se recharge en français.
2. Pour une organisation neuve : le choix de langue se fait dans les mêmes réglages après la création. Les données de départ (comptes par défaut) sont créées à ce moment avec la langue de la requête.
3. Hors interface : cookie `locale=fr` ou `?lang=fr` dans l'URL.

## Ce qui reste / limites connues
- Courriels statiques en anglais (textes en dur, aucun mécanisme de langue) : `packages/server/static/mail/ResetPassword.html`, `SignupVerifyEmail.html`, `UserInvite.html`, `ItemReorderPoint.html`. Il faut une variante `*.fr.html` et un choix du gabarit selon la langue.
- Mots en dur dans le code TS/TSX qui ne passent pas par `intl` (non traduits) : à repérer à l'écran lors de la démo.
- Le sélecteur de format de date (préférences) affiche toujours les formats MM/DD, DD/MM, etc. ; l'option AAAA-MM-JJ y existe (`yy-mm-dd`).
- Le champ de saisie monétaire (`MoneyInputGroup`) et `formattedExchangeRate` (Intl avec locale du navigateur) n'ont pas été modifiés.
- Les comptes par défaut déjà créés avant le changement de langue gardent leur nom anglais (stockés en base).
- Traduction faite par IA : une relecture par une personne francophone avant la démo est recommandée (surtout les phrases longues des préférences).
- Ligne à ajouter à `docs/rbooks/JOURNAL.md` de `rbooks/main` (non ajoutée ici pour éviter un conflit de fusion) :
  `| 2026-11-12 | Tâche 06 : français québécois | Fait : webapp + serveur fr-CA, tests verts, build OK | docs/rbooks/rapports/2026-11-12-tache-06-francais.md |`
- Non vérifié visuellement dans un navigateur (le dossier `rbooks` et Docker n'ont pas été touchés).
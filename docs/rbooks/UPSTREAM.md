# Mises à jour depuis Bigcapital (upstream)

RBooks est basé sur Bigcapital (AGPL-3.0). Le remote `upstream` pointe vers le dépôt d'origine ; il n'y a PAS de remote `origin` (aucun push).

## Une fois par mois

```powershell
cd C:\DEV\CODEGOD\RAWLF\rbooks
git status                      # l'arbre doit être propre
git checkout rbooks/main
git fetch upstream develop      # clone partiel : les fichiers sont téléchargés à la demande
git checkout -b rbooks/maj-AAAA-MM rbooks/main
git merge upstream/develop      # voir ci-dessous si conflits
```

## Résolution de conflits

1. `git status` liste les fichiers en conflit (`both modified`).
2. Les fichiers à nous (nouveaux modules, `docs/rbooks`, `NOTICE.md`) ne devraient jamais être en conflit.
3. Conflits probables : textes affichés « Bigcapital » → « RBooks » (fichiers de traduction, titres, courriels), `app.module.ts` (imports de nos modules). Règle : garder le code d'upstream et réappliquer notre petite modification par-dessus.
4. Après résolution : `git add <fichiers>` puis `git commit` (laisser le message de fusion).
5. Relancer : `pnpm install`, `pnpm run build:server`, `pnpm run system:migrate:latest`, `pnpm run tenants:migrate:latest`, puis les tests (`cd packages/server; pnpm run test`).
6. Si tout est vert : `git checkout rbooks/main; git merge --ff-only rbooks/maj-AAAA-MM`.
7. Si ça tourne mal : `git merge --abort` (avant le commit) ou supprimer la branche `rbooks/maj-AAAA-MM`.

## Règles pour limiter les conflits

- Nos ajouts vont dans des modules/fichiers séparés (ex. `packages/server/src/modules/RBooks*`).
- Modifications dans les fichiers d'upstream : les plus petites possible, une ligne si on peut.
- Ne jamais renommer les paquets `@bigcapital/*` ni les dossiers.
- Ne jamais `git push` : aucun remote en écriture.
- Conserver `LICENSE`, `DISCLAIMER` et les avis de droits d'auteur de Bigcapital.
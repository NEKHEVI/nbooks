# Démarrage local de RBooks (Windows, PowerShell)

Dépôt : `C:\DEV\CODEGOD\RAWLF\rbooks`. Ports utilisés : 3000 (serveur), 4000 (interface), 3306 (MariaDB), 6379 (Redis), 9000 (Gotenberg), 3900 (S3/Garage). Le port 4023 n'est PAS utilisé.

## 0. Une seule fois

```powershell
# Node 18.16.1 (fnm) : à refaire dans CHAQUE nouvelle fenêtre PowerShell
cd C:\DEV\CODEGOD\RAWLF\rbooks
fnm env --use-on-cd | Out-String | Invoke-Expression
fnm install 18.16.1
fnm use 18.16.1
node -v    # v18.16.1

# pnpm 9 (le pnpm récent exige Node 22 ; le fichier de verrouillage est en version 9)
npm i -g pnpm@9.15.9
pnpm -v    # 9.15.9
```

## 1. Configuration

```powershell
cd C:\DEV\CODEGOD\RAWLF\rbooks
Copy-Item .env.example .env
# Mettre une valeur dans APP_JWT_SECRET (au moins 32 caractères aléatoires). Exemple :
$b = New-Object byte[] 36; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
# Copier ce résultat dans .env : APP_JWT_SECRET=...  (.env est ignoré par git, ne jamais le commiter)
# Optionnel : RBOOKS_SOURCE_URL=https://... pour afficher le lien « Code source »
```

## 2. Services (Docker)

Démarrer Docker Desktop et attendre qu'il réponde :

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
docker info    # doit afficher « Server: » sans erreur
```

```powershell
cd C:\DEV\CODEGOD\RAWLF\rbooks
docker compose up -d
docker compose ps    # mariadb, redis, gotenberg, garage (et clickhouse) en cours d'exécution
```

## 3. Installation, compilation, migrations

```powershell
cd C:\DEV\CODEGOD\RAWLF\rbooks
fnm env --use-on-cd | Out-String | Invoke-Expression; fnm use 18.16.1
pnpm install
pnpm run build:server            # obligatoire AVANT les migrations
pnpm run system:migrate:latest   # base système
```

Les bases des organisations (tenants) sont créées par l'application à l'inscription (étape 5).

## 4. Lancer (deux fenêtres PowerShell, chacune avec fnm use 18.16.1)

```powershell
# Fenêtre A : serveur, http://localhost:3000
cd C:\DEV\CODEGOD\RAWLF\rbooks; fnm env --use-on-cd | Out-String | Invoke-Expression; fnm use 18.16.1
pnpm run dev:server
```

```powershell
# Fenêtre B : interface, http://localhost:4000
cd C:\DEV\CODEGOD\RAWLF\rbooks; fnm env --use-on-cd | Out-String | Invoke-Expression; fnm use 18.16.1
pnpm run dev:webapp
```

## 5. Compte et organisation de test (données fictives)

1. Ouvrir http://localhost:4000 et créer un compte (courriel fictif, par exemple `test@rbooks.invalid`, mot de passe de test).
2. Assistant d'organisation : nom « Entreprise Test RBooks inc. », devise CAD, fuseau America/Toronto.
3. Créer un client fictif, un article, puis une facture (Ventes > Factures > Nouvelle facture).

## 6. Tests

```powershell
cd C:\DEV\CODEGOD\RAWLF\rbooks\packages\server
pnpm run test
```

Résultats de référence : voir le rapport de la tâche 01.

## Dépannage

- `docker info` ne répond pas : Docker Desktop n'a pas fini de démarrer (ou WSL 2 est arrêté). Fermer Docker Desktop, lancer `wsl --shutdown`, rouvrir Docker Desktop, attendre l'icône verte.
- `This version of pnpm requires at least Node.js v22.13` : vous utilisez le pnpm global récent ; refaire `fnm use 18.16.1` puis `npm i -g pnpm@9.15.9` dans cette fenêtre.
- Erreur « Cannot find module @bigcapital/utils » dans les tests ou le serveur : `pnpm run build:server` n'a pas été lancé.
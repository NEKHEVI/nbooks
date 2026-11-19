# NBooks : déploiement sur un VPS au Canada

Préparé le 19 novembre 2026. **Rien n'est loué ni acheté** : ce guide sert à décider. Adresse prévue : `https://books.nekhevi.com`.

NBooks n'est pas une app Vercel : il lui faut un serveur NestJS, MariaDB, Redis, Gotenberg (PDF) et Garage (fichiers, compatible S3). Tout tient sur une seule machine avec `docker-compose.prod.yml`.

## 1. Taille de machine

- Minimum : 2 vCPU, 4 Go de RAM, 40 Go de disque (quelques organisations, sans ClickHouse).
- Conseillé : 4 vCPU, 8 Go de RAM, 75 Go ou plus. La construction des images (pnpm + Vite) prend à elle seule 3 à 4 Go de RAM ; avec 4 Go il faut construire ailleurs ou ajouter 4 Go d'échange (swap).
- ClickHouse (profil `analytics`) : seulement si on veut les rapports accélérés, +2 Go de RAM.

## 2. Trois options, données au Canada

Prix lus sur les pages officielles le 19 novembre 2026 (sans taxes). À revérifier au moment de commander : les prix changent.

| Option | Centre de données | 4 Go RAM | 8 Go RAM | Sauvegardes |
|---|---|---|---|---|
| **A. OVHcloud VPS** (entreprise française, centre au Québec) | « au Canada » selon la page (OVH a son centre de Beauharnois, QC ; la page ne nomme pas la ville) | VPS-1 : 2 vCores, 4 Go, 40 Go NVMe, 6,20 $/mois | VPS-2 : 4 vCores, 8 Go, 75 Go NVMe, 11,64 $/mois | Sauvegarde quotidienne des 24 dernières heures incluse |
| **B. DigitalOcean** (droplet « Basic Regular ») | Toronto (TOR1) | 2 vCPU, 4 Gio, 80 Gio, 24 $ US/mois | 4 vCPU, 8 Gio, 160 Gio, 48 $ US/mois | +20 % (hebdo) ou +30 % (quotidien) du prix |
| **C. Vultr** (« Regular Performance ») | Toronto | 2 vCPU, 4 Go, 80 Go, 20 $ US/mois | 4 vCPU, 8 Go, 160 Go, 40 $ US/mois | Prix non affiché sur la page tarifs |

Notes :
- OVH : la page affiche « $ » sans préciser CAD ; probablement CAD sur ovhcloud.com/en-ca, **à confirmer au panier**. C'est de loin le moins cher et le seul avec le centre au Québec (Loi 25 : données au Québec, encore mieux qu'au Canada).
- DigitalOcean et Vultr : entreprises américaines (CLOUD Act), même si les serveurs sont à Toronto.
- Recommandation prudente : **A, VPS-2 (8 Go)**. Plus une copie des sauvegardes hors du VPS (voir 6).

Sources : ovhcloud.com/en-ca/vps/vps-canada, digitalocean.com/pricing/droplets, vultr.com/pricing (consultées le 19 nov. 2026).

## 3. DNS (Cloudflare, zone nekhevi.com)

- Enregistrement `A` : `books` → adresse IPv4 du VPS, **DNS only (nuage gris)** pour que Caddy obtienne son certificat Let's Encrypt.
- (Optionnel) `AAAA` : `books` → IPv6 du VPS.

## 4. Installation (Ubuntu 24.04 LTS)

Sur le VPS, en tant qu'utilisateur avec sudo (jamais root pour l'app) :

1. Mises à jour, pare-feu : ouvrir seulement 22 (SSH, par clé), 80 et 443.
2. Installer Docker Engine et le plugin Compose depuis la documentation officielle de Docker.
3. Cloner le dépôt privé `NEKHEVI/nbooks` (clé de déploiement en lecture seule) dans `/opt/nbooks`, branche `nbooks/main`.
4. `cp .env.example .env`, puis remplir au minimum : `NBOOKS_DOMAIN=books.nekhevi.com`, `ACME_EMAIL`, `BASE_URL=https://books.nekhevi.com`, `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `APP_JWT_SECRET` (48 octets aléatoires), `GARAGE_RPC_SECRET` (32 octets hex), `GARAGE_ADMIN_TOKEN`, le serveur de courriel (`MAIL_*`), `SIGNUP_DISABLED=true` et `SIGNUP_ALLOWED_EMAILS`. `chmod 600 .env`. Le fichier `.env` ne sort jamais du VPS.
5. Construire : `docker compose -f docker-compose.prod.yml build`
6. Démarrer la base : `docker compose -f docker-compose.prod.yml up -d mysql redis garage gotenberg`
7. Migrations : `docker compose -f docker-compose.prod.yml --profile migrate run --rm database_migration`
8. Garage (une fois) : `docker compose -f docker-compose.prod.yml exec garage sh /garage-setup/setup.sh`, puis copier la clé S3 affichée dans `.env` (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET=nbooks`).
9. Tout démarrer : `docker compose -f docker-compose.prod.yml up -d`
10. Ouvrir https://books.nekhevi.com, créer le compte de Fred (adresse permise dans `SIGNUP_ALLOWED_EMAILS`), puis remettre les inscriptions fermées.

Mise à jour : `git pull`, `build`, migrations, `up -d`. Pas de mise à jour automatique (Watchtower retiré : il aurait installé Bigcapital d'origine).

## 5. Code source (AGPL-3.0, article 13)

NBooks dérive de Bigcapital (AGPL-3.0). Les usagers qui s'en servent par le réseau doivent pouvoir obtenir le code source de la version qui tourne. Le dépôt GitHub est **privé** : un lien vers lui ne suffit pas. Il faut, avant d'ouvrir NBooks à un client, soit un dépôt ou une archive publique de la version déployée, et mettre son adresse dans `NBOOKS_SOURCE_URL` (le lien « Code source » apparaît alors au bas de l'app). Décision de Fred.

## 6. Sauvegardes

- Base : `docker compose -f docker-compose.prod.yml exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases --single-transaction' | gzip > /opt/nbooks-sauvegardes/nbooks-$(date +%F).sql.gz` chaque nuit (cron), 30 jours gardés.
- Fichiers : volume `nbooks_prod_garage`.
- Copie hors du VPS, chiffrée (par exemple avec restic) vers un stockage au Canada : à choisir par Fred.
- Tester une restauration une fois par trimestre.

## 7. À savoir

- Images de base : Node 18 et MariaDB 10.2 (héritées de Bigcapital) ne reçoivent plus de correctifs. Passer à Node 22 et MariaDB 10.11 LTS demande un essai complet : à planifier, pas fait ici.
- Gotenberg 7 gardé (version testée par Bigcapital).

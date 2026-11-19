# NBooks : déploiement sur un VPS au Canada

Préparé le 19 novembre 2026, mis à jour le même jour (script d'installation, dépôt public). **Rien n'est loué ni acheté** : ce guide sert à décider. Adresse prévue : `https://books.nekhevi.com`.

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

## 4. Installation (Ubuntu 24.04 LTS) : une commande

Le jour où Fred donne le signal (VPS commandé, DNS ajouté) :

```bash
# Sur le VPS, utilisateur avec sudo (accès SSH par clé seulement)
curl -fsSLo installer-vps.sh https://raw.githubusercontent.com/NEKHEVI/nbooks/main/deploy/nbooks/installer-vps.sh
less installer-vps.sh          # le relire avant de le lancer
sudo bash installer-vps.sh books.nekhevi.com <courriel Let's Encrypt> <courriel du compte de Fred>
```

Le script (`deploy/nbooks/installer-vps.sh`, dans le dépôt) fait tout, dans l'ordre :

1. Mises à jour, pare-feu `ufw` (22, 80, 443 seulement), Docker et Compose depuis les paquets Ubuntu.
2. Clone du dépôt public `NEKHEVI/nbooks` dans `/opt/nbooks`.
3. `.env` créé à partir de `.env.example` (droits 600) : domaine, `BASE_URL`, `ACME_EMAIL`, mots de passe MariaDB, `APP_JWT_SECRET`, secrets Garage, tous tirés au hasard avec `openssl rand` et **jamais affichés**. Inscriptions permises seulement pour l'adresse de Fred.
4. Construction des images (10 à 20 minutes).
5. MariaDB, Redis, Garage, Gotenberg ; migrations ; Garage configuré (zone, compartiment `nbooks`, clé d'accès inscrite dans `.env`). L'image Garage n'a pas de shell : le script appelle son binaire `/garage` directement (l'ancien `exec garage sh /garage-setup/setup.sh` ne marche pas).
6. Démarrage de tout, Caddy obtient le certificat HTTPS.

Ensuite, à la main : créer le compte de Fred sur https://books.nekhevi.com, puis `SIGNUP_DISABLED=true` dans `/opt/nbooks/.env` et `docker compose -f docker-compose.prod.yml up -d server`. Remplir `MAIL_*` quand le service d'envoi est choisi.

Le script est relançable : un `.env` existant n'est jamais écrasé et les étapes faites sont sautées.

Mise à jour : `git -C /opt/nbooks pull`, `build`, migrations (`--profile migrate run --rm database_migration`), `up -d`. Pas de mise à jour automatique (Watchtower retiré : il aurait installé Bigcapital d'origine).

## 5. Code source (AGPL-3.0, article 13)

NBooks dérive de Bigcapital (AGPL-3.0). Les usagers qui s'en servent par le réseau doivent pouvoir obtenir le code source de la version qui tourne. Depuis le 19 novembre 2026, le dépôt **NEKHEVI/nbooks est public** (accord de Fred). `NBOOKS_SOURCE_URL` vaut par défaut `https://github.com/NEKHEVI/nbooks` (`.env.example` et `docker-compose.prod.yml`) : le lien « Code source » est donc affiché au bas de l'app. Déployer seulement du code poussé sur ce dépôt.

## 6. Sauvegardes

- Script prêt : `deploy/nbooks/sauvegarde.sh` (base complète avec `mysqldump` + fichiers Garage, 30 jours gardés dans `/opt/nbooks-sauvegardes`).
- Cron (root) : `15 3 * * * bash /opt/nbooks/deploy/nbooks/sauvegarde.sh >> /var/log/nbooks-sauvegarde.log 2>&1`
- Copie hors du VPS, chiffrée (par exemple avec restic) vers un stockage au Canada : à choisir par Fred.
- Tester une restauration une fois par trimestre.

## 7. À savoir

- Images de base : Node 18 et MariaDB 10.2 (héritées de Bigcapital) ne reçoivent plus de correctifs. Passer à Node 22 et MariaDB 10.11 LTS demande un essai complet : à planifier, pas fait ici.
- Gotenberg 7 gardé (version testée par Bigcapital).

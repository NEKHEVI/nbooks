#!/usr/bin/env bash
# =====================================================================
# NBooks : installation sur un VPS neuf (Ubuntu 24.04 LTS), en une commande.
#
#   sudo bash installer-vps.sh books.nekhevi.com <courriel Let's Encrypt> <courriel du premier compte>
#
# 1. Mises à jour, pare-feu (22, 80, 443 seulement), Docker (paquets Ubuntu).
# 2. Code public NEKHEVI/nbooks dans /opt/nbooks.
# 3. .env créé à partir de .env.example, secrets tirés au hasard (jamais affichés).
# 4. Images construites, base, migrations, stockage de fichiers Garage, démarrage.
#
# Avant : l'enregistrement DNS « A books » doit pointer vers l'IP du VPS (nuage gris),
# sinon Caddy ne peut pas obtenir le certificat HTTPS.
# Relançable sans danger : un .env existant n'est jamais écrasé, les étapes faites sont sautées.
# =====================================================================
set -euo pipefail

DOMAIN="${1:-}"
ACME="${2:-}"
FIRST_EMAIL="${3:-}"
REPO="${NBOOKS_REPO:-https://github.com/NEKHEVI/nbooks.git}"
BRANCH="${NBOOKS_BRANCH:-main}"
DIR="${NBOOKS_DIR:-/opt/nbooks}"

if [ -z "$DOMAIN" ] || [ -z "$ACME" ] || [ -z "$FIRST_EMAIL" ]; then
  echo "Usage : sudo bash $0 <domaine> <courriel Let's Encrypt> <courriel du premier compte>" >&2
  exit 1
fi
if [ "$(id -u)" -ne 0 ]; then echo "Lancer avec sudo." >&2; exit 1; fi
. /etc/os-release
if [ "${ID:-}" != "ubuntu" ]; then echo "Prévu pour Ubuntu 24.04 LTS (trouvé : ${PRETTY_NAME:-inconnu})." >&2; exit 1; fi

echo "== 1/6 Système, pare-feu, Docker =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y docker.io docker-compose-v2 git ufw openssl ca-certificates
systemctl enable --now docker
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "== 2/6 Code source =="
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$DIR" checkout -q "$BRANCH"
  git -C "$DIR" reset -q --hard "origin/$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
fi
cd "$DIR"

echo "== 3/6 Fichier .env =="
rnd() { openssl rand -hex "$1"; }
set_env() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}
has_env() { grep -qE "^$1=.+" .env; }
if [ ! -f .env ]; then
  cp .env.example .env
  chmod 600 .env
  set_env NBOOKS_DOMAIN "$DOMAIN"
  set_env BASE_URL "https://$DOMAIN"
  set_env ACME_EMAIL "$ACME"
  set_env NBOOKS_SOURCE_URL "https://github.com/NEKHEVI/nbooks"
  set_env DB_USER "nbooks"
  set_env DB_PASSWORD "$(rnd 24)"
  set_env DB_ROOT_PASSWORD "$(rnd 24)"
  set_env APP_JWT_SECRET "$(rnd 48)"
  set_env GARAGE_RPC_SECRET "$(rnd 32)"
  set_env GARAGE_ADMIN_TOKEN "$(rnd 32)"
  set_env S3_BUCKET "nbooks"
  # Inscriptions permises seulement pour la première adresse, le temps de créer le compte.
  set_env SIGNUP_DISABLED "false"
  set_env SIGNUP_ALLOWED_EMAILS "$FIRST_EMAIL"
  echo ".env créé (secrets générés, non affichés). Courriel d'envoi (MAIL_*) : à remplir plus tard."
else
  echo ".env déjà présent : gardé tel quel."
fi

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "== 4/6 Construction des images (10 à 20 minutes) =="
$COMPOSE build

echo "== 5/6 Base de données, migrations, stockage de fichiers =="
$COMPOSE up -d mysql redis garage gotenberg
for _ in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' nbooks-mysql 2>/dev/null)" = "healthy" ] && break
  sleep 3
done
$COMPOSE --profile migrate run --rm database_migration

# Garage : l'image n'a pas de shell, on appelle son binaire directement.
G="$COMPOSE exec -T garage /garage"
for _ in $(seq 1 30); do $G status >/dev/null 2>&1 && break; sleep 2; done
if ! $G status 2>/dev/null | grep -q "Healthy"; then
  NODE_ID=$($G node id 2>/dev/null | awk 'NR==1{print $1}' | cut -d@ -f1)
  $G layout assign "$NODE_ID" -z dc1 -c 20G >/dev/null 2>&1 || true
  $G layout apply --version 1 >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do $G status 2>/dev/null | grep -q "Healthy" && break; sleep 2; done
fi
$G bucket list 2>/dev/null | grep -qw nbooks || $G bucket create nbooks
if ! has_env S3_ACCESS_KEY_ID; then
  OUT=$($G key create nbooks-app)
  set_env S3_ACCESS_KEY_ID "$(echo "$OUT" | awk '/Key ID/{print $NF}' | head -n1)"
  set_env S3_SECRET_ACCESS_KEY "$(echo "$OUT" | awk '/Secret key/{print $NF}' | head -n1)"
  unset OUT
  $G bucket allow --read --write --owner --key nbooks-app --bucket nbooks
  echo "Clé de stockage créée et inscrite dans .env (non affichée)."
fi

echo "== 6/6 Démarrage =="
$COMPOSE up -d
$COMPOSE ps
echo
echo "NBooks : https://$DOMAIN"
echo "1. Créer le compte avec $FIRST_EMAIL."
echo "2. Fermer les inscriptions : SIGNUP_DISABLED=true dans $DIR/.env, puis : $COMPOSE up -d server"
echo "3. Sauvegardes : voir docs/nbooks/DEPLOIEMENT-VPS.md (section 6) et deploy/nbooks/sauvegarde.sh."

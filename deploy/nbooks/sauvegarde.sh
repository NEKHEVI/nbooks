#!/usr/bin/env bash
# NBooks : sauvegarde nocturne de la base (toutes les organisations) et des fichiers Garage.
# Garde 30 jours dans /opt/nbooks-sauvegardes. La copie hors du VPS (chiffrée) reste à choisir.
# Cron (root) : 15 3 * * * bash /opt/nbooks/deploy/nbooks/sauvegarde.sh >> /var/log/nbooks-sauvegarde.log 2>&1
set -euo pipefail
DIR="${NBOOKS_DIR:-/opt/nbooks}"
OUT="${NBOOKS_BACKUP_DIR:-/opt/nbooks-sauvegardes}"
DAY="$(date +%F)"
mkdir -p "$OUT"
chmod 700 "$OUT"
cd "$DIR"
COMPOSE="docker compose -f docker-compose.prod.yml"

# Base : le mot de passe reste dans le conteneur (variable MYSQL_ROOT_PASSWORD), rien n'est affiché.
$COMPOSE exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases --single-transaction --routines --events' \
  | gzip > "$OUT/nbooks-base-$DAY.sql.gz"

# Fichiers (volume Garage), lu par un conteneur jetable.
VOL="$(docker volume ls -q | grep -E '_garage$' | grep -i nbooks | head -n1 || true)"
if [ -n "$VOL" ]; then
  docker run --rm -v "$VOL":/data:ro -v "$OUT":/out alpine:3.20 \
    tar -czf "/out/nbooks-fichiers-$DAY.tar.gz" -C /data .
fi

find "$OUT" -name 'nbooks-*' -mtime +30 -delete
ls -lh "$OUT" | tail -n 4

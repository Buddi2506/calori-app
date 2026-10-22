#!/usr/bin/env bash
# Take a backup of the Calori database right now.
# Usage: scripts/backup_db.sh
# Backups go to backups/ (git-ignored). The db-backup service also makes one daily.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
file="backups/calori_$(date +%Y-%m-%d_%H%M%S).dump"
docker exec calori_db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file"
echo "Saved $file ($(du -h "$file" | cut -f1))"

#!/usr/bin/env bash
# Replace the Calori database with a backup. This overwrites all current data.
# Usage: scripts/restore_db.sh backups/calori_YYYY-MM-DD_HHMMSS.dump
set -euo pipefail
cd "$(dirname "$0")/.."
file="${1:?Usage: scripts/restore_db.sh <backup file>}"
[ -f "$file" ] || { echo "No such file: $file"; exit 1; }

read -r -p "Replace ALL current data with $file? Type 'restore' to continue: " answer
[ "$answer" = "restore" ] || { echo "Cancelled."; exit 1; }

echo "Saving a safety backup of the current data first..."
scripts/backup_db.sh

docker stop calori_backend >/dev/null
docker exec -i calori_db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < "$file"
docker start calori_backend >/dev/null
echo "Restored $file"

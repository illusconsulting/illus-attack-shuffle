#!/bin/bash

# Backup Configuration
BACKUP_DIRECTORY="${ARANGO_BACKUP_DIRECTORY:-./arangodb/backups}"
ARANGO_HOST="${ARANGO_HOST:-localhost}"
ARANGO_PORT="${ARANGO_PORT:-8529}"
ARANGO_DATABASE="${ARANGO_DATABASE:-attack_shuffle}"
ARANGO_USERNAME="${ARANGO_USERNAME:-root}"
ARANGO_PASSWORD="${ARANGO_ROOT_PASSWORD:-examplepassword}"
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIRECTORY/backup_$BACKUP_TIMESTAMP"

# Ensure Backup Directory Exists
mkdir -p "$BACKUP_DIRECTORY"

echo "Starting backup for database: $ARANGO_DATABASE"
echo "Backup will be stored at: $BACKUP_PATH"

# Perform the Backup
arangodump \
  --server.endpoint "tcp://$ARANGO_HOST:$ARANGO_PORT" \
  --server.username "$ARANGO_USERNAME" \
  --server.password "$ARANGO_PASSWORD" \
  --output-directory "$BACKUP_PATH" \
  --overwrite true \
  --threads "${ARANGO_BACKUP_THREADS:-4}" \
  --include-system-collections "${ARANGO_INCLUDE_SYSTEM_COLLECTIONS:-false}" \
  --compress-output true

# Check Backup Status
if [ $? -eq 0 ]; then
  echo "Backup completed successfully."
  echo "Backup location: $BACKUP_PATH"
else
  echo "Backup failed."
  exit 1
fi

# Retention Policy
RETENTION_POLICY="${BACKUP_RETENTION_POLICY:-7}"

if [ "$RETENTION_POLICY" -gt 0 ]; then
  echo "Applying retention policy: Keeping last $RETENTION_POLICY backups."
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIRECTORY" | wc -l)
  if [ "$BACKUP_COUNT" -gt "$RETENTION_POLICY" ]; then
    OLD_BACKUPS=$(ls -1t "$BACKUP_DIRECTORY" | tail -n +"$((RETENTION_POLICY + 1))")
    for OLD_BACKUP in $OLD_BACKUPS; do
      echo "Deleting old backup: $BACKUP_DIRECTORY/$OLD_BACKUP"
      rm -rf "$BACKUP_DIRECTORY/$OLD_BACKUP"
    done
  fi
fi

echo "Backup process completed."
exit 0

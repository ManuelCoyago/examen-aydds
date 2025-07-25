#!/bin/bash

# Variables
DB_HOST="db"
DB_USER="user"
DB_NAME="storedb"
DATE=$(date +%F_%H-%M)
BACKUP_FILE="/backups/respaldo_${DATE}.sql"

# Respaldar la base desde el contenedor
echo "Respaldo iniciado: $BACKUP_FILE"
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_FILE

# Subir a Google Drive
rclone copy $BACKUP_FILE gdrive:/respaldos/

# (Opcional) Borrar respaldos antiguos del contenedor local
#find /backups -type f -mtime +7 -name "*.sql" -exec rm {} \;

echo "Respaldo y subida completados"

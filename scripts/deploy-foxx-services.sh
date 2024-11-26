#!/bin/bash

# Configuration
ARANGO_HOST="${ARANGO_HOST:-localhost}"
ARANGO_PORT="${ARANGO_PORT:-8529}"
ARANGO_DATABASE="${ARANGO_DATABASE:-attack_shuffle}"
ARANGO_USERNAME="${ARANGO_USERNAME:-root}"
ARANGO_PASSWORD="${ARANGO_ROOT_PASSWORD:-examplepassword}"
FOXX_SERVICES_DIRECTORY="${FOXX_SERVICES_DIRECTORY:-./services}"

# Array of Foxx Services
declare -A FOXX_SERVICES=(
  ["model-lifecycle"]="/model-lifecycle"
  ["entity-management"]="/entity-management"
  ["search-and-query"]="/search-and-query"
  ["backup-and-restore"]="/backup-and-restore"
  ["security-and-access"]="/security-and-access"
)

# Ensure Foxx CLI is Installed
if ! command -v foxx &> /dev/null; then
  echo "Foxx CLI is not installed. Install it with 'npm install -g foxx-cli'."
  exit 1
fi

# Deploy Services
echo "Deploying Foxx services to ArangoDB..."
for SERVICE_NAME in "${!FOXX_SERVICES[@]}"; do
  SERVICE_PATH="$FOXX_SERVICES_DIRECTORY/$SERVICE_NAME"
  ROUTE="${FOXX_SERVICES[$SERVICE_NAME]}"

  if [ -d "$SERVICE_PATH" ]; then
    echo "Deploying $SERVICE_NAME to route $ROUTE..."
    foxx install --server.endpoint "http://$ARANGO_HOST:$ARANGO_PORT" \
      --server.database "$ARANGO_DATABASE" \
      --server.username "$ARANGO_USERNAME" \
      --server.password "$ARANGO_PASSWORD" \
      --replace "$ROUTE" "$SERVICE_PATH"

    if [ $? -eq 0 ]; then
      echo "$SERVICE_NAME deployed successfully."
    else
      echo "Failed to deploy $SERVICE_NAME."
      exit 1
    fi
  else
    echo "Service directory $SERVICE_PATH does not exist. Skipping $SERVICE_NAME."
  fi
done

echo "Foxx services deployment completed."
exit 0

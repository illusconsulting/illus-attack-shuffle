#!/bin/bash

# Configuration
ARANGO_HOST="${ARANGO_HOST:-localhost}"
ARANGO_PORT="${ARANGO_PORT:-8529}"
ARANGO_ROOT_PASSWORD="${ARANGO_ROOT_PASSWORD:-examplepassword}"
ARANGO_DATABASE="${ARANGO_DATABASE:-attack_shuffle}"
INIT_SCRIPTS_DIRECTORY="./arangodb/init"

# Ensure ArangoDB CLI is Available
if ! command -v arangosh &> /dev/null; then
  echo "ArangoDB CLI (arangosh) is not installed. Install ArangoDB to proceed."
  exit 1
fi

# Check ArangoDB Availability
echo "Checking ArangoDB server availability at $ARANGO_HOST:$ARANGO_PORT..."
until curl -s "http://$ARANGO_HOST:$ARANGO_PORT/_api/version" > /dev/null; do
  echo "Waiting for ArangoDB server to start..."
  sleep 2
done
echo "ArangoDB server is up."

# Create Database
echo "Initializing database: $ARANGO_DATABASE"
arangosh \
  --server.endpoint "tcp://$ARANGO_HOST:$ARANGO_PORT" \
  --server.username "root" \
  --server.password "$ARANGO_ROOT_PASSWORD" \
  --javascript.execute-string "
    const db = require('@arangodb').db;
    if (!db._databases().includes('$ARANGO_DATABASE')) {
      db._createDatabase('$ARANGO_DATABASE');
      print('Database \"$ARANGO_DATABASE\" created.');
    } else {
      print('Database \"$ARANGO_DATABASE\" already exists.');
    }
  "

# Execute Initialization Scripts
echo "Running initialization scripts..."
for script in "$INIT_SCRIPTS_DIRECTORY"/*.js; do
  if [ -f "$script" ]; then
    echo "Executing $script..."
    arangosh \
      --server.endpoint "tcp://$ARANGO_HOST:$ARANGO_PORT" \
      --server.username "root" \
      --server.password "$ARANGO_ROOT_PASSWORD" \
      --server.database "$ARANGO_DATABASE" \
      --javascript.execute "$script"

    if [ $? -eq 0 ]; then
      echo "$script executed successfully."
    else
      echo "Failed to execute $script."
      exit 1
    fi
  fi
done

echo "ArangoDB initialization completed."
exit 0

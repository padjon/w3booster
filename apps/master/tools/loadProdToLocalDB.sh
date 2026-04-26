#!/usr/bin/env bash
set -euo pipefail

PROD_URI="${PROD_URI:?Set PROD_URI to the production MongoDB connection string}"
LOCAL_URI="${LOCAL_URI:-mongodb://127.0.0.1:27017/w3booster}"
DB_NAME="${DB_NAME:-w3booster}"
MONGO_IMAGE="${MONGO_IMAGE:-mongo:7}"

echo "Starting production-to-local database sync..."
echo "Source DB: ${DB_NAME}"
echo "Target URI: ${LOCAL_URI}"

# WSL/Linux-friendly flow: avoid Windows path mounts entirely by streaming the
# archive between two short-lived Mongo tool containers over stdout/stdin.
docker run --rm --network host \
  -e PROD_URI="${PROD_URI}" \
  -e DB_NAME="${DB_NAME}" \
  "${MONGO_IMAGE}" \
  sh -lc 'mongodump --uri="$PROD_URI" --db="$DB_NAME" --archive --gzip' \
| docker run --rm -i --network host \
  -e LOCAL_URI="${LOCAL_URI}" \
  -e DB_NAME="${DB_NAME}" \
  "${MONGO_IMAGE}" \
  sh -lc 'mongorestore --uri="$LOCAL_URI" --nsInclude="$DB_NAME.*" --drop --archive --gzip'

echo "Production-to-local database sync finished."

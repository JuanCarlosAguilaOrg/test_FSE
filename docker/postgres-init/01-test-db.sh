#!/bin/sh
# Solo corre al inicializar un volumen nuevo. Crea la BD aislada para las pruebas.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -c "CREATE DATABASE \"${POSTGRES_TEST_DB:-learning_test}\""

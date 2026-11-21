#!/usr/bin/env bash
# Finishes the Toolshop setup started by toolshop-start.sh (PHP dependencies, a freshly
# seeded database) and waits until the API and the Angular UI answer. Same steps as the
# upstream project's own CI workflow (.github/workflows/run-tests.yml), without fixed sleeps.
set -euo pipefail
export SPRINT="${SPRINT:-sprint5}" DISABLE_LOGGING=true
compose() { docker compose -f docker-compose.yml "$@"; }

retry() { # retry <attempts> <seconds> <description> <command...>
  local attempts=$1 delay=$2 what=$3; shift 3
  for i in $(seq 1 "$attempts"); do
    if "$@" >/dev/null 2>&1; then echo "✔ $what"; return 0; fi
    echo "… waiting for $what ($i/$attempts)"; sleep "$delay"
  done
  echo "✘ $what not ready"; compose ps; compose logs --tail=80; return 1
}

retry 60 2 "API container" compose exec -T laravel-api true
compose exec -T -u root laravel-api composer install --no-dev --optimize-autoloader --ignore-platform-req=ext-ffi --no-interaction --quiet
retry 60 2 "database" compose exec -T mariadb mysqladmin ping -h localhost -uroot -proot --silent
compose exec -T laravel-api php artisan migrate:refresh --seed --force
retry 60 2 "API on :8091" curl -fsS http://localhost:8091/status
retry 120 5 "Angular UI on :4200" curl -fsS -o /dev/null http://localhost:4200

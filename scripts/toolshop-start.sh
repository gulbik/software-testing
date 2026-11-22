#!/usr/bin/env bash
# Starts the Toolshop application (https://github.com/testsmith-io/practice-software-testing)
# in Docker, in the background. Run from the directory the upstream repo was checked out to.
# The containers keep starting (Angular compiles, PHP installs) while the runner installs
# npm packages and the browser; scripts/toolshop-wait.sh then waits until it is usable.
set -euo pipefail
export SPRINT="${SPRINT:-sprint5}" DISABLE_LOGGING=true
# The API code is bind-mounted from this checkout (owned by the runner user), but PHP-FPM
# runs as www-data: without write access to storage/ Laravel answers 500
# ("tempnam(): file created in the system's temporary directory").
chmod -R a+rwX "$SPRINT/API/storage" "$SPRINT/API/bootstrap/cache"
docker compose -f docker-compose.yml up -d --quiet-pull

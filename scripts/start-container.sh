#!/bin/sh
set -eu

# shortcut: ephemeral free hosting resets graph changes on restart, use a persistent FalkorDB service for durable data.
redis-server --loadmodule /var/lib/falkordb/bin/falkordb.so --bind 127.0.0.1 --port 6379 --daemonize yes --save '' --appendonly no
node scripts/seed.mjs
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT:-10000}"

#!/bin/sh
set -e

# Remove lock files do Chromium deixados por containers anteriores que nao
# saíram cleanly. whatsapp-web.js usa Chromium via puppeteer; um SingletonLock
# residual impede o profile de subir e quebra a inicializacao.
find /app/.wwebjs_auth /app/.wwebjs_cache -maxdepth 5 \
    \( -name 'SingletonLock' -o -name 'SingletonCookie' -o -name 'SingletonSocket' \) \
    -delete 2>/dev/null || true

exec "$@"

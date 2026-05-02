# syntax=docker/dockerfile:1.7

# ============================================================================
# Stage 1 — Build (compila TypeScript + instala todas as deps)
# ============================================================================
FROM node:22-alpine AS build

RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build


# ============================================================================
# Stage 2 — Production deps (somente dependencies, sem devDependencies)
# ============================================================================
FROM node:22-alpine AS prod-deps

RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod \
    && pnpm rebuild bcrypt


# ============================================================================
# Stage 3 — Runtime (imagem final enxuta com Chromium pra WhatsApp)
# ============================================================================
FROM node:22-alpine AS runtime

RUN apk add --no-cache \
        chromium \
        nss \
        freetype \
        harfbuzz \
        ca-certificates \
        ttf-freefont \
        tini \
        wget \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY package.json pnpm-lock.yaml ./
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p .wwebjs_auth .wwebjs_cache

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/main"]

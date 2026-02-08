# ---- Build stage ----
FROM node:22-alpine AS build

RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile
RUN pnpm rebuild bcrypt

COPY . .

RUN pnpm build

# ---- Production stage ----
FROM node:22-alpine

RUN apk add --no-cache python3 make g++ chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod
RUN pnpm rebuild bcrypt

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]

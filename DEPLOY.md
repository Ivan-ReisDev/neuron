# Deploy — Neuron API (VPS compartilhada)

API NestJS deployada na mesma VPS do catálogo Produtiva, atrás do reverse proxy
Caddy compartilhado. Banco de dados é **externo** (Neon Postgres) — nada de DB
roda na VPS.

## Arquitetura na VPS

```
                       Internet
                          |
                  Caddy (porta 80/443)         <-- /opt/proxy/
              [SSL Let's Encrypt automático]
                  |              |
                  |              |
    catalogo-nginx:80      neuron-api:3000     <-- rede docker 'web'
            |                    |
       PHP-FPM + MySQL       Node 22
                                 |
                          Neon Postgres (externo)
                          Cloudflare R2 (externo)
```

Cada app tem seu próprio `docker-compose.yml` em `~/app/<nome>/`. Todos
publicam na rede `web` externa pro Caddy alcançar via DNS interno.

## Setup inicial na VPS (uma vez só)

Pré-requisito: o stack do Caddy do catálogo já está rodando (rede `web`
existe e Caddyfile em `/opt/proxy/Caddyfile`).

```bash
# 1. Clonar o repo na VPS
ssh deploy@vps
mkdir -p ~/app
cd ~/app
git clone git@github.com:Ivan-ReisDev/neuron.git
cd neuron

# 2. Criar .env.docker a partir do template
cp .env.docker.example .env.docker
nano .env.docker     # preencher MUDAR (DB_*, GROQ_API_KEY, JWT_SECRET, R2_*, RESEND_*)

# 3. Apontar pra imagem do GHCR (descomentar e ajustar)
#    API_IMAGE=ghcr.io/ivan-reisdev/neuron-api:latest

# 4. Login no GHCR (PAT com read:packages)
echo $GHCR_PAT | docker login ghcr.io -u Ivan-ReisDev --password-stdin

# 5. Subir o stack
docker network inspect web >/dev/null 2>&1 || docker network create web
docker compose --env-file .env.docker pull
docker compose --env-file .env.docker up -d
```

## Configurar o Caddy

Abrir o Caddyfile da VPS e adicionar o bloco da API:

```bash
sudo nano /opt/proxy/Caddyfile
# Colar o conteúdo de infra/proxy/caddy-neuron.snippet
# Ajustar o domínio (ex: api.ivanreis.com.br)
```

DNS: criar registro `A` apontando o domínio escolhido pro IP da VPS.

Reload sem downtime:

```bash
docker compose -f /opt/proxy/docker-compose.yml exec caddy \
  caddy reload --config /etc/caddy/Caddyfile
```

Caddy emite o certificado Let's Encrypt sozinho na primeira request HTTPS.

## Secrets do GitHub Actions

No repo `Settings -> Secrets and variables -> Actions`, criar:

| Secret | Descrição |
|---|---|
| `SSH_HOST` | IP ou hostname da VPS |
| `SSH_USER` | usuário SSH (ex: `deploy`) |
| `SSH_PRIVATE_KEY` | chave privada SSH (formato OpenSSH) |
| `SSH_PORT` | porta SSH (default 22) |

`GITHUB_TOKEN` já existe automaticamente e tem permissão pra publicar no GHCR.

Visibilidade do package: depois do primeiro push, ir em
`https://github.com/users/Ivan-ReisDev/packages/container/neuron-api/settings`
e marcar como público (ou manter privado e dar permissão pro repo).

## Fluxo de deploy

1. `git push origin main`
2. Workflow `Deploy to VPS` builda a imagem (target=runtime), publica no GHCR
   (`:latest` e `:sha-<commit>`)
3. SSH na VPS: `git pull`, `docker compose pull`, `up -d`
4. Health check em `/api/health` (45 tentativas × 2s)
5. Cleanup de imagens antigas (mantém últimas 6 com tag `sha-*` pra rollback)

## Health check

Endpoint: `GET /api/health` retorna:

```json
{
  "status": "ok",
  "timestamp": "2026-05-02T12:00:00.000Z",
  "uptime": 1234.56,
  "database": "up"
}
```

Usado por: Docker `HEALTHCHECK`, healthcheck do compose, validação do pipeline.

## Rollback rápido

```bash
ssh deploy@vps
cd ~/app/neuron

docker images | grep neuron-api          # ver SHAs disponíveis
# Editar .env.docker:
#   API_IMAGE=ghcr.io/ivan-reisdev/neuron-api:sha-<commit-anterior>

docker compose --env-file .env.docker up -d
```

## Comandos úteis

```bash
# Logs ao vivo
docker compose --env-file .env.docker logs -f api

# Restart sem rebuild
docker compose --env-file .env.docker restart api

# Limpar dados do WhatsApp (forçar novo QR code)
docker compose --env-file .env.docker down
docker volume rm neuron_wwebjs_auth neuron_wwebjs_cache
docker compose --env-file .env.docker up -d

# Shell no container
docker compose --env-file .env.docker exec api sh

# Status do healthcheck
docker inspect -f '{{.State.Health.Status}}' neuron-api
```

## Notas

- **Banco de dados**: Neon Postgres é externo. Nenhum container de DB roda na
  VPS. Backups e migrations são responsabilidade do Neon / TypeORM
  (`synchronize: false` em produção — mudanças de schema via migrations).
- **WhatsApp**: o volume `neuron_wwebjs_auth` persiste a sessão. Ao trocar de
  máquina ou limpar o volume, é necessário escanear o QR code de novo
  (visível em `docker compose logs api`).
- **Domínio**: o snippet usa `api.ivanreis.com.br` como exemplo. Ajustar antes
  de aplicar o reload do Caddy.

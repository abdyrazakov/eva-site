# Один контейнер: PocketBase отдаёт и API/админку, и собранный сайт (папка pb_public).
# Используется на Render (см. render.yaml); подходит и для любого другого Docker-хостинга.

# 1. Сборка сайта. Снимок данных берётся из web/src/data/snapshot.json (PocketBase при сборке недоступен).
FROM node:22-alpine AS web
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

# 2. Рабочий образ
FROM alpine:3.20
ARG PB_VERSION=0.40.6
RUN apk add --no-cache ca-certificates unzip wget \
    && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O /tmp/pb.zip \
    && mkdir -p /pb \
    && unzip -q /tmp/pb.zip pocketbase -d /pb \
    && rm /tmp/pb.zip \
    && apk del unzip wget
COPY backend/pb_migrations /pb/pb_migrations
COPY --from=web /app/web/dist /pb/pb_public
COPY deploy/docker-entrypoint.sh /pb/entrypoint.sh
RUN chmod +x /pb/entrypoint.sh /pb/pocketbase

# Данные (база и загруженные файлы) лежат на постоянном диске, смонтированном в /data.
ENV PB_DATA_DIR=/data/pb_data
EXPOSE 10000
ENTRYPOINT ["/pb/entrypoint.sh"]

FROM node:18-bookworm-slim AS build

ARG PNPM_VERSION=10.26.1
ARG BUILD_CONFIGURATION=prod

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

WORKDIR /repo

RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json tsconfig.json ./
COPY packages/datamodel/package.json packages/datamodel/package.json
COPY apps/client/package.json apps/client/package.json
COPY apps/client/bundler/package.json apps/client/bundler/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @w3booster/client... --filter @w3booster/client-bundler...

COPY packages/datamodel packages/datamodel
COPY apps/client apps/client

RUN pnpm -C apps/client run build:${BUILD_CONFIGURATION}

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /repo/apps/client/dist/browser/ /usr/share/nginx/html/

EXPOSE 8080

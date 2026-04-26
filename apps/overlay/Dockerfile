FROM node:18-bookworm-slim AS build

ARG PNPM_VERSION=10.26.1
ARG BUILD_CONFIGURATION=production

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

WORKDIR /repo

RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json tsconfig.json ./
COPY packages/datamodel/package.json packages/datamodel/package.json
COPY apps/overlay/package.json apps/overlay/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @w3booster/overlay...

COPY packages/datamodel packages/datamodel
COPY apps/overlay apps/overlay

RUN if [ "${BUILD_CONFIGURATION}" = "production" ]; then \
      pnpm -C apps/overlay exec ng build --configuration production; \
    else \
      pnpm -C apps/overlay exec ng build; \
    fi

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /repo/apps/overlay/dist/w3booster-overlay/browser/ /usr/share/nginx/html/

EXPOSE 8080

FROM node:18-bookworm-slim AS build

ARG PNPM_VERSION=10.26.1

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

WORKDIR /repo

RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json tsconfig.json ./
COPY packages/datamodel/package.json packages/datamodel/package.json
COPY apps/master/package.json apps/master/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @w3booster/master...

COPY packages/datamodel packages/datamodel
COPY apps/master apps/master

RUN pnpm -C apps/master build

FROM node:18-bookworm-slim AS runtime

ENV NODE_ENV=production \
    config=dev \
    PORT=25080 \
    OVERLAY_BROADCAST_PORT=25081 \
    HTTPS_KEY_PATH=conf/localhost.key \
    HTTPS_CERT_PATH=conf/localhost.crt \
    OVERLAY_HTTPS_KEY_PATH=conf/localhost.key \
    OVERLAY_HTTPS_CERT_PATH=conf/localhost.crt

WORKDIR /repo/apps/master

COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/apps/master/node_modules ./node_modules
COPY --from=build /repo/apps/master/package.json ./package.json
COPY --from=build /repo/apps/master/conf ./conf
COPY --from=build /repo/apps/master/dist ./dist

EXPOSE 25080 25081

CMD ["node", "dist/app/server.js"]

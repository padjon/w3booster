FROM node:18-alpine

ARG PNPM_VERSION=10.26.1

WORKDIR /repo

RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/overlay/mockup/package.json apps/overlay/mockup/package.json

RUN pnpm install --frozen-lockfile --prod --filter @w3booster/overlay-mockup

COPY apps/overlay/mockup apps/overlay/mockup

WORKDIR /repo/apps/overlay/mockup

EXPOSE 25082

CMD ["node", "mockup.js"]

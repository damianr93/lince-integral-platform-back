FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/crm/package.json ./packages/crm/package.json
COPY packages/conciliaciones/package.json ./packages/conciliaciones/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY apps/ ./apps/
COPY packages/ ./packages/
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/crm/package.json ./packages/crm/package.json
COPY packages/conciliaciones/package.json ./packages/conciliaciones/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/auth/dist ./packages/auth/dist
COPY --from=builder /app/packages/crm/dist ./packages/crm/dist
COPY --from=builder /app/packages/conciliaciones/dist ./packages/conciliaciones/dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]

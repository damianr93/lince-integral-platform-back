FROM node:20-alpine
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/crm/package.json ./packages/crm/package.json
COPY packages/conciliaciones/package.json ./packages/conciliaciones/package.json
COPY packages/ocr/package.json ./packages/ocr/package.json
COPY packages/asistencia/package.json ./packages/asistencia/package.json
COPY packages/soporte-it/package.json ./packages/soporte-it/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile

COPY apps/ ./apps/
COPY packages/ ./packages/
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "node apps/api/dist/migrate.js && node apps/api/dist/main.js"]

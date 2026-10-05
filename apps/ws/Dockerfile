# Build context = repository root (pnpm workspace). Railway: set RAILWAY_DOCKERFILE_PATH=apps/ws/Dockerfile
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN cd packages/db && npx prisma generate && npx tsc -b
RUN cd apps/ws && npx tsc -b
ENV NODE_ENV=production
CMD ["node", "apps/ws/dist/index.js"]

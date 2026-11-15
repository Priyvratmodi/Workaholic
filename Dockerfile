# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Generate Prisma Client and build all packages
RUN npm run db:generate -w server
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy build outputs
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

# Generate Prisma client for runtime
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Prepare uploads folder
RUN mkdir -p /app/server/uploads

EXPOSE 4000

ENV PORT=4000
ENV DATABASE_URL="file:./dev.db"

# Push schema changes and start server
CMD ["sh", "-c", "npx prisma db push --schema=server/prisma/schema.prisma && node server/dist/server.js"]

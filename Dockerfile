# Build Stage
FROM node:20-alpine AS builder

# Install OpenSSL and libc compatibility for Prisma engine
RUN apk add --no-cache openssl libc6-compat

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

# Install OpenSSL and libc compatibility for Prisma runtime
RUN apk add --no-cache openssl libc6-compat

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

# Deploy database migrations and start server in production
CMD ["sh", "-c", "npx prisma migrate deploy --schema=server/prisma/schema.prisma && node server/dist/server.js"]

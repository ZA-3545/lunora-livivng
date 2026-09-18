# --- Stage 1: Dependencies install karo ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: App build karo ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Stage 3: Production runtime (chhota, clean image) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Standalone build output copy karo (sirf zaroori files)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
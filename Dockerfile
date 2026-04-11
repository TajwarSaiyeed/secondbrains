FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl bash \
    && npm install -g bun
WORKDIR /app

FROM base AS deps
WORKDIR /app

COPY package.json bun.lockb* ./

RUN --mount=type=cache,target=/root/.bun \
    if [ -f bun.lockb ]; then bun install --frozen-lockfile; else npm ci; fi

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun prisma generate

RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

RUN mkdir -p uploads && chown nextjs:nodejs uploads

COPY --chown=nextjs:nodejs start.sh /app/start.sh
RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/start.sh"]
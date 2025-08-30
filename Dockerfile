FROM node:24-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM node:24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build


FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

ENV DATABASE_URL=file:./db/favs.db

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

USER node
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]

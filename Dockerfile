FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache ca-certificates openssl libc6-compat

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_MIGRATED_RESOURCES=""

RUN apk add --no-cache ca-certificates openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_MIGRATED_RESOURCES=""

RUN apk add --no-cache ca-certificates openssl libc6-compat

COPY --from=builder /app ./

EXPOSE 3000

CMD ["sh", "-c", "node scripts/init-db.js && npx next start -H 0.0.0.0 -p ${PORT:-3000}"]

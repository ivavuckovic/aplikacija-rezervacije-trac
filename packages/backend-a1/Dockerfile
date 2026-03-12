# ── Stage 1: Builder ────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src/

RUN npm run prisma:generate
RUN npm run build
RUN cp -r /app/src/generated /app/dist/generated
# Compile seed: rootDir=prisma so output is /app/dist-seed/seed.js
# Then at runtime seed.js needs '../src/generated/prisma' → place seed at prisma/ in prod
RUN npx tsc --module commonjs --target ES2020 --esModuleInterop true --skipLibCheck true \
    --rootDir prisma --outDir /tmp/seed-out prisma/seed.ts

# ── Stage 2: Production ─────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install --legacy-peer-deps --omit=dev

COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
# seed.js at /app/prisma/seed.js; its '../src/generated/prisma' → /app/src/generated/prisma
COPY --from=builder /tmp/seed-out/seed.js ./prisma/seed.js
COPY --from=builder /app/src/generated ./src/generated
COPY prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 4000

CMD ["sh", "-c", "./node_modules/.bin/prisma db push --accept-data-loss && node prisma/seed.js && node dist/index.js"]

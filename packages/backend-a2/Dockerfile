FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src/

RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./dist/generated
COPY prisma ./prisma/

EXPOSE 4001

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/index.js"]

FROM node:22-alpine3.21 AS builder
RUN apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm ci --omit=dev

FROM node:22-bookworm-slim
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs skyops
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=skyops:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=skyops:nodejs --from=builder /app/dist ./dist
USER skyops
EXPOSE 3001
CMD ["node", "dist/index.js"]

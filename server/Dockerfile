FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- DEV target: hot reload, source bind-mounted in later ----
FROM base AS dev
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---- Production dependency layer (cached separately from source) ----
FROM base AS deps
RUN npm ci --omit=dev

# ---- PRODUCTION target: lean, non-root runtime image ----
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

USER appuser
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
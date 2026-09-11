FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- DEV target: Vite dev server with HMR ----
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- BUILD stage: produces static dist/ ----
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ---- PRODUCTION target: nginx serving the built SPA ----
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
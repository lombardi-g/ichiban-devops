# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer and skips npm ci
# on subsequent builds if package.json hasn't changed
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source and build
COPY frontend/ .
RUN npx ng build --configuration production

# ── Stage 2: Serve ─────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default Nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Angular 21 with outputPath "docs" writes browser files to docs/browser/
COPY --from=builder /app/docs/browser /usr/share/nginx/html

# Custom Nginx config: redirects all routes to index.html for Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
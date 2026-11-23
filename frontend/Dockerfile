# ==============================================================================
# Multi-stage Dockerfile for React Vite Frontend
# ==============================================================================
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build production bundle
RUN npm run build

# ==============================================================================
# Production Nginx Serving Stage
# ==============================================================================
FROM nginx:1.25-alpine AS runner

# Copy customized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

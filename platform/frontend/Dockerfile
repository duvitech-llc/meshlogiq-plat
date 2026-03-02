# Build stage
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
# CACHEBUST invalidates the COPY layer so Docker always reads files fresh.
# Pass --build-arg CACHEBUST=$(date +%s) to force a full source re-read.
ARG CACHEBUST=1
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# -------------------------------------------------------------
# STAGE 1: Build Frontend dengan Node.js
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Salin package.json dan package-lock.json terlebih dahulu untuk layer caching
COPY package*.json ./

RUN npm ci || npm install

# Salin seluruh kode proyek
COPY . .

# Argument untuk URL API Backend (bisa dioverride saat docker build)
ARG VITE_API_BASE_URL=https://api.sdnragunan14pagi.sch.id/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Jalankan build production Vite
RUN npm run build

# -------------------------------------------------------------
# STAGE 2: Serve dengan Nginx Alpine (Ringan & Cepat ~25MB)
# -------------------------------------------------------------
FROM nginx:alpine

# Hapus halaman default nginx
RUN rm -rf /usr/share/nginx/html/*

# Salin konfigurasi Nginx khusus SPA (mendukung routing / reload tanpa 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build dari stage 1 ke direktori Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


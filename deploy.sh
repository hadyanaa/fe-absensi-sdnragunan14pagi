#!/bin/bash
set -e

echo "🚀 Memulai proses deployment Web Absensi..."

# Pindah ke direktori script ini berada
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "📥 Mengambil kode terbaru dari GitHub..."
git pull origin main

echo "🛑 Menghentikan container lama..."
docker compose down

echo "🏗️ Membangun ulang dan menyalakan container..."
docker compose up -d --build

echo "🧹 Membersihkan image lama yang tidak terpakai..."
docker image prune -f

echo "✅ Deployment Web Absensi berhasil dijalankan!"
docker compose ps


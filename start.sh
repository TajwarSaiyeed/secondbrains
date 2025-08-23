#!/bin/sh
set -e

echo "🔍 Checking database connection..."
echo "DATABASE_URL: $DATABASE_URL"

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🚀 Starting MindMesh application..."
exec node server.js
#!/bin/sh
set -e

echo "🔍 Checking database connection..."
echo "DATABASE_URL: $DATABASE_URL"

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🚀 Starting SecondBrains application..."
exec node server.js
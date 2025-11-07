#!/bin/bash

echo "🚀 Preparing FriendBook for Vercel deployment..."

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to set environment variables in Vercel dashboard:"
echo "   - TURSO_DATABASE_URL"
echo "   - TURSO_AUTH_TOKEN"

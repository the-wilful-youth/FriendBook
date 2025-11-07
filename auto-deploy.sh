#!/bin/bash

echo "🚀 Auto-deploying FriendBook to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Set project settings automatically
cat > .vercel/project.json << EOF
{
  "projectId": "",
  "orgId": ""
}
EOF

# Deploy with auto-confirm
echo "Deploying..."
vercel --prod --yes --confirm

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at the provided URL"
echo "⚙️  Set these environment variables in Vercel dashboard:"
echo "   TURSO_DATABASE_URL=libsql://friendbook-thewilfulyouth.aws-ap-south-1.turso.io"
echo "   TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE5ODg3MTUsImlkIjoiMDUyZDQxMzEtNTdmZC00NTc3LTg0NmYtNzczMTk1OGZiOWE3IiwicmlkIjoiNGNmOTc5OGQtZjQ5Ni00ZjY4LTkzNmYtYzk1YzhjYTY5ZmY3In0.28oM-2enlVzsWJsLjUu-958lqCZxgdqSD0JJ4O9syUzwTWYQavGe8IbLGUxuJx95ckYCQ59PYed70_XgU81PCw"

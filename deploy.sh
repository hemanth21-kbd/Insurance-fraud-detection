#!/bin/bash

# 🚀 Health Insurance Fraud Detection - Deployment Script

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Health Insurance Fraud Detection App"
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❓ Enter your GitHub repository URL:"
    read repo_url
    git remote add origin $repo_url
fi

echo "📤 Pushing to GitHub..."
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Next steps:"
echo "1. Backend: Go to Render.com → New → Web Service → Connect GitHub → Select python-backend folder"
echo "2. Frontend: Go to Vercel.com → New Project → Import from GitHub"
echo ""
echo "📋 Don't forget to set environment variables:"
echo "   Render: GEMINI_API_KEY"
echo "   Vercel: PYTHON_BACKEND_URL, GEMINI_API_KEY"
echo ""
echo "🎉 Happy deploying!"
#!/bin/bash

# Render Deployment Verification Script
# Run this before deploying to ensure everything is ready

echo "🔍 Checking Render deployment readiness..."
echo ""

# Check if required files exist
echo "📁 Checking required files..."
files=("package.json" "render.yaml" ".env.example" "backend/server.js" "backend/package.json" "index.html")
all_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing!"
        all_exist=false
    fi
done

echo ""

# Check if node_modules exists in backend
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed (will be installed on Render)"
fi

echo ""

# Check if DATABASE_URL is in .env
if [ -f "backend/.env" ]; then
    if grep -q "DATABASE_URL" backend/.env; then
        echo "✅ DATABASE_URL configured in backend/.env"
    else
        echo "⚠️  DATABASE_URL not found in backend/.env"
    fi
else
    echo "⚠️  No backend/.env file (use .env.example as template)"
fi

echo ""

# Check JavaScript API URLs
echo "🌐 Checking API URL configuration..."
if grep -q "window.location.hostname" js/wall.js; then
    echo "✅ js/wall.js has dynamic API URL"
else
    echo "❌ js/wall.js needs dynamic API URL"
fi

if grep -q "window.location.hostname" js/purchase.js; then
    echo "✅ js/purchase.js has dynamic API URL"
else
    echo "❌ js/purchase.js needs dynamic API URL"
fi

echo ""

# Check if CORS is configured for production
if grep -q "CORS_ORIGIN || '\*'" backend/server.js; then
    echo "✅ CORS configured for production"
else
    echo "⚠️  Check CORS configuration in backend/server.js"
fi

echo ""

# Check if static files are served
if grep -q "express.static" backend/server.js; then
    echo "✅ Static file serving enabled"
else
    echo "❌ Static file serving not configured"
fi

echo ""

# Check git status
if [ -d ".git" ]; then
    uncommitted=$(git status --porcelain | wc -l)
    if [ $uncommitted -gt 0 ]; then
        echo "⚠️  You have $uncommitted uncommitted changes"
        echo "   Run 'git add . && git commit -m \"Ready for Render deployment\"'"
    else
        echo "✅ All changes committed"
    fi
    
    unpushed=$(git log origin/$(git branch --show-current)..HEAD --oneline | wc -l)
    if [ $unpushed -gt 0 ]; then
        echo "⚠️  You have $unpushed unpushed commits"
        echo "   Run 'git push origin $(git branch --show-current)'"
    else
        echo "✅ All commits pushed"
    fi
else
    echo "⚠️  Not a git repository"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$all_exist" = true ]; then
    echo "✅ All required files present!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push to GitHub if not done"
    echo "2. Go to https://dashboard.render.com"
    echo "3. Create new Web Service"
    echo "4. Connect repository: misbah7172/Bangladesh-Business-Corner"
    echo "5. Configure environment variables (see RENDER_DEPLOYMENT.md)"
    echo "6. Deploy!"
    echo ""
    echo "📖 Full guide: RENDER_DEPLOYMENT.md"
else
    echo "❌ Some files are missing. Please fix before deploying."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

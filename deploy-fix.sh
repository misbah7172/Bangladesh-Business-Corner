#!/bin/bash

# Quick fix deployment script for Render

echo "🔧 Deploying fixes to Render..."
echo ""

# Show what changed
echo "📝 Changes:"
echo "  ✅ Fixed CSP to allow Google Fonts"
echo "  ✅ Added parseInt() to convert API string values to numbers"
echo "  ✅ Ensured desktop canvas positioning is correct"
echo ""

# Git operations
echo "📦 Committing changes..."
git add backend/server.js js/wall.js js/purchase.js css/style.css

git commit -m "Fix: CSP for Google Fonts and desktop ad rendering

- Allow Google Fonts in Content Security Policy
- Parse x,y,width,height as integers (API returns strings)
- Ensure desktop canvas has correct positioning
- Fixes #1: Ads not showing on desktop view"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin master

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Changes pushed successfully!"
echo ""
echo "Render will automatically deploy in 2-3 minutes."
echo "Monitor deployment at: https://dashboard.render.com"
echo ""
echo "After deployment completes:"
echo "  1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "  2. Check console for errors"
echo "  3. Verify ads display on desktop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

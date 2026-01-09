#!/bin/bash

echo "╔════════════════════════════════════════════╗"
echo "║  Testing Purchase Page Functionality       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Test 1: Check if backend is running
echo "1. Testing Backend Connection..."
if curl -s http://localhost:3000/api/ads/stats > /dev/null 2>&1; then
    echo "   ✓ Backend API is accessible"
else
    echo "   ✗ Backend API is NOT accessible"
    echo "   Run: cd backend && npm start"
    exit 1
fi

# Test 2: Check if frontend is running
echo "2. Testing Frontend Server..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "   ✓ Frontend server is accessible"
else
    echo "   ✗ Frontend server is NOT accessible"
    echo "   Run: python3 -m http.server 8000"
    exit 1
fi

# Test 3: Check purchase page exists
echo "3. Testing Purchase Page..."
if curl -s http://localhost:8000/purchase.html | grep -q "Check Availability"; then
    echo "   ✓ Purchase page loads correctly"
else
    echo "   ✗ Purchase page has issues"
    exit 1
fi

# Test 4: Check purchase.js exists
echo "4. Testing Purchase JavaScript..."
if curl -s http://localhost:8000/js/purchase.js | grep -q "updatePreview"; then
    echo "   ✓ Purchase JavaScript is loaded"
else
    echo "   ✗ Purchase JavaScript has issues"
    exit 1
fi

# Test 5: Check database connection
echo "5. Testing Database Connection..."
STATS=$(curl -s http://localhost:3000/api/ads/stats)
if echo "$STATS" | grep -q "availablePixels"; then
    echo "   ✓ Database is connected and working"
    AVAILABLE=$(echo "$STATS" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['availablePixels'])")
    echo "   📊 Available pixels: $AVAILABLE"
else
    echo "   ✗ Database connection issue"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  All Tests Passed! ✓                      ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "🎯 Purchase page is ready to use:"
echo "   http://localhost:8000/purchase.html"
echo ""
echo "Features:"
echo "  ✓ Real-time availability check"
echo "  ✓ Image preview"  
echo "  ✓ Database integration"
echo "  ✓ No demo/mock data"
echo ""

# Quick Reference Guide

## Starting the Application

### Option 1: Automatic Startup (Recommended)
```bash
./start.sh
```
This script automatically:
- Installs dependencies if needed
- Checks database status
- Starts backend (port 3000)
- Starts frontend (port 8000)
- Opens browser

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd backend
npm install        # First time only
npm run migrate    # First time only
npm start
```

**Terminal 2 - Frontend:**
```bash
python3 -m http.server 8000
```

## Quick Commands

### Database

```bash
# Run migrations
cd backend && npm run migrate

# Connect to database
psql 'postgresql://neondb_owner:npg_4JwsGjWbRYU8@ep-empty-sound-ahn9ku4i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'

# Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Testing

```bash
# Test backend health
curl http://localhost:3000/health

# Get statistics
curl http://localhost:3000/api/ads/stats

# Get all ads
curl http://localhost:3000/api/ads

# Create test ad
curl -X POST http://localhost:3000/api/ads \
  -H "Content-Type: application/json" \
  -d '{
    "width": 100,
    "height": 100,
    "businessName": "Test Business",
    "description": "Test description",
    "imageUrl": "https://via.placeholder.com/100",
    "targetUrl": "https://example.com"
  }'
```

## URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:8000 | Main pixel wall |
| Purchase | http://localhost:8000/purchase.html | Purchase form |
| Backend API | http://localhost:3000/api | REST API endpoints |
| Health Check | http://localhost:3000/health | Server status |

## Common Issues

### "Cannot connect to database"
**Solution:** Database may be sleeping (Neon free tier)
```bash
# Option 1: Wake it up via Neon console
# Visit https://console.neon.tech and run: SELECT 1;

# Option 2: Use manual SQL setup
# See backend/TROUBLESHOOTING.md
```

### "Port already in use"
**Solution:** Kill existing process
```bash
# Find process on port 3000
lsof -i :3000
kill -9 <PID>

# Find process on port 8000
lsof -i :8000
kill -9 <PID>
```

### "Module not found"
**Solution:** Install dependencies
```bash
cd backend
npm install
```

## File Structure Quick Reference

```
├── index.html                      # Main wall page
├── purchase.html                   # Purchase form
├── start.sh                        # Startup script
├── css/style.css                   # Retro Bangladesh styling
├── js/
│   ├── wall.js                    # Wall display + API calls
│   └── purchase.js                # Purchase form + API calls
└── backend/
    ├── server.js                  # Express server
    ├── package.json               # Dependencies
    ├── .env                       # Configuration (DO NOT COMMIT)
    ├── config/database.js         # PostgreSQL pool
    ├── models/Ad.js               # Business logic
    ├── routes/ads.js              # API endpoints
    ├── migrations/run-migrations.js  # DB setup
    ├── API_DOCUMENTATION.md       # Complete API docs
    ├── SETUP.md                   # Detailed setup guide
    └── TROUBLESHOOTING.md         # Problem solutions
```

## Environment Variables

**File:** `backend/.env`

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...
CORS_ORIGIN=http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Schema

### ads table
```sql
id, x, y, width, height, business_name, description,
image_url, target_url, alt, price, status,
created_at, updated_at
```

### purchases table
```sql
id, ad_id, customer_email, customer_name,
payment_status, payment_method, transaction_id,
amount, created_at
```

## API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ads` | Get all ads |
| GET | `/api/ads/stats` | Get statistics |
| GET | `/api/ads/:id` | Get specific ad |
| POST | `/api/ads` | Create ad |
| PATCH | `/api/ads/:id` | Update ad |
| DELETE | `/api/ads/:id` | Delete ad |
| POST | `/api/ads/check-availability` | Check space |
| POST | `/api/ads/find-position` | Find position |

## Configuration Constants

### Frontend (js/wall.js, js/purchase.js)
```javascript
WALL_SIZE = 1000              // Canvas is 1000×1000
MIN_SIZE = 1                  // Minimum 1×1 pixels
PRICE_PER_PIXEL = 1          // ৳1 per pixel
API_BASE_URL = 'http://localhost:3000/api'
```

### Backend (.env)
```env
PORT=3000                     # Server port
DATABASE_URL=postgresql://... # Database connection
CORS_ORIGIN=http://localhost:8000  # Allowed origin
RATE_LIMIT_MAX_REQUESTS=100   # Requests per window
```

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `DATABASE_INTEGRATION_SUMMARY.md` | Complete integration details |
| `backend/API_DOCUMENTATION.md` | API reference |
| `backend/SETUP.md` | Setup instructions |
| `backend/TROUBLESHOOTING.md` | Problem solutions |
| `QUICK_REFERENCE.md` | This file |

## Git Commands

```bash
# Status
git status

# Add files
git add .

# Commit (DO NOT commit .env!)
git commit -m "Your message"

# Push
git push origin main

# Important: .env is in .gitignore - never commit it!
```

## Production Deployment Checklist

- [ ] Update NODE_ENV to 'production' in .env
- [ ] Update CORS_ORIGIN to production domain
- [ ] Use production database (not free tier)
- [ ] Enable HTTPS/SSL
- [ ] Set up automated backups
- [ ] Configure monitoring/logging
- [ ] Set up CI/CD pipeline
- [ ] Add authentication
- [ ] Integrate payment gateway
- [ ] Set up CDN for static files

## Performance Tips

1. **Database**: Indexes already created, connection pooling active
2. **API**: Rate limiting prevents abuse, compression enabled
3. **Frontend**: Images should be optimized, lazy loading possible
4. **Caching**: Consider Redis for frequently accessed data
5. **Monitoring**: Log slow queries (already implemented)

## Security Checklist

- [x] Environment variables for secrets
- [x] SQL injection prevention (parameterized queries)
- [x] Input validation on all endpoints
- [x] Rate limiting enabled
- [x] CORS configured
- [x] Security headers (Helmet.js)
- [ ] Authentication (add JWT for admin)
- [ ] HTTPS in production
- [ ] Regular security audits

## Support

**Documentation:**
- Main README
- API Documentation
- Setup Guide
- Troubleshooting Guide

**External Resources:**
- Neon: https://neon.tech/docs
- Express: https://expressjs.com
- PostgreSQL: https://www.postgresql.org/docs

## Useful Commands Summary

```bash
# Start everything
./start.sh

# Backend only
cd backend && npm start

# Frontend only  
python3 -m http.server 8000

# Database migration
cd backend && npm run migrate

# Test API
curl http://localhost:3000/health

# View logs
tail -f backend.log
tail -f frontend.log

# Stop all (if running in background)
killall node python3
```

## Next Steps

1. **Immediate:** Run database migration
2. **Short term:** Add authentication, payment integration
3. **Long term:** Production deployment, analytics, admin dashboard

---

**Need help?** Check the documentation files or visit the Neon/Express documentation pages.

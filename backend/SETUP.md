# Backend Setup and Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon or local)
- npm or yarn package manager

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with your Neon database credentials:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_4JwsGjWbRYU8@ep-empty-sound-ahn9ku4i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
CORS_ORIGIN=http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** Never commit `.env` to version control!

### 3. Run Database Migrations

```bash
npm run migrate
```

This will create the necessary tables:
- `ads` - Stores advertisement data
- `purchases` - Tracks purchase history
- Indexes for performance optimization
- Triggers for automatic timestamp updates

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on http://localhost:3000

### 5. Update Frontend Configuration

The frontend is already configured to use the API at `http://localhost:3000/api`.

If deploying to production, update the API_BASE_URL in:
- `/js/wall.js` (line 6)
- `/js/purchase.js` (line 6)

## Testing the Setup

### 1. Check Server Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-09T..."
}
```

### 2. Check Stats
```bash
curl http://localhost:3000/api/ads/stats
```

Expected response:
```json
{
  "success": true,
  "data": {
    "totalPixels": 1000000,
    "occupiedPixels": 0,
    "availablePixels": 1000000,
    "totalAds": 0,
    "totalRevenue": 0
  }
}
```

### 3. Test Ad Creation

```bash
curl -X POST http://localhost:3000/api/ads \
  -H "Content-Type: application/json" \
  -d '{
    "width": 100,
    "height": 100,
    "businessName": "Test Business",
    "description": "This is a test advertisement",
    "imageUrl": "https://via.placeholder.com/100",
    "targetUrl": "https://example.com",
    "alt": "Test Ad"
  }'
```

## Running Both Frontend and Backend

### Option 1: Two Terminal Windows

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# From project root
python3 -m http.server 8000
```

### Option 2: Using Process Manager (PM2)

Install PM2:
```bash
npm install -g pm2
```

Start backend:
```bash
cd backend
pm2 start server.js --name pixel-wall-api
```

Start frontend:
```bash
pm2 start --name pixel-wall-frontend "python3 -m http.server 8000"
```

View logs:
```bash
pm2 logs
```

Stop all:
```bash
pm2 stop all
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection pool
├── migrations/
│   └── run-migrations.js    # Database schema setup
├── models/
│   └── Ad.js               # Ad model with business logic
├── routes/
│   └── ads.js              # API route handlers
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
└── server.js              # Express server entry point
```

## Security Checklist

- [x] Environment variables for sensitive data
- [x] Database connection with SSL
- [x] Connection pooling with limits
- [x] SQL injection prevention (parameterized queries)
- [x] Input validation on all endpoints
- [x] Rate limiting (100 requests/15 min)
- [x] CORS configuration
- [x] Helmet.js security headers
- [x] Error handling without stack traces in production
- [ ] Authentication (implement JWT for admin routes)
- [ ] Authorization (implement role-based access)
- [ ] Payment gateway integration
- [ ] HTTPS/SSL certificates for production

## Performance Features

1. **Connection Pooling**: 20 max connections, 30s idle timeout
2. **Indexes**: Strategic indexes on frequently queried columns
3. **Slow Query Logging**: Logs queries taking >1 second
4. **Compression**: Gzip compression for responses
5. **Efficient Queries**: Optimized SQL queries with proper joins

## Common Issues and Solutions

### Issue: "ECONNREFUSED" when starting server
**Solution:** Check if PostgreSQL connection string is correct in `.env`

### Issue: "Port 3000 already in use"
**Solution:** Kill the process or change PORT in `.env`
```bash
# Find process
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Issue: Frontend can't connect to API
**Solution:** 
1. Check backend is running: `curl http://localhost:3000/health`
2. Check CORS settings in backend/.env
3. Check API_BASE_URL in frontend JS files

### Issue: Database connection timeout
**Solution:** 
1. Check Neon database is active (may sleep on free tier)
2. Verify SSL settings in connection string
3. Check firewall/network settings

## Database Management

### View All Ads
```sql
SELECT * FROM ads WHERE status = 'active';
```

### Check Space Usage
```sql
SELECT 
  SUM(width * height) as occupied_pixels,
  1000000 - SUM(width * height) as available_pixels,
  COUNT(*) as total_ads
FROM ads 
WHERE status = 'active';
```

### Clear All Ads (for testing)
```sql
DELETE FROM ads;
```

### Reset Auto-increment
```sql
ALTER SEQUENCE ads_id_seq RESTART WITH 1;
```

## Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-production-database-url>
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Deployment Platforms

**Heroku:**
```bash
# Install Heroku CLI
heroku create pixel-wall-api
heroku config:set DATABASE_URL="<your-db-url>"
heroku config:set CORS_ORIGIN="<your-frontend-url>"
git push heroku main
```

**Railway:**
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

**DigitalOcean App Platform:**
1. Create new app from GitHub
2. Add environment variables
3. Deploy

**AWS EC2:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd backend
npm install
npm run migrate

# Use PM2 for process management
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Maintenance

### Health Checks
Set up automated health checks to `/health` endpoint

### Database Backups
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Log Monitoring
```bash
# View PM2 logs
pm2 logs pixel-wall-api

# View system logs
tail -f /var/log/nodejs/app.log
```

### Performance Monitoring
- Monitor slow queries (logged automatically)
- Track API response times
- Monitor database connection pool usage
- Set up alerts for error rates

## API Rate Limits

Default: 100 requests per 15 minutes per IP

To adjust:
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes in ms
RATE_LIMIT_MAX_REQUESTS=100    # max requests
```

## Support and Documentation

- API Documentation: `backend/API_DOCUMENTATION.md`
- Main README: `../README.md`
- Issues: Report bugs via GitHub issues

## Next Steps

1. [x] Database integration complete
2. [x] API endpoints implemented
3. [x] Frontend connected to API
4. [ ] Add authentication system
5. [ ] Integrate payment gateway (Stripe/bKash)
6. [ ] Add admin dashboard
7. [ ] Implement email notifications
8. [ ] Add analytics tracking
9. [ ] Set up automated testing
10. [ ] Deploy to production

# Deploy to Render.com

This guide explains how to deploy the Bangladesh Business Corner (Million Pixel Wall) to Render.

## Prerequisites

1. A [Render.com](https://render.com) account
2. Your code pushed to a GitHub repository
3. A PostgreSQL database (we're using Neon)

## Deployment Steps

### 1. Connect Your Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository: `misbah7172/Bangladesh-Business-Corner`
4. Click **"Connect"**

### 2. Configure the Web Service

Fill in the following settings:

- **Name**: `bangladesh-business-corner` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Singapore)
- **Branch**: `master`
- **Root Directory**: Leave empty (root of repo)
- **Runtime**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or your preferred plan)

### 3. Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | `10000` | Render uses this port |
| `DATABASE_URL` | `<your-neon-db-url>` | Your Neon PostgreSQL connection string |
| `CORS_ORIGIN` | `*` | Allows all origins (or specify your domain) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 minutes in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

**Important:** Get your `DATABASE_URL` from your Neon dashboard. It should look like:
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 4. Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start the server
3. Wait 2-5 minutes for the first deployment
4. Your app will be live at: `https://your-service-name.onrender.com`

## Post-Deployment

### Health Check

Visit `https://your-service-name.onrender.com/api/health` to verify the API is running.

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-09T..."
}
```

### Test the Application

1. Visit your Render URL (e.g., `https://bangladesh-business-corner.onrender.com`)
2. Test the purchase page: `/purchase.html`
3. Verify ads display on the wall

## Database Setup

The database tables should already exist in your Neon database. If starting fresh:

1. Go to your Neon dashboard
2. Run the SQL from `backend/migrations/001_create_tables.sql`

## Troubleshooting

### "Application failed to respond"

- Check the Render logs for errors
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from Render's IP ranges

### CORS Errors

- Set `CORS_ORIGIN=*` for development
- For production, set to your specific domain: `CORS_ORIGIN=https://yourdomain.com`

### Database Connection Failed

- Verify connection string has `?sslmode=require` at the end
- Check if Neon database is active (they pause on free tier after inactivity)
- Test connection using Render's shell: `psql $DATABASE_URL -c "SELECT 1"`

### Static Files Not Loading

- Ensure `index.html` is at the root of the repository
- Check that CSS/JS paths are correct (`/css/`, `/js/`)
- Verify static middleware is enabled in `backend/server.js`

## Free Tier Limitations

Render's free tier:
- App spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month (essentially 24/7 for one app)

## Upgrade Options

To keep your app always running:
1. Upgrade to **Starter** plan ($7/month)
2. This prevents spin-down and improves performance

## Custom Domain

To use your own domain:

1. Go to your web service **Settings**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `www.yourdomain.com`)
4. Add the CNAME record to your DNS:
   ```
   CNAME: www → your-service-name.onrender.com
   ```

## Monitoring

- View logs: Dashboard → Your Service → **Logs**
- Monitor metrics: Dashboard → Your Service → **Metrics**
- Set up email alerts: **Settings** → **Notifications**

## Environment-Specific Configuration

The app automatically detects the environment:
- Local: Uses `http://localhost:3000/api`
- Production: Uses same-origin `/api` endpoint

No code changes needed when deploying!

## Support

If you encounter issues:
1. Check Render's [documentation](https://render.com/docs)
2. Review application logs in Render dashboard
3. Test API endpoints using curl or Postman
4. Verify environment variables are set correctly

---

**Deployment Time**: ~3-5 minutes
**Status**: Ready for production ✅

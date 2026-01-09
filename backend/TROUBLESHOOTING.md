# Database Connection Troubleshooting

## Issue: Cannot connect to Neon database

The connection is timing out. Here are the steps to resolve:

### Option 1: Wake Up Neon Database (Recommended)

Neon free tier databases sleep after inactivity and need to be "woken up":

1. **Log into Neon Console:**
   - Go to https://console.neon.tech
   - Navigate to your project: `ep-empty-sound-ahn9ku4i`

2. **Wake the database:**
   - Click on your database
   - Run a simple query in the SQL Editor: `SELECT 1;`
   - This will wake the database

3. **Try migration again:**
   ```bash
   npm run migrate
   ```

### Option 2: Verify Connection String

1. **Check the connection string format:**
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

2. **Get fresh connection string from Neon:**
   - Go to https://console.neon.tech
   - Navigate to your project
   - Go to "Connection Details"
   - Copy the connection string (Pooled connection)
   - Update `.env` file

3. **Test connection with psql:**
   ```bash
   psql 'postgresql://neondb_owner:npg_4JwsGjWbRYU8@ep-empty-sound-ahn9ku4i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
   ```

### Option 3: Check Network/Firewall

1. **Test connectivity:**
   ```bash
   # Test if you can reach the host
   nc -zv ep-empty-sound-ahn9ku4i-pooler.c-3.us-east-1.aws.neon.tech 5432
   ```

2. **Check firewall rules:**
   - Ensure port 5432 is not blocked
   - Check VPN/proxy settings
   - Try different network if possible

### Option 4: Manual Database Setup

If you continue having issues, you can set up the database manually:

1. **Connect to your Neon database using their web console**

2. **Run this SQL manually:**

```sql
-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  alt TEXT,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_position CHECK (x >= 0 AND x < 1000 AND y >= 0 AND y < 1000),
  CONSTRAINT valid_size CHECK (width > 0 AND width <= 1000 AND height > 0 AND height <= 1000),
  CONSTRAINT valid_status CHECK (status IN ('active', 'pending', 'expired', 'removed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(x, y);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Create indexes for purchases
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(payment_status);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. **Verify tables were created:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Option 5: Use Alternative PostgreSQL Database

If Neon continues to have issues:

**Local PostgreSQL:**
```bash
# Install PostgreSQL locally
sudo apt-get install postgresql

# Create database
sudo -u postgres createdb pixelwall

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pixelwall
```

**Other hosted options:**
- Supabase: https://supabase.com (free tier, better uptime)
- ElephantSQL: https://www.elephantsql.com (free tier)
- Railway: https://railway.app (PostgreSQL addon)
- Heroku Postgres: https://www.heroku.com/postgres

### Verifying Setup

Once database is configured:

```bash
# Test connection
cd backend
node -e "const db = require('./config/database'); setTimeout(() => process.exit(0), 5000);"

# Run migrations
npm run migrate

# Start server
npm start
```

### Common Error Messages

**ETIMEDOUT / Connection timeout:**
- Database is sleeping (Neon free tier)
- Network/firewall blocking connection
- Wrong hostname/port

**Authentication failed:**
- Wrong password in connection string
- User doesn't have permissions

**Database does not exist:**
- Database name is incorrect
- Database needs to be created first

### Getting Help

If you continue to have issues:

1. Check Neon status page: https://status.neon.tech
2. Check your current IP: https://whatismyipaddress.com
3. Verify Neon allows connections from your IP (usually allowed by default)
4. Contact Neon support: https://neon.tech/docs/introduction/support

### Success Indicators

When connection works:
```
✓ Database connected successfully at: 2026-01-09T...
✓ Database tables created successfully
Migration completed successfully
```

Then you can start the server:
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════╗
║  Million Pixel Wall API Server             ║
║  Environment: development                  ║
║  Port: 3000                                ║
║  CORS Origin: http://localhost:8000        ║
╚════════════════════════════════════════════╝
```

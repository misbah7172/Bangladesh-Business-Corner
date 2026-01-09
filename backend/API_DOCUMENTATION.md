# Backend API Documentation

## Overview
RESTful API for Bangladesh Business Corner - Million Pixel Wall application with PostgreSQL database.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication required. For production, implement JWT authentication.

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Returns 429 status code when exceeded

## Endpoints

### Health Check
```http
GET /health
```
Returns server health status.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-09T10:30:00.000Z"
}
```

---

### Get All Ads
```http
GET /api/ads
```
Returns all active advertisements.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "x": 0,
      "y": 0,
      "width": 100,
      "height": 100,
      "businessName": "My Business",
      "description": "Business description",
      "imageUrl": "https://example.com/image.jpg",
      "targetUrl": "https://example.com",
      "alt": "My Business Ad",
      "createdAt": "2026-01-09T10:00:00.000Z"
    }
  ]
}
```

---

### Get Ad by ID
```http
GET /api/ads/:id
```

**Parameters:**
- `id` (number): Ad ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100,
    "businessName": "My Business",
    "description": "Business description",
    "imageUrl": "https://example.com/image.jpg",
    "targetUrl": "https://example.com",
    "alt": "My Business Ad",
    "price": 10000,
    "status": "active",
    "createdAt": "2026-01-09T10:00:00.000Z",
    "updatedAt": "2026-01-09T10:00:00.000Z"
  }
}
```

---

### Get Statistics
```http
GET /api/ads/stats
```
Returns pixel wall statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPixels": 1000000,
    "occupiedPixels": 50000,
    "availablePixels": 950000,
    "totalAds": 5,
    "totalRevenue": 50000
  }
}
```

---

### Check Space Availability
```http
POST /api/ads/check-availability
```

**Body:**
```json
{
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 100
}
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "message": "Space is available"
}
```

---

### Find Available Position
```http
POST /api/ads/find-position
```
Automatically finds an available position for given dimensions.

**Body:**
```json
{
  "width": 100,
  "height": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "x": 0,
    "y": 0
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "No available space found for the requested dimensions"
}
```

---

### Create Ad
```http
POST /api/ads
```
Creates a new advertisement. Position is automatically assigned.

**Body:**
```json
{
  "width": 100,
  "height": 100,
  "businessName": "My Business",
  "description": "Business description here",
  "imageUrl": "https://example.com/image.jpg",
  "targetUrl": "https://example.com",
  "alt": "My Business Ad (optional)"
}
```

**Validation Rules:**
- `width`: 1-1000 pixels (required)
- `height`: 1-1000 pixels (required)
- `businessName`: max 255 characters (required)
- `description`: max 1000 characters (optional)
- `imageUrl`: valid URL (required)
- `targetUrl`: valid URL (required)
- `alt`: max 255 characters (optional)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100,
    "businessName": "My Business",
    "description": "Business description",
    "imageUrl": "https://example.com/image.jpg",
    "targetUrl": "https://example.com",
    "alt": "My Business Ad",
    "price": 10000,
    "status": "active",
    "createdAt": "2026-01-09T10:00:00.000Z"
  },
  "message": "Ad created successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "No available space found for the requested dimensions"
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "Space is no longer available"
}
```

---

### Update Ad
```http
PATCH /api/ads/:id
```
Updates an existing advertisement. Position and size cannot be changed.

**Parameters:**
- `id` (number): Ad ID

**Body (all fields optional):**
```json
{
  "businessName": "Updated Business Name",
  "description": "Updated description",
  "imageUrl": "https://example.com/new-image.jpg",
  "targetUrl": "https://example.com/new-url",
  "alt": "Updated alt text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100,
    "businessName": "Updated Business Name",
    "description": "Updated description",
    "imageUrl": "https://example.com/new-image.jpg",
    "targetUrl": "https://example.com/new-url",
    "alt": "Updated alt text",
    "price": 10000,
    "status": "active",
    "createdAt": "2026-01-09T10:00:00.000Z",
    "updatedAt": "2026-01-09T11:00:00.000Z"
  },
  "message": "Ad updated successfully"
}
```

---

### Delete Ad
```http
DELETE /api/ads/:id
```
Soft deletes an advertisement (sets status to 'removed').

**Parameters:**
- `id` (number): Ad ID

**Response:**
```json
{
  "success": true,
  "message": "Ad deleted successfully"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Width must be between 1 and 1000",
      "param": "width",
      "location": "body"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Ad not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Database Schema

### ads Table
```sql
CREATE TABLE ads (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_ads_position` on (x, y)
- `idx_ads_status` on (status)
- `idx_ads_created_at` on (created_at DESC)

### purchases Table
```sql
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_purchases_email` on (customer_email)
- `idx_purchases_status` on (payment_status)

---

## Performance Optimizations

1. **Connection Pooling**: PostgreSQL connection pool with 20 max connections
2. **Indexes**: Strategic indexes on frequently queried columns
3. **Query Monitoring**: Logs slow queries (>1s) for optimization
4. **Compression**: Gzip compression for API responses
5. **Caching Headers**: Appropriate cache headers for static responses

---

## Security Features

1. **Helmet.js**: Security headers (CSP, XSS protection, etc.)
2. **CORS**: Configurable origin whitelist
3. **Rate Limiting**: IP-based rate limiting
4. **Input Validation**: express-validator for all inputs
5. **SQL Injection Prevention**: Parameterized queries
6. **URL Validation**: Strict URL validation for imageUrl and targetUrl
7. **SSL/TLS**: Database connection with SSL required

---

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API design allows multiple instances
2. **Database Pooling**: Efficient connection reuse
3. **Soft Deletes**: Maintains data integrity and audit trail
4. **Transaction Support**: ACID compliance for critical operations
5. **Auto-positioning Algorithm**: Efficient space allocation algorithm

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Security
CORS_ORIGIN=http://localhost:8000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run Migrations:**
   ```bash
   npm run migrate
   ```

4. **Start Server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

---

## Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test Get Stats
```bash
curl http://localhost:3000/api/ads/stats
```

### Test Create Ad
```bash
curl -X POST http://localhost:3000/api/ads \
  -H "Content-Type: application/json" \
  -d '{
    "width": 100,
    "height": 100,
    "businessName": "Test Business",
    "description": "Test description",
    "imageUrl": "https://via.placeholder.com/100",
    "targetUrl": "https://example.com",
    "alt": "Test Ad"
  }'
```

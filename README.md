# The Million Pixel Wall - Bangladesh Business Corner

A modern implementation of the million-pixel advertising concept with a retro-Bangladesh theme. Each pixel represents ৳1 of ad space. Users can purchase rectangular blocks on a 1000×1000 pixel canvas to display their advertisements.

## Features

- **1,000,000 Pixel Canvas**: Total advertising space of 1000×1000 pixels (10×10px grid)
- **PostgreSQL Database**: Full database integration with Neon cloud PostgreSQL
- **RESTful API**: Express.js backend with comprehensive API endpoints
- **Dynamic Ad Rendering**: Ads loaded from database and rendered dynamically
- **Interactive Wall**: Clickable ads redirect to external URLs
- **Purchase System**: Automated position allocation for new ads
- **Retro Bangladesh Theme**: Early-2000s internet aesthetic with Bangladeshi cultural elements
- **Business Descriptions**: Hover tooltips showing business information
- **Mobile Responsive**: Full canvas display on all screen sizes
- **Security**: Rate limiting, input validation, SQL injection prevention
- **Performance**: Connection pooling, indexed queries, compression
- **Scalable Architecture**: Built for horizontal scaling and high traffic

## Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with retro aesthetic
- **Vanilla JavaScript ES6+**: No frameworks
- **Lenis**: Smooth scrolling library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **PostgreSQL**: Database (Neon cloud)
- **Security**: Helmet.js, CORS, rate limiting
- **Validation**: express-validator

## Project Structure

```
The Million Pixel Wall/
├── index.html              # Main wall page
├── purchase.html           # Purchase form page
├── css/
│   └── style.css          # Retro Bangladesh styling
├── js/
│   ├── wall.js            # Main wall logic (API integration)
│   ├── purchase.js        # Purchase page logic (API integration)
│   └── lenis.min.js       # Lenis library
├── data/
│   └── ads.json           # Legacy data storage (replaced by database)
├── backend/               # Backend API server
│   ├── config/
│   │   └── database.js    # PostgreSQL connection pool
│   ├── migrations/
│   │   └── run-migrations.js  # Database schema setup
│   ├── models/
│   │   └── Ad.js          # Ad model with business logic
│   ├── routes/
│   │   └── ads.js         # API route handlers
│   ├── .env               # Environment variables (not in git)
│   ├── .env.example       # Environment template
│   ├── package.json       # Backend dependencies
│   ├── server.js          # Express server entry point
│   ├── API_DOCUMENTATION.md    # Complete API docs
│   ├── SETUP.md           # Setup instructions
│   └── TROUBLESHOOTING.md # Database troubleshooting
└── README.md              # This file
```

## Quick Start

### Frontend Only (Demo Mode)

```bash
# Serve with Python
python3 -m http.server 8000

# Or with Node.js
npx http-server -p 8000

# Visit http://localhost:8000
```

### Full Stack with Database

**Prerequisites:**
- Node.js 18+ installed
- PostgreSQL database (Neon account or local)

**1. Backend Setup:**

```bash
# Install backend dependencies
cd backend
npm install

# Configure database connection
# Edit .env file with your database URL

# Run database migrations
npm run migrate

# Start backend server
npm start
# Server runs on http://localhost:3000
```

**2. Frontend Setup:**

```bash
# In a new terminal, from project root
python3 -m http.server 8000
# Frontend runs on http://localhost:8000
```

**Troubleshooting:**
- If migration fails, see `backend/TROUBLESHOOTING.md`
- Database connection issues: Check if Neon database is active
- API connection errors: Ensure backend is running on port 3000

### Documentation

- **Backend API**: See `backend/API_DOCUMENTATION.md`
- **Setup Guide**: See `backend/SETUP.md`
- **Troubleshooting**: See `backend/TROUBLESHOOTING.md`

## Usage

### Viewing the Wall

1. Visit http://localhost:8000
2. View the 1000×1000 pixel canvas with 10×10px grid
3. Hover over ads to see business descriptions
4. Click ads to visit their target URLs
5. See live statistics in the header

### Purchasing Pixel Space

1. Click the **"GRAB YOUR PIXELS"** button in the navbar
2. Fill in the purchase form:
   - **Size**: Width and height (minimum 1×1 pixels)
   - **Business Name**: Your business name
   - **Description**: Business description (shown on hover)
   - **Image URL**: URL to your ad image
   - **Target URL**: Where clicks should redirect
3. Click "Check Availability" to verify space
4. Submit form - position is automatically assigned by backend
5. Your ad appears immediately on the wall!

## API Endpoints

### Get All Ads
```http
GET /api/ads
```

### Get Statistics
```http
GET /api/ads/stats
```
Returns: total pixels, occupied pixels, available pixels, total ads, revenue

### Create Ad
```http
POST /api/ads
Content-Type: application/json

{
  "width": 100,
  "height": 100,
  "businessName": "My Business",
  "description": "Business description",
  "imageUrl": "https://example.com/image.jpg",
  "targetUrl": "https://example.com"
}
```

**Complete API documentation:** See `backend/API_DOCUMENTATION.md`

## Database Schema

### ads Table
- Position (x, y), size (width, height)
- Business information (name, description)
- Media (imageUrl, targetUrl, alt)
- Metadata (price, status, timestamps)
- Constraints and indexes for performance

### purchases Table
- Customer information
- Payment tracking
- Transaction history

**Complete schema:** See `backend/API_DOCUMENTATION.md`

## Configuration

### Frontend Configuration

Edit constants in `js/wall.js` and `js/purchase.js`:

```javascript
this.WALL_SIZE = 1000;              // Canvas size
this.MIN_SIZE = 1;                  // Minimum purchase size
this.PRICE_PER_PIXEL = 1;          // ৳1 per pixel
this.API_BASE_URL = 'http://localhost:3000/api';  // Backend API
```

### Backend Configuration

Edit `backend/.env`:

```env
PORT=3000                          # Server port
NODE_ENV=development               # Environment
DATABASE_URL=postgresql://...      # PostgreSQL connection
CORS_ORIGIN=http://localhost:8000  # Allowed frontend origin
RATE_LIMIT_MAX_REQUESTS=100        # Rate limit
```

### Change Pricing

Modify `PRICE_PER_PIXEL` in `purchase.js`:

```javascript
this.PRICE_PER_PIXEL = 1;  // $1 per pixel
```

### Styling

All styles in `css/style.css`:

- CSS variables for colors at `:root`
- Responsive breakpoints at 768px and 480px
- Hover effects on `.ad-block:hover`

## Performance Optimization

### Current Optimizations

- Hardware acceleration with CSS transforms
- Efficient DOM manipulation
- Event delegation where possible
- Lazy rendering of empty blocks
- Image loading optimization

### Future Scalability

For walls larger than 1M pixels:

1. **Tiling System**: Divide wall into tiles, render only visible tiles
2. **Virtual Scrolling**: Load ads on-demand as user pans
3. **Canvas API**: Replace DOM elements with canvas rendering
4. **Pagination**: Split into multiple pages/levels
5. **Backend Integration**: Database storage and API

## Browser Support

- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support
- Mobile browsers: ✓ Touch gestures supported

Requires ES6+ JavaScript support.

## Production Deployment

### Backend Requirements

For production use, implement:

1. **Database**: Store ad data (PostgreSQL, MongoDB, etc.)
2. **API**: REST or GraphQL endpoints
3. **Payment Processing**: Stripe, PayPal integration
4. **Authentication**: User accounts and management
5. **Admin Panel**: Moderate and approve ads
6. **CDN**: Serve images via CDN
7. **Caching**: Redis for performance

### Security Considerations

- Validate and sanitize all URLs
- Implement CSRF protection
- Rate limiting for purchases
- Content moderation system
- HTTPS only
- CSP headers

### Example Backend Endpoints

```
GET  /api/ads              # Get all ads
POST /api/ads              # Create new ad (requires auth)
GET  /api/ads/:id          # Get specific ad
PUT  /api/ads/:id          # Update ad (requires auth)
DELETE /api/ads/:id        # Delete ad (requires auth)
POST /api/check-availability  # Check if space available
POST /api/payment          # Process payment
```

## API Integration Example

Replace JSON file loading with API calls:

```javascript
async loadAdData() {
    const response = await fetch('/api/ads');
    const data = await response.json();
    this.ads = data.ads;
}
```

## Known Limitations

- **Demo Mode**: No actual payment processing
- **Client-Side Storage**: Ads stored in JSON file
- **No Authentication**: Anyone can view purchase form
- **No Validation**: Server-side validation needed for production
- **Simple Collision**: Basic overlap detection

## Future Enhancements

- Real-time updates with WebSockets
- Analytics dashboard for advertisers
- Ad expiration and renewal system
- Auction system for prime locations
- Mobile app version
- NFT integration for pixel ownership
- Social sharing features
- Advanced search and filtering

## License

This project is provided as-is for educational and commercial use.

## Credits

- **Lenis**: [@studio-freight/lenis](https://github.com/darkroomengineering/lenis) - Smooth scroll library
- **Concept**: Inspired by The Million Dollar Homepage

## Support

For issues or questions, please open an issue in the repository.

---

Built with ❤️ using vanilla JavaScript

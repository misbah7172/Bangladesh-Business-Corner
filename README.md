# The Million Pixel Wall

A modern implementation of the million-pixel advertising concept where each pixel represents $1 of ad space. Users can purchase rectangular blocks on a 1000×1000 pixel canvas to display their advertisements.

## Features

- **1,000,000 Pixel Canvas**: Total advertising space of 1000×1000 pixels
- **Dynamic Ad Rendering**: Ads loaded from JSON and rendered dynamically
- **Interactive Wall**: Clickable ads redirect to external URLs
- **Purchase System**: Click empty spaces to buy pixel blocks
- **Smooth Navigation**: Zoom and pan with Lenis smooth scrolling library
- **Responsive Design**: Scales to fit any screen size
- **Collision Detection**: Prevents overlapping ad placements
- **Performance Optimized**: Fast loading with efficient rendering
- **Scalable Architecture**: Built to handle future expansion beyond 1M pixels

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **Lenis**: Smooth scroll and zoom library

## Project Structure

```
The Million Pixel Wall/
├── index.html              # Main wall page
├── purchase.html           # Purchase form page
├── css/
│   └── style.css          # All styles (responsive)
├── js/
│   ├── wall.js            # Main wall logic
│   ├── purchase.js        # Purchase page logic
│   └── lenis.min.js       # Lenis library
├── data/
│   └── ads.json           # Ad data storage
└── README.md              # Documentation
```

## Getting Started

### Installation

1. Clone or download the project
2. No build process required - pure HTML/CSS/JS
3. Serve with any web server

### Local Development

Using Python:
```bash
cd "The Million Pixel Wall"
python -m http.server 8000
```

Using Node.js:
```bash
npx http-server -p 8000
```

Then open: `http://localhost:8000`

## Usage

### Viewing the Wall

1. Open `index.html` in a browser
2. Use controls to zoom in/out
3. Click and drag to pan around the wall
4. Hover over ads to see information
5. Click ads to visit their target URLs

### Purchasing Pixel Space

1. Click any empty (light blue) space on the wall
2. Fill in the purchase form:
   - Position and size (minimum 10×10 pixels)
   - Image URL for your ad
   - Target URL for click redirects
   - Optional alt text
3. Check availability to ensure no overlap
4. Submit the form (demo mode - no actual payment)

### Keyboard Shortcuts

- `+` or `=`: Zoom in
- `-`: Zoom out
- `0`: Reset view

## Data Format

Ads are stored in `data/ads.json`:

```json
{
  "ads": [
    {
      "x": 0,
      "y": 0,
      "width": 200,
      "height": 100,
      "imageUrl": "https://example.com/ad.jpg",
      "targetUrl": "https://example.com",
      "alt": "Advertisement description"
    }
  ]
}
```

### Field Specifications

- `x`: X-position (0-990)
- `y`: Y-position (0-990)
- `width`: Block width (10-1000 pixels)
- `height`: Block height (10-1000 pixels)
- `imageUrl`: URL to ad image
- `targetUrl`: URL to redirect on click
- `alt`: Alt text for accessibility (optional)

## Configuration

Edit constants in `js/wall.js`:

```javascript
this.WALL_SIZE = 1000;        // Total wall dimensions
this.MIN_BLOCK_SIZE = 10;     // Minimum ad size
this.GRID_SIZE = 100;         // Grid tiling size
```

## Customization

### Change Wall Size

To scale beyond 1 million pixels:

1. Update `WALL_SIZE` in both `wall.js` and `purchase.js`
2. Adjust CSS `.pixel-wall` width/height
3. Update max values in purchase form inputs

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

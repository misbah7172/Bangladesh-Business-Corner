/**
 * The Million Pixel Wall - Main Application
 * 
 * Features:
 * - Dynamic ad block rendering from JSON
 * - Smooth zoom and pan with Lenis
 * - Collision detection for ad blocks
 * - Responsive grid system
 * - Optimized for performance
 */

class PixelWall {
    constructor() {
        // Configuration
        this.WALL_SIZE = 1000;
        this.MIN_BLOCK_SIZE = 10;
        this.GRID_SIZE = 100; // For tiling future optimization
        this.API_BASE_URL = 'http://localhost:3000/api';
        
        // State
        this.ads = [];
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // DOM elements
        this.wallElement = document.getElementById('pixelWall');
        this.wrapperElement = document.getElementById('canvasWrapper');
        this.hoverInfo = document.getElementById('hoverInfo');
        this.pixelsSoldElement = document.getElementById('pixelsSold');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Load ad data from API
            await this.loadAdData();
            
            // Render the wall
            this.renderWall();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize Lenis for smooth scrolling
            this.initLenis();
            
            // Update stats
            this.updateStats();
            
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }
    
    /**
     * Load ad data from API
     */
    async loadAdData() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/ads`);
            if (!response.ok) {
                throw new Error('Failed to load ad data from API');
            }
            const result = await response.json();
            this.ads = result.data || [];
        } catch (error) {
            console.warn('Failed to load ads from API, starting with empty wall:', error);
            this.ads = [];
        }
    }
    
    /**
     * Render the pixel wall with all ads
     */
    renderWall() {
        // Clear existing content
        this.wallElement.innerHTML = '';
        
        // Render occupied ad blocks
        this.ads.forEach((ad, index) => {
            this.createAdBlock(ad, index);
        });
        
        // Render empty clickable blocks
        this.createEmptyBlocks();
    }
    
    /**
     * Create an ad block element
     */
    createAdBlock(ad, index) {
        const block = document.createElement('div');
        block.className = 'ad-block';
        block.style.left = `${ad.x}px`;
        block.style.top = `${ad.y}px`;
        block.style.width = `${ad.width}px`;
        block.style.height = `${ad.height}px`;
        
        // Set background image
        if (ad.imageUrl) {
            block.style.backgroundImage = `url('${ad.imageUrl}')`;
        }
        
        // Add click handler for redirect (only if targetUrl exists)
        if (ad.targetUrl) {
            block.style.cursor = 'pointer';
            block.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
            });
        } else {
            block.style.cursor = 'default';
        }
        
        // Hover effects - show business description
        block.addEventListener('mouseenter', () => {
            const businessName = ad.businessName || ad.alt || 'Business Advertisement';
            const description = ad.description || `${ad.width}×${ad.height} pixels reserved`;
            this.showHoverInfo(businessName, description);
        });
        
        block.addEventListener('mouseleave', () => {
            this.hideHoverInfo();
        });
        
        // Alt text for accessibility
        if (ad.alt) {
            block.setAttribute('aria-label', ad.alt);
            block.setAttribute('title', ad.alt);
        }
        
        this.wallElement.appendChild(block);
    }
    
    /**
     * Create empty blocks for visual indication only (not clickable)
     * Use the navbar button to navigate to purchase page
     */
    createEmptyBlocks() {
        // No empty blocks needed - the entire grid is available
        // Users can see the fine pixel grid and use "GRAB YOUR PIXELS" button to purchase
    }
    
    /**
     * Calculate empty spaces on the wall
     * This is a simplified algorithm - in production, use more sophisticated space partitioning
     */
    calculateEmptySpaces() {
        const emptySpaces = [];
        const gridSize = 100; // Check in 100px blocks
        
        for (let y = 0; y < this.WALL_SIZE; y += gridSize) {
            for (let x = 0; x < this.WALL_SIZE; x += gridSize) {
                // Check if this grid space is available
                if (!this.isSpaceOccupied(x, y, gridSize, gridSize)) {
                    emptySpaces.push({ x, y, width: gridSize, height: gridSize });
                }
            }
        }
        
        return emptySpaces;
    }
    
    /**
     * Check if a space is occupied by any ad
     */
    isSpaceOccupied(x, y, width, height) {
        return this.ads.some(ad => {
            return !(
                x + width <= ad.x ||
                x >= ad.x + ad.width ||
                y + height <= ad.y ||
                y >= ad.y + ad.height
            );
        });
    }
    
    /**
     * Check if a new block would overlap with existing ads
     */
    checkCollision(x, y, width, height, excludeIndex = -1) {
        return this.ads.some((ad, index) => {
            if (index === excludeIndex) return false;
            
            return !(
                x + width <= ad.x ||
                x >= ad.x + ad.width ||
                y + height <= ad.y ||
                y >= ad.y + ad.height
            );
        });
    }
    
    /**
     * Show hover information
     */
    showHoverInfo(title, details) {
        const titleEl = document.getElementById('adTitle');
        const detailsEl = document.getElementById('adDetails');
        
        if (titleEl) titleEl.textContent = title;
        if (detailsEl) detailsEl.textContent = details;
        
        this.hoverInfo.classList.remove('hidden');
    }
    
    /**
     * Hide hover information
     */
    hideHoverInfo() {
        this.hoverInfo.classList.add('hidden');
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Mouse wheel is disabled for zoom
        // Pan with mouse drag is disabled
        
        // Keyboard shortcuts disabled
    }
    
    /**
     * Initialize Lenis smooth scrolling
     */
    initLenis() {
        if (typeof Lenis !== 'undefined') {
            this.lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smooth: true,
                smoothTouch: false
            });
            
            // Animation frame loop
            const raf = (time) => {
                this.lenis.raf(time);
                requestAnimationFrame(raf);
            };
            requestAnimationFrame(raf);
        }
    }
    
    /**
     * Update statistics from API
     */
    async updateStats() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/ads/stats`);
            if (response.ok) {
                const result = await response.json();
                const pixelsSold = result.data.occupiedPixels;
                this.pixelsSoldElement.textContent = pixelsSold.toLocaleString();
            } else {
                // Fallback to local calculation
                const pixelsSold = this.ads.reduce((sum, ad) => {
                    return sum + (ad.width * ad.height);
                }, 0);
                this.pixelsSoldElement.textContent = pixelsSold.toLocaleString();
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Fallback to local calculation
            const pixelsSold = this.ads.reduce((sum, ad) => {
                return sum + (ad.width * ad.height);
            }, 0);
            this.pixelsSoldElement.textContent = pixelsSold.toLocaleString();
        }
    }
    
    /**
     * Add a new ad (for future use with backend)
     */
    addAd(ad) {
        // Validate
        if (ad.x < 0 || ad.y < 0 || 
            ad.x + ad.width > this.WALL_SIZE || 
            ad.y + ad.height > this.WALL_SIZE) {
            throw new Error('Ad position out of bounds');
        }
        
        if (ad.width < this.MIN_BLOCK_SIZE || ad.height < this.MIN_BLOCK_SIZE) {
            throw new Error(`Minimum block size is ${this.MIN_BLOCK_SIZE}x${this.MIN_BLOCK_SIZE}`);
        }
        
        // Check collision
        if (this.checkCollision(ad.x, ad.y, ad.width, ad.height)) {
            throw new Error('Ad space is already occupied');
        }
        
        // Add to array
        this.ads.push(ad);
        
        // Re-render
        this.renderWall();
        this.updateStats();
        
        return true;
    }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pixelWall = new PixelWall();
    });
} else {
    window.pixelWall = new PixelWall();
}

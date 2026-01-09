/**
 * Purchase Page JavaScript
 * Handles the pixel space purchase form
 */

class PurchaseManager {
    constructor() {
        // Configuration
        this.WALL_SIZE = 1000;
        this.MIN_SIZE = 1; // Minimum 1 pixel
        this.PRICE_PER_PIXEL = 1; // ৳1 per pixel
        this.API_BASE_URL = 'http://localhost:3000/api';
        
        // State
        this.ads = [];
        
        // DOM elements
        this.form = document.getElementById('purchaseForm');
        this.widthInput = document.getElementById('width');
        this.heightInput = document.getElementById('height');
        this.imageUrlInput = document.getElementById('imageUrl');
        this.targetUrlInput = document.getElementById('targetUrl');
        this.altTextInput = document.getElementById('altText');
        this.descriptionInput = document.getElementById('description');
        this.totalCostElement = document.getElementById('totalCost');
        this.totalPixelsElement = document.getElementById('totalPixels');
        this.availablePixelsElement = document.getElementById('availablePixels');
        this.previewElement = document.getElementById('adPreview');
        this.messageElement = document.getElementById('message');
        this.checkButton = document.getElementById('checkAvailability');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the purchase manager
     */
    async init() {
        // Load existing ads from API
        await this.loadAdData();
        
        // Parse URL parameters (if coming from wall click)
        this.parseUrlParams();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Calculate initial cost
        this.updateCost();
        
        // Update available pixels display
        await this.updateAvailablePixels();
    }
    
    /**
     * Load existing ad data from API to check availability
     */
    async loadAdData() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/ads`);
            if (response.ok) {
                const result = await response.json();
                this.ads = result.data || [];
            }
        } catch (error) {
            console.warn('Could not load existing ads from API:', error);
            this.ads = [];
        }
    }
    
    /**
     * Parse URL parameters to pre-fill form
     */
    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('width')) {
            this.widthInput.value = params.get('width');
        }
        if (params.has('height')) {
            this.heightInput.value = params.get('height');
        }
        
        this.updateCost();
        this.updateAvailablePixels();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Update cost when dimensions change
        this.widthInput.addEventListener('input', () => {
            this.updateCost();
            this.validateDimensions();
        });
        this.heightInput.addEventListener('input', () => {
            this.updateCost();
            this.validateDimensions();
        });
        
        // Update preview when image URL changes
        this.imageUrlInput.addEventListener('input', () => this.updatePreview());
        this.imageUrlInput.addEventListener('blur', () => this.updatePreview());
        
        // Check availability button (async handler)
        this.checkButton.addEventListener('click', async () => {
            this.checkButton.disabled = true;
            this.checkButton.textContent = 'Checking...';
            try {
                await this.checkAvailability();
            } finally {
                this.checkButton.disabled = false;
                this.checkButton.textContent = 'Check Availability';
            }
        });
        
        // Form submission (async handler)
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(e);
        });
    }
    
    /**
     * Calculate and update available individual pixels from API
     */
    async updateAvailablePixels() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/ads/stats`);
            if (response.ok) {
                const result = await response.json();
                const availablePixels = result.data.availablePixels;
                
                if (this.availablePixelsElement) {
                    this.availablePixelsElement.textContent = availablePixels.toLocaleString();
                }
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            this.showMessage('Unable to connect to server. Please ensure backend is running.', 'error');
        }
    }
    
    /**
     * Update total cost calculation
     */
    updateCost() {
        const width = parseInt(this.widthInput.value) || 0;
        const height = parseInt(this.heightInput.value) || 0;
        const totalPixels = width * height;
        const totalCost = totalPixels * this.PRICE_PER_PIXEL;
        
        this.totalPixelsElement.textContent = totalPixels.toLocaleString();
        this.totalCostElement.textContent = totalCost.toLocaleString();
    }
    
    /**
     * Update image preview
     */
    updatePreview() {
        const imageUrl = this.imageUrlInput.value.trim();
        
        if (!imageUrl) {
            this.previewElement.innerHTML = '<p>Preview will appear here after entering image URL</p>';
            return;
        }
        
        // Validate URL format
        try {
            new URL(imageUrl);
        } catch (error) {
            this.previewElement.innerHTML = '<p style="color: var(--error);">Invalid image URL</p>';
            return;
        }
        
        // Show loading
        this.previewElement.innerHTML = '<p>Loading preview...</p>';
        
        // Create image element
        const img = new Image();
        
        img.onload = () => {
            this.previewElement.innerHTML = '';
            const previewImg = document.createElement('img');
            previewImg.src = imageUrl;
            previewImg.alt = this.altTextInput.value || 'Ad preview';
            this.previewElement.appendChild(previewImg);
        };
        
        img.onerror = () => {
            this.previewElement.innerHTML = '<p style="color: var(--error);">Failed to load image. Please check the URL.</p>';
        };
        
        img.src = imageUrl;
    }
    
    /**
     * Validate dimension inputs
     */
    validateDimensions() {
        const width = parseInt(this.widthInput.value);
        const height = parseInt(this.heightInput.value);
        
        // Check minimum size
        if (width < this.MIN_SIZE) {
            this.widthInput.setCustomValidity(`Minimum width is ${this.MIN_SIZE} pixel(s)`);
        } else if (width > this.WALL_SIZE) {
            this.widthInput.setCustomValidity('Width exceeds wall boundary');
        } else {
            this.widthInput.setCustomValidity('');
        }
        
        if (height < this.MIN_SIZE) {
            this.heightInput.setCustomValidity(`Minimum height is ${this.MIN_SIZE} pixel(s)`);
        } else if (height > this.WALL_SIZE) {
            this.heightInput.setCustomValidity('Height exceeds wall boundary');
        } else {
            this.heightInput.setCustomValidity('');
        }
        
        this.updateCost();
    }
    
    /**
     * Check if the selected space is available using API
     */
    async checkAvailability() {
        const width = parseInt(this.widthInput.value);
        const height = parseInt(this.heightInput.value);
        
        // Validate inputs
        if (isNaN(width) || isNaN(height)) {
            this.showMessage('Please fill in width and height fields', 'error');
            return;
        }
        
        // Check minimum size
        if (width < this.MIN_SIZE || height < this.MIN_SIZE) {
            this.showMessage(`Minimum size is ${this.MIN_SIZE}×${this.MIN_SIZE} pixel(s)`, 'error');
            return;
        }
        
        try {
            // Get stats from API
            const response = await fetch(`${this.API_BASE_URL}/ads/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            
            const result = await response.json();
            const availablePixels = result.data.availablePixels;
            const requestedPixels = width * height;
            
            if (requestedPixels > availablePixels) {
                this.showMessage(
                    `Not enough space! You requested ${requestedPixels.toLocaleString()} pixels but only ${availablePixels.toLocaleString()} individual pixels are available.`,
                    'error'
                );
            } else {
                const totalCost = requestedPixels * this.PRICE_PER_PIXEL;
                this.showMessage(
                    `✓ Space is available! Total cost: ৳${totalCost.toLocaleString()} for ${requestedPixels.toLocaleString()} pixels.`,
                    'success'
                );
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            this.showMessage(
                `⚠️ Could not check availability: ${error.message}. ` +
                `Backend server must be running on http://localhost:3000`,
                'error'
            );
        }
    }
    
    /**
     * Check if space collides with existing ads
     */
    checkCollision(x, y, width, height) {
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
     * Handle form submission with API
     */
    async handleSubmit(e) {
        // e.preventDefault is handled by the event listener now
        
        // Get form values (position will be assigned by backend)
        const adData = {
            width: parseInt(this.widthInput.value),
            height: parseInt(this.heightInput.value),
            imageUrl: this.imageUrlInput.value.trim(),
            targetUrl: this.targetUrlInput.value.trim(),
            alt: this.altTextInput.value.trim(),
            description: this.descriptionInput.value.trim(),
            businessName: this.altTextInput.value.trim() || 'Business'
        };
        
        // Validate
        if (!this.validateAdData(adData)) {
            return;
        }
        
        // Show loading state
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        try {
            // Send ad data to API
            const response = await fetch(`${this.API_BASE_URL}/ads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create ad');
            }
            
            // Success!
            const ad = result.data;
            const totalPixels = ad.width * ad.height;
            const totalCost = ad.price;
            
            this.showMessage(
                `Success! Your ad has been created at position (${ad.x}, ${ad.y}). ` +
                `Size: ${ad.width}×${ad.height} pixels (${totalPixels.toLocaleString()} pixels) ` +
                `Cost: ৳${totalCost.toLocaleString()}. ` +
                `Your ad is now live on the wall! <a href="index.html">View the wall</a>`,
                'success'
            );
            
            // Disable form
            this.form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
            
        } catch (error) {
            console.error('Error submitting ad:', error);
            
            this.showMessage(
                `⚠️ Failed to create ad: ${error.message}<br><br>` +
                `Please ensure:<br>` +
                `• Backend server is running on http://localhost:3000<br>` +
                `• Database is connected<br>` +
                `• All required fields are filled correctly<br><br>` +
                `<a href="index.html">Return to wall</a>`,
                'error'
            );
            
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
    
    /**
     * Validate ad data
     */
    validateAdData(adData) {
        // Check all required fields
        if (!adData.imageUrl || !adData.targetUrl || !adData.description) {
            this.showMessage('Please fill in all required fields including business description', 'error');
            return false;
        }
        
        // Validate URLs
        try {
            new URL(adData.imageUrl);
            new URL(adData.targetUrl);
        } catch (error) {
            this.showMessage('Please enter valid URLs', 'error');
            return false;
        }
        
        // Check size
        if (adData.width < this.MIN_SIZE || adData.height < this.MIN_SIZE) {
            this.showMessage(`Minimum size is ${this.MIN_SIZE}×${this.MIN_SIZE} pixel(s)`, 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * Show message to user
     */
    showMessage(text, type = 'info') {
        this.messageElement.innerHTML = text;
        this.messageElement.className = `message ${type}`;
        this.messageElement.classList.remove('hidden');
        
        // Scroll to message
        this.messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.purchaseManager = new PurchaseManager();
    });
} else {
    window.purchaseManager = new PurchaseManager();
}

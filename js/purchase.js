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
        // Load existing ads
        await this.loadAdData();
        
        // Parse URL parameters (if coming from wall click)
        this.parseUrlParams();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Calculate initial cost
        this.updateCost();
    }
    
    /**
     * Load existing ad data to check availability
     */
    async loadAdData() {
        try {
            const response = await fetch('data/ads.json');
            if (response.ok) {
                const data = await response.json();
                this.ads = data.ads || [];
            }
        } catch (error) {
            console.warn('Could not load existing ads:', error);
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
        
        // Check availability button
        this.checkButton.addEventListener('click', () => this.checkAvailability());
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    /**
     * Calculate and update available individual pixels
     */
    updateAvailablePixels() {
        const totalPixels = this.WALL_SIZE * this.WALL_SIZE; // 1,000,000
        const occupiedPixels = this.ads.reduce((sum, ad) => {
            return sum + (ad.width * ad.height);
        }, 0);
        
        const availablePixels = totalPixels - occupiedPixels;
        
        if (this.availablePixelsElement) {
            this.availablePixelsElement.textContent = availablePixels.toLocaleString();
        }
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
     * Check if the selected space is available
     */
    checkAvailability() {
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
        
        // Check if requested size fits in remaining pixels
        const totalPixels = this.WALL_SIZE * this.WALL_SIZE;
        const occupiedPixels = this.ads.reduce((sum, ad) => sum + (ad.width * ad.height), 0);
        const availablePixels = totalPixels - occupiedPixels;
        const requestedPixels = width * height;
        
        if (requestedPixels > availablePixels) {
            this.showMessage(
                `Not enough space! You requested ${requestedPixels.toLocaleString()} pixels but only ${availablePixels.toLocaleString()} individual pixels are available.`,
                'error'
            );
        } else {
            const totalCost = requestedPixels * this.PRICE_PER_PIXEL;
            this.showMessage(
                `Space is available! Total cost: ৳${totalCost.toLocaleString()} for ${requestedPixels.toLocaleString()} pixels.`,
                'success'
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
     * Handle form submission
     */
    handleSubmit(e) {
        e.preventDefault();
        
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
        
        // Check if enough pixels are available
        const totalPixels = this.WALL_SIZE * this.WALL_SIZE;
        const occupiedPixels = this.ads.reduce((sum, ad) => sum + (ad.width * ad.height), 0);
        const availablePixels = totalPixels - occupiedPixels;
        const requestedPixels = adData.width * adData.height;
        
        if (requestedPixels > availablePixels) {
            this.showMessage(
                `Not enough space available. Requested: ${requestedPixels.toLocaleString()} pixels, Available: ${availablePixels.toLocaleString()} pixels.`,
                'error'
            );
            return;
        }
        
        // Calculate cost
        const totalPixels = adData.width * adData.height;
        const totalCost = totalPixels * this.PRICE_PER_PIXEL;
        
        // In production, this would:
        // 1. Send data to backend API
        // 2. Process payment
        // 3. Store ad data in database
        // 4. Return confirmation
        
        // For demo, show success message
        this.showMessage(
            `Success! Your purchase of ${totalPixels.toLocaleString()} pixels (৳${totalCost.toLocaleString()}) has been submitted. ` +
            `In production, you would be redirected to payment processing. ` +
            `After payment, your ad would appear on the wall within 24 hours.`,
            'success'
        );
        
        // Store in localStorage for demo (simulate backend)
        this.savePurchase(adData);
        
        // Disable form
        this.form.querySelectorAll('input, button').forEach(el => el.disabled = true);
        
        // Show return link
        setTimeout(() => {
            this.showMessage(
                'Thank you for your purchase! <a href="index.html">Return to wall</a>',
                'info'
            );
        }, 3000);
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
     * Save purchase to localStorage (demo only)
     */
    savePurchase(adData) {
        try {
            const purchases = JSON.parse(localStorage.getItem('pixelWallPurchases') || '[]');
            purchases.push({
                ...adData,
                timestamp: new Date().toISOString(),
                status: 'pending'
            });
            localStorage.setItem('pixelWallPurchases', JSON.stringify(purchases));
        } catch (error) {
            console.error('Failed to save purchase:', error);
        }
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

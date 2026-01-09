const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Ad = require('../models/Ad');
const router = express.Router();

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

/**
 * GET /api/ads
 * Get all active ads
 */
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.getAllAds();
    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads'
    });
  }
});

/**
 * GET /api/ads/stats
 * Get pixel wall statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Ad.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /api/ads/:id
 * Get ad by ID
 */
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Invalid ad ID')
], handleValidationErrors, async (req, res) => {
  try {
    const ad = await Ad.getAdById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    res.json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad'
    });
  }
});

/**
 * POST /api/ads/check-availability
 * Check if a space is available
 */
router.post('/check-availability', [
  body('x').isInt({ min: 0, max: 999 }).withMessage('X must be between 0 and 999'),
  body('y').isInt({ min: 0, max: 999 }).withMessage('Y must be between 0 and 999'),
  body('width').isInt({ min: 1, max: 1000 }).withMessage('Width must be between 1 and 1000'),
  body('height').isInt({ min: 1, max: 1000 }).withMessage('Height must be between 1 and 1000')
], handleValidationErrors, async (req, res) => {
  try {
    const { x, y, width, height } = req.body;
    
    // Check if ad would go out of bounds
    if (x + width > 1000 || y + height > 1000) {
      return res.json({
        success: true,
        available: false,
        message: 'Space extends beyond canvas boundaries'
      });
    }
    
    const isAvailable = await Ad.checkSpaceAvailability(x, y, width, height);
    
    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Space is available' : 'Space is already occupied'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability'
    });
  }
});

/**
 * POST /api/ads/find-position
 * Find an available position for given dimensions
 */
router.post('/find-position', [
  body('width').isInt({ min: 1, max: 1000 }).withMessage('Width must be between 1 and 1000'),
  body('height').isInt({ min: 1, max: 1000 }).withMessage('Height must be between 1 and 1000')
], handleValidationErrors, async (req, res) => {
  try {
    const { width, height } = req.body;
    
    const position = await Ad.findAvailablePosition(width, height);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'No available space found for the requested dimensions'
      });
    }
    
    res.json({
      success: true,
      data: position
    });
  } catch (error) {
    console.error('Error finding position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find position'
    });
  }
});

/**
 * POST /api/ads
 * Create a new ad
 */
router.post('/', [
  body('width').isInt({ min: 1, max: 1000 }).withMessage('Width must be between 1 and 1000'),
  body('height').isInt({ min: 1, max: 1000 }).withMessage('Height must be between 1 and 1000'),
  body('businessName').trim().notEmpty().isLength({ max: 255 }).withMessage('Business name is required (max 255 characters)'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('imageUrl').trim().isURL().withMessage('Valid image URL is required'),
  body('targetUrl').trim().isURL().withMessage('Valid target URL is required'),
  body('alt').optional().trim().isLength({ max: 255 }).withMessage('Alt text max 255 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { width, height, businessName, description, imageUrl, targetUrl, alt } = req.body;
    
    // Calculate price (৳1 per pixel)
    const price = width * height;
    
    // Find available position
    const position = await Ad.findAvailablePosition(width, height);
    
    if (!position) {
      return res.status(400).json({
        success: false,
        message: 'No available space found for the requested dimensions'
      });
    }
    
    // Create ad
    const ad = await Ad.createAd({
      x: position.x,
      y: position.y,
      width,
      height,
      businessName,
      description,
      imageUrl,
      targetUrl,
      alt: alt || businessName,
      price
    });
    
    res.status(201).json({
      success: true,
      data: ad,
      message: 'Ad created successfully'
    });
  } catch (error) {
    console.error('Error creating ad:', error);
    
    if (error.message === 'Space is not available') {
      return res.status(409).json({
        success: false,
        message: 'Space is no longer available'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create ad'
    });
  }
});

/**
 * PATCH /api/ads/:id
 * Update an ad
 */
router.patch('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Invalid ad ID'),
  body('businessName').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('imageUrl').optional().trim().isURL(),
  body('targetUrl').optional().trim().isURL(),
  body('alt').optional().trim().isLength({ max: 255 })
], handleValidationErrors, async (req, res) => {
  try {
    const updates = {};
    
    if (req.body.businessName) updates.business_name = req.body.businessName;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.imageUrl) updates.image_url = req.body.imageUrl;
    if (req.body.targetUrl) updates.target_url = req.body.targetUrl;
    if (req.body.alt !== undefined) updates.alt = req.body.alt;
    
    const ad = await Ad.updateAd(req.params.id, updates);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    res.json({
      success: true,
      data: ad,
      message: 'Ad updated successfully'
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ad'
    });
  }
});

/**
 * DELETE /api/ads/:id
 * Delete an ad (soft delete)
 */
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Invalid ad ID')
], handleValidationErrors, async (req, res) => {
  try {
    const deleted = await Ad.deleteAd(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ad'
    });
  }
});

module.exports = router;

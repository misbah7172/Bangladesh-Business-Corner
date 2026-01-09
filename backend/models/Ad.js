const db = require('../config/database');

/**
 * Check if a space is available (no overlapping ads)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {number} excludeAdId - Ad ID to exclude (for updates)
 * @returns {Promise<boolean>} True if space is available
 */
async function checkSpaceAvailability(x, y, width, height, excludeAdId = null) {
  const query = `
    SELECT id FROM ads 
    WHERE status = 'active'
    AND NOT (
      x >= $1 + $3 OR
      x + width <= $1 OR
      y >= $2 + $4 OR
      y + height <= $2
    )
    ${excludeAdId ? 'AND id != $5' : ''}
  `;
  
  const params = excludeAdId 
    ? [x, y, width, height, excludeAdId]
    : [x, y, width, height];
  
  const result = await db.query(query, params);
  return result.rows.length === 0;
}

/**
 * Get all active ads
 * @returns {Promise<Array>} Array of ads
 */
async function getAllAds() {
  const result = await db.query(`
    SELECT 
      id, x, y, width, height, business_name, description,
      image_url, target_url, alt, created_at
    FROM ads 
    WHERE status = 'active'
    ORDER BY created_at DESC
  `);
  
  return result.rows.map(row => ({
    id: row.id,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    businessName: row.business_name,
    description: row.description,
    imageUrl: row.image_url,
    targetUrl: row.target_url,
    alt: row.alt,
    createdAt: row.created_at
  }));
}

/**
 * Get statistics about the pixel wall
 * @returns {Promise<Object>} Statistics object
 */
async function getStats() {
  const result = await db.query(`
    SELECT 
      COALESCE(SUM(width * height), 0) as occupied_pixels,
      COUNT(*) as total_ads,
      COALESCE(SUM(price), 0) as total_revenue
    FROM ads 
    WHERE status = 'active'
  `);
  
  const occupied = parseInt(result.rows[0].occupied_pixels);
  
  return {
    totalPixels: 1000000,
    occupiedPixels: occupied,
    availablePixels: 1000000 - occupied,
    totalAds: parseInt(result.rows[0].total_ads),
    totalRevenue: parseFloat(result.rows[0].total_revenue)
  };
}

/**
 * Find available position for ad
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @returns {Promise<Object|null>} Position {x, y} or null
 */
async function findAvailablePosition(width, height) {
  // Get all occupied spaces
  const result = await db.query(`
    SELECT x, y, width, height 
    FROM ads 
    WHERE status = 'active'
    ORDER BY y, x
  `);
  
  const occupiedSpaces = result.rows;
  
  // Try to find a position using a simple left-to-right, top-to-bottom scan
  for (let y = 0; y <= 1000 - height; y += 10) {
    for (let x = 0; x <= 1000 - width; x += 10) {
      let isAvailable = true;
      
      // Check if this position overlaps with any existing ad
      for (const space of occupiedSpaces) {
        const overlaps = !(
          x >= space.x + space.width ||
          x + width <= space.x ||
          y >= space.y + space.height ||
          y + height <= space.y
        );
        
        if (overlaps) {
          isAvailable = false;
          break;
        }
      }
      
      if (isAvailable) {
        return { x, y };
      }
    }
  }
  
  return null;
}

/**
 * Create a new ad
 * @param {Object} adData - Ad data
 * @returns {Promise<Object>} Created ad
 */
async function createAd(adData) {
  const { x, y, width, height, businessName, description, imageUrl, targetUrl, alt, price } = adData;
  
  // Check if space is available
  const isAvailable = await checkSpaceAvailability(x, y, width, height);
  if (!isAvailable) {
    throw new Error('Space is not available');
  }
  
  // Insert ad
  const result = await db.query(`
    INSERT INTO ads (x, y, width, height, business_name, description, image_url, target_url, alt, price, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
    RETURNING *
  `, [x, y, width, height, businessName, description, imageUrl, targetUrl, alt, price]);
  
  const row = result.rows[0];
  
  // Parse the row data (psql returns pipe-delimited values)
  if (Array.isArray(row)) {
    // Parse array format: [id, x, y, width, height, business_name, description, image_url, target_url, alt, price, status, created_at, updated_at]
    return {
      id: parseInt(row[0]),
      x: parseInt(row[1]),
      y: parseInt(row[2]),
      width: parseInt(row[3]),
      height: parseInt(row[4]),
      businessName: row[5],
      description: row[6],
      imageUrl: row[7],
      targetUrl: row[8],
      alt: row[9],
      price: parseFloat(row[10]),
      status: row[11],
      createdAt: row[12]
    };
  }
  
  // Object format (if column parsing worked)
  return {
    id: parseInt(row.id),
    x: parseInt(row.x),
    y: parseInt(row.y),
    width: parseInt(row.width),
    height: parseInt(row.height),
    businessName: row.business_name,
    description: row.description,
    imageUrl: row.image_url,
    targetUrl: row.target_url,
    alt: row.alt,
    price: parseFloat(row.price),
    status: row.status,
    createdAt: row.created_at
  };
}

/**
 * Get ad by ID
 * @param {number} id - Ad ID
 * @returns {Promise<Object|null>} Ad or null
 */
async function getAdById(id) {
  const result = await db.query(`
    SELECT * FROM ads WHERE id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    businessName: row.business_name,
    description: row.description,
    imageUrl: row.image_url,
    targetUrl: row.target_url,
    alt: row.alt,
    price: parseFloat(row.price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Update ad
 * @param {number} id - Ad ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated ad
 */
async function updateAd(id, updates) {
  const allowedFields = ['business_name', 'description', 'image_url', 'target_url', 'alt', 'status'];
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  values.push(id);
  
  const result = await db.query(`
    UPDATE ads 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    businessName: row.business_name,
    description: row.description,
    imageUrl: row.image_url,
    targetUrl: row.target_url,
    alt: row.alt,
    price: parseFloat(row.price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Delete ad (soft delete by setting status to 'removed')
 * @param {number} id - Ad ID
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteAd(id) {
  const result = await db.query(`
    UPDATE ads 
    SET status = 'removed'
    WHERE id = $1
    RETURNING id
  `, [id]);
  
  return result.rows.length > 0;
}

module.exports = {
  checkSpaceAvailability,
  getAllAds,
  getStats,
  findAvailablePosition,
  createAd,
  getAdById,
  updateAd,
  deleteAd
};

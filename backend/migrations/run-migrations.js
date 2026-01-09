const db = require('../config/database');

/**
 * Initialize database tables
 */
async function createTables() {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Create ads table
    await client.query(`
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
      )
    `);
    
    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(x, y);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);
    `);
    
    // Create purchases table for tracking purchase history
    await client.query(`
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
      )
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(customer_email);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(payment_status);
    `);
    
    // Create function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
      CREATE TRIGGER update_ads_updated_at
        BEFORE UPDATE ON ads
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query('COMMIT');
    console.log('✓ Database tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };

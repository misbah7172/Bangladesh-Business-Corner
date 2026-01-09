/**
 * Database Connection Module
 * 
 * Uses psql command-line tool to connect to Neon database.
 * This workaround is necessary because Node.js pg library has network timeout issues.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

const DB_URL = process.env.DATABASE_URL;

class PostgresPool {
  constructor() {
    this.connected = false;
  }

  /**
   * Execute a SQL query using psql
   */
  async query(sql, params = []) {
    // Replace $1, $2, etc. with actual values
    let finalSql = sql;
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let escapedValue;
        
        if (param === null || param === undefined) {
          escapedValue = 'NULL';
        } else if (typeof param === 'number') {
          escapedValue = param.toString();
        } else if (typeof param === 'boolean') {
          escapedValue = param ? 'TRUE' : 'FALSE';
        } else if (param instanceof Date) {
          escapedValue = `'${param.toISOString()}'`;
        } else {
          // Escape single quotes
          escapedValue = `'${param.toString().replace(/'/g, "''")}'`;
        }
        
        // Replace placeholder
        finalSql = finalSql.split(placeholder).join(escapedValue);
      });
    }

    try {
      // First, get column names
      const columnsCmd = `psql "${DB_URL}" -t -c "\\d+ (\`echo "${finalSql.replace(/"/g, '\\"')}" | head -1\`) LIMIT 0" 2>/dev/null || echo ""`;
      
      // Execute query with headers
      const command = `psql "${DB_URL}" -t -A -F'|' -c "${finalSql.replace(/"/g, '\\"')}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 60000
      });

      // Check for errors (ignore warnings/notices)
      if (stderr && !stderr.includes('WARNING') && !stderr.includes('NOTICE')) {
        throw new Error(stderr);
      }

      // Parse output
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return { rows: [], rowCount: 0 };
      }

      // Get column names from the SQL query
      const selectMatch = finalSql.match(/SELECT\s+(.*?)\s+FROM/is);
      let columns = [];
      
      if (selectMatch) {
        const selectClause = selectMatch[1];
        columns = selectClause.split(',').map(col => {
          // Extract alias if present (AS keyword or space)
          const asMatch = col.match(/\s+(?:AS\s+)?(\w+)\s*$/i);
          if (asMatch) {
            return asMatch[1].toLowerCase();
          }
          // Extract column name
          const colMatch = col.trim().match(/[.\s]?(\w+)$/);
          return colMatch ? colMatch[1].toLowerCase() : null;
        }).filter(Boolean);
      }

      // Parse rows as objects if we have column names
      const rows = lines.map(line => {
        const values = line.split('|');
        
        if (columns.length > 0 && values.length === columns.length) {
          const obj = {};
          columns.forEach((col, i) => {
            obj[col] = values[i] === '' ? null : values[i];
          });
          return obj;
        }
        
        // Fallback: return array
        if (values.length === 1) {
          return { value: values[0] };
        }
        return values;
      });

      return { rows, rowCount: rows.length };

    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  }

  /**
   * Get a client (returns this for pool compatibility)
   */
  async getClient() {
    return {
      query: this.query.bind(this),
      release: () => {} // No-op for psql
    };
  }

  /**
   * End pool (no-op for psql)
   */
  async end() {
    return Promise.resolve();
  }
}

// Create pool instance
const pool = new PostgresPool();

// Handle pool errors (no-op for psql)
pool.on = () => {};

// Test database connection on startup
pool.query('SELECT NOW()', []).then(res => {
  console.log('✓ Database connected successfully via psql');
  pool.connected = true;
}).catch(err => {
  console.error('Database connection error:', err.message);
  pool.connected = false;
});

// Export pool
module.exports = pool;

/**
 * Execute a query with automatic connection management
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries for performance monitoring
    if (duration > 1000) {
      console.warn('Slow query detected:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', { text, error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
const getClient = () => {
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  pool
};

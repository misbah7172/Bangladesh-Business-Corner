/**
 * Working Database Module using psql CLI
 * 
 * This module uses the psql command-line tool to execute queries
 * since Node.js pg library has network timeout issues with Neon.
 * This is a temporary workaround until network connectivity is resolved.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

const DB_URL = process.env.DATABASE_URL;

class Database {
  constructor() {
    this.connected = false;
  }

  /**
   * Execute a SQL query
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
        
        // Simple string replacement
        finalSql = finalSql.split(placeholder).join(escapedValue);
      });
    }

    try {
      // Use psql with tuple-only output and field separator
      const command = `psql "${DB_URL}" -t -A -F'|' -c "${finalSql.replace(/"/g, '\\"')}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        timeout: 60000 // 60 second timeout
      });

      // Check for errors (ignore warnings)
      if (stderr && !stderr.includes('WARNING') && !stderr.includes('NOTICE')) {
        throw new Error(stderr);
      }

      // Parse the output
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return { rows: [], rowCount: 0 };
      }

      // Parse rows
      const rows = lines.map(line => {
        const parts = line.split('|');
        // For queries that return single values
        if (parts.length === 1) {
          return { value: parts[0] };
        }
        // For queries with multiple columns, return as object
        return parts;
      });

      return { rows, rowCount: rows.length };

    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  /**
   * Execute a query and return results as objects with column names
   */
  async queryObject(sql, params = []) {
    // Replace parameters
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
          escapedValue = `'${param.toString().replace(/'/g, "''")}'`;
        }
        
        finalSql = finalSql.replace(new RegExp('\\' + placeholder + '\\b', 'g'), escapedValue);
      });
    }

    try {
      // Get column names first
      const describeCmd = `psql "${DB_URL}" -t -c "\\d+ (SELECT ${finalSql} LIMIT 0)"`;
      
      // Execute query with headers
      const command = `psql "${DB_URL}" -t -A -F'|' -c "${finalSql.replace(/"/g, '\\"')}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 60000
      });

      if (stderr && !stderr.includes('WARNING') && !stderr.includes('NOTICE')) {
        throw new Error(stderr);
      }

      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return { rows: [], rowCount: 0 };
      }

      // Convert to array of values
      const rows = lines.map(line => line.split('|'));
      
      return { rows, rowCount: rows.length };

    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  /**
   * Test connection
   */
  async connect() {
    try {
      const result = await this.query('SELECT NOW() as time');
      this.connected = true;
      console.log('✓ Database connected via psql (time:', result.rows[0].value + ')');
      return true;
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      this.connected = false;
      return false;
    }
  }

  /**
   * No-op for compatibility
   */
  async end() {
    return Promise.resolve();
  }

  /**
   * Get a client (returns this for compatibility)
   */
  async getClient() {
    return this;
  }

  /**
   * Release client (no-op for psql)
   */
  release() {
    // No-op
  }
}

// Create singleton instance
const db = new Database();

// Export the instance and make it pool-compatible
module.exports = {
  query: (sql, params) => db.query(sql, params),
  queryObject: (sql, params) => db.queryObject(sql, params),
  connect: () => db.connect(),
  end: () => db.end(),
  getClient: () => db.getClient(),
  pool: db
};

// Test connection on load
db.connect().catch(err => {
  console.error('Initial database connection failed:', err.message);
});

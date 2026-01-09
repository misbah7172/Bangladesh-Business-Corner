/**
 * Database Bridge using psql command-line tool
 * This is a workaround for network connectivity issues with Node.js pg library
 * Uses psql command-line which works when Node.js connections fail
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Execute SQL query using psql command-line tool
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Parameters for the query (will be escaped)
 * @returns {Promise<Object>} Query result
 */
async function query(sql, params = []) {
  try {
    // Escape parameters to prevent SQL injection
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
        } else {
          // Escape single quotes and wrap in quotes
          escapedValue = `'${param.toString().replace(/'/g, "''")}'`;
        }
        
        finalSql = finalSql.replace(placeholder, escapedValue);
      });
    }

    // Execute via psql with JSON output
    const command = `psql "${DATABASE_URL}" -t -A -c "${finalSql.replace(/"/g, '\\"')}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000 // 30 second timeout
    });

    if (stderr && stderr.trim() && !stderr.includes('WARNING')) {
      throw new Error(stderr);
    }

    // Parse the output
    const lines = stdout.trim().split('\n');
    if (lines.length === 0 || !lines[0]) {
      return { rows: [], rowCount: 0 };
    }

    // For simple queries, parse pipe-delimited output
    const firstLine = lines[0];
    if (firstLine.includes('|')) {
      const rows = lines.map(line => {
        const values = line.split('|');
        return values;
      });
      return { rows, rowCount: rows.length };
    }

    // For single column or value results
    const rows = lines.filter(l => l.trim()).map(line => ({ value: line.trim() }));
    return { rows, rowCount: rows.length };

  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

/**
 * Execute SQL query and get rows as objects
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Result with rows as objects
 */
async function queryRows(sql, params = []) {
  const command = `psql "${DATABASE_URL}" -t -c "${sql.replace(/"/g, '\\"')}" -F'|'`;
  
  try {
    const { stdout } = await execAsync(command, { 
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000 
    });
    
    const lines = stdout.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      return { rows: [], rowCount: 0 };
    }

    return { rows: lines, rowCount: lines.length };
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as time, current_database() as db');
    console.log('✓ Database connected via psql bridge');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  query,
  queryRows,
  testConnection,
  // Provide pool-like interface for compatibility
  pool: {
    query,
    end: () => Promise.resolve() // No-op for psql bridge
  }
};

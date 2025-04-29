const express = require('express');
const app = express();

// Load environment variables from .env file (primarily for local development)
require('dotenv').config();

// Import the Pool object from the pg library
const { Pool } = require('pg');

// Ensure the DATABASE_URL environment variable is set.
// IMPORTANT: This should now contain the Supabase POOLER connection string.
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  console.error("Please ensure it's set and contains the Supabase POOLER connection string.");
  process.exit(1); // Exit if the critical variable is missing
}

// Create a new PostgreSQL connection pool
console.log("Configuring database pool..."); // Add log for clarity
const pool = new Pool({
  // Use the connection string provided by the environment variable
  // This should be the POOLER URI (e.g., postgresql://user:pass@host:port/db)
  connectionString: process.env.DATABASE_URL,

  // Configure SSL settings for Supabase Pooler connection
  ssl: {
    // Allow connections even if the certificate chain cannot be fully verified.
    // This is often necessary for poolers/proxies that might use intermediate
    // or self-signed certificates not in the default Node.js trust store.
    rejectUnauthorized: false // !!! SECURITY NOTE: Disables certificate validation. Use with caution. !!!
  }
});

// Test the database connection on startup
console.log("Attempting initial database connection test...");
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    // Provide more context in the error message
    console.error('Error connecting to the database pool during startup test:', err.stack);
    // Optional: Consider exiting if the initial connection fails critically
    // process.exit(1);
  } else {
    console.log('Successfully connected to the database pool at:', res.rows[0].now);
  }
});

// --- REST OF THE APPLICATION CODE ---

// Use PORT from environment variables or default to 10000
const port = process.env.PORT || 10000;

// Respond to GET requests at the root URL '/'
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/asset', async (req, res) => {
    // 1. Check if the pool object exists (good practice)
    if (!pool) {
         console.error('Database pool is not initialized.'); // Added server log
         return res.status(503).json({ error: 'Database connection not available' });
    }

    // 2. The SQL query itself is standard and should work in PostgreSQL
    //    (assuming lowercase table/column names 'asset', 'id', 'city_asset', 'asset_id'
    //    as created in the previous step, which is standard PostgreSQL practice unless quoted).
    const queryText = 'SELECT * FROM asset INNER JOIN city_asset ON asset.id = city_asset.asset_id;';

    try {
        // 3. Execute the query using the pg pool's query method
        //    Change: pool.request().query(queryText) -> pool.query(queryText)
        const result = await pool.query(queryText);

        // 4. Access the results using result.rows instead of result.recordset
        //    Change: result.recordset -> result.rows
        console.log(`Successfully fetched ${result.rows.length} assets`);
        res.status(200).json(result.rows); // Send the rows back

    } catch (err) {
        // 5. Error handling remains similar
        console.error('Error executing PostgreSQL query:', err.stack);
        res.status(500).json({ error: 'Failed to retrieve assets', details: err.message });
    }
});

// Start server, bind to 0.0.0.0 for Render (or similar platforms)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running and listening on port ${port}`);
});
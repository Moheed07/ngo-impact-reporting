const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4   // 👈 FORCE IPv4 (THIS FIXES ENETUNREACH)
});

module.exports = pool;

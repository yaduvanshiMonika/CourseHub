require('dotenv').config(); // MUST BE THE FIRST LINE
const mysql = require('mysql2/promise');

console.log("Attempting to connect with user:", process.env.DB_USER); // Debug line

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

db.getConnection()
  .then(() => console.log('MariaDB Connected as ' + process.env.DB_USER + ' ✅'))
  .catch(err => {
    console.error('Connection Failed ❌');
    console.error('Error Code:', err.code);
    console.error('Check if DB_USER is actually:', process.env.DB_USER);
  });

module.exports = db;
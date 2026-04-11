// const jwt = require('jsonwebtoken');
// const db = require('../config/db'); 

// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // 1. Since db is already a promise pool, we just await it directly
//     // and use [rows] to get the user data.
//     const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
//     const user = rows[0];

//     if (!user) {
//       console.log("User not found in MariaDB:", email);
//       return res.status(401).json({ message: 'Invalid Credentials' });
//     }

//     // 2. Manual Password Check (Matching your MariaDB entry)
//     if (user.password !== password) {
//       console.log("Password mismatch for:", email);
//       return res.status(401).json({ message: 'Invalid Credentials' });
//     }

//     // 3. Include 'role' for Angular's RoleGuard
//     const token = jwt.sign(
//       { id: user.id, email: user.email, role: user.role }, 
//       process.env.JWT_SECRET, 
//       { expiresIn: '1h' }
//     );

//     // 4. Send the success response
//     res.json({ 
//       token, 
//       role: user.role,
//       name: user.name 
//     });

//   } catch (err) {
//     console.error("Detailed Login Error:", err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// exports.register = async (req, res) => {
//   res.status(200).json({ message: "Register logic goes here" });
// };



const jwt = require('jsonwebtoken');
const db = require('../config/db'); 

// ✅ LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?', 
      [email]
    );

    const user = rows[0];

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      role: user.role,
      name: user.name
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ REGISTER (OUTSIDE — VERY IMPORTANT)
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 🔥 Insert into users table
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, 'student'] // default role
    );

    res.status(201).json({ message: "User registered successfully ✅" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    // 🔥 handle duplicate email
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Email already exists ❌" });
    }

    res.status(500).json({ message: "Registration failed ❌" });
  }
};
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// const app = express();

// // ✅ 1. CORS MUST BE FIRST
// app.use(cors({
//   origin: 'http://localhost:4200',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// // ✅ 2. JSON PARSER
// app.use(express.json());

// // ✅ 3. IMPORT ROUTES
// const authRoutes = require('./routes/authRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const teacherRoutes = require('./routes/teacherRoutes');
// const courseRoutes = require('./routes/courseRoutes');
// const enrollmentRoutes = require('./routes/enrollmentRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');

// // ✅ DEBUG
// console.log("enrollmentRoutes:", typeof enrollmentRoutes);
// console.log("paymentRoutes:", typeof paymentRoutes);

// // ✅ 4. USE ROUTES
// app.use('/api/enroll', enrollmentRoutes);
// app.use('/api/payment', paymentRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api', courseRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/teacher', teacherRoutes);

// // ✅ STATIC FILES
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // ✅ DEBUG LOGGER
// app.use((req, res, next) => {
//   console.log("HIT:", req.method, req.url);
//   next();
// });

// // ✅ ROOT
// app.get('/', (req, res) => {
//   res.send('API Running 🚀');
// });

// // ✅ START SERVER
// app.listen(5000, () => {
//   console.log('Server running on port 5000');
// });



const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ 1. CORS FIRST
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ 2. JSON PARSER (Required for req.body)
app.use(express.json());

// ✅ 3. GLOBAL LOGGER (Move this UP to see every request before it hits routes)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ 4. IMPORT ROUTES
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// ✅ 5. USE ROUTES
app.use('/api/enroll', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API Running 🚀');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});



const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ CORS
app.use(cors({
  origin: [ 'http://localhost:4200',
           'https://dazzling-reverence-production.up.railway.app'
           ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// ✅ JSON parser
app.use(express.json());

// ✅ Global logger

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});


const authRoutes       = require('./routes/authRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const teacherRoutes    = require('./routes/teacherRoutes');
const courseRoutes     = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const paymentRoutes    = require('./routes/paymentRoutes');
const contactRoutes    = require('./routes/contactRoutes');
const webinarRoutes    = require('./routes/webinarRoutes');
const studentRoutes = require('./routes/studentRoutes');

app.use('/api/enroll',   enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api',          courseRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/teacher',  teacherRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/webinar',  webinarRoutes);
app.use('/api/student', studentRoutes);



// ✅ Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Root route
app.get('/', (req, res) => {
  res.send('API Running 🚀');
});

// app.listen(5000, () => {
//   console.log('Server running on port 5000');
// });

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



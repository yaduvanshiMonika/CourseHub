// const multer = require('multer');
// const path = require('path');

// // storage config
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const name = file.originalname.replace(ext, '').replace(/\s+/g, '-');
//     cb(null, Date.now() + '-' + name + ext);
//   }
// });

// // only PDF allow
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/pdf') {
//     cb(null, true);
//   } else {
//     cb(new Error('Only PDF files allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter
// });

// module.exports = upload;


const multer = require('multer');

// 👉 memory storage (IMPORTANT)
const storage = multer.memoryStorage();

// only PDF allow
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB (optional but recommended)
});

module.exports = upload;
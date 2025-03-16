const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vision',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
  }
});

module.exports = multer({ storage: storage });


// const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');
// const path = require('path');

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/images/uploads')
//     },
//     filename: function (req, file, cb) {
//       const unique = uuidv4();
//       cb(null, unique + path.extname(file.originalname));
//     }
//   })
  
//   const upload = multer({ 
//     storage: storage,
//     fileFilter: function(req, file, cb) {
//       if (file.mimetype.startsWith('image/')) {
//         cb(null, true);
//       } else {
//         cb(new Error('Not an image! Please upload an image.'), false);
//       }
//     }
//    });
  
//   module.exports = upload;
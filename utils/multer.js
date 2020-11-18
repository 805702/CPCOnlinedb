const multer = require("multer");
const uuidV4 = require('uuid').v4();
const path = require("path");
// Multer config
module.exports = multer({
  // storage: multer.diskStorage({}),
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads");
    },
    filename: (req, file, cb) => {
      console.error(file)
      let nameFile = file.originalname.split(' ')
      nameFile = nameFile.join('_')
      nameFile = nameFile.split('.')
      nameFile.pop()
      nameFile = nameFile.join('_')
      cb(null, uuidV4+'_'+nameFile+'.'+file.mimetype.split('/')[1]);
    }
  }),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext.toLowerCase() !== ".jpg" && ext.toLowerCase() !== ".jpeg" && ext.toLowerCase() !== ".png" && ext.toLowerCase() !== ".pdf") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

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
      let nameFile = uuidV4
      cb(null, nameFile+'.'+file.mimetype.split('/')[1]);
    }
  }),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".pdf") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

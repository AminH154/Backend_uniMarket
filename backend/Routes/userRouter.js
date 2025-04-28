const {login, register, profileUpdate,getAllUsersAndUserById} = require("../controllers/useControllers");
const router = require("express").Router();
const { verifierToken } = require("../authMiddleware/authMidleWare");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"), false);
    }
  },
});

router.post("/", login);

router.post("/register", register);

router.post( "/profile-update",verifierToken,upload.single("avatar"),profileUpdate);

router.get("/Home", getAllUsersAndUserById);


module.exports = router;

const { login, register, profileUpdate } = require("../controllers/useControllers");
const router = require("express").Router();
const { verifierToken } = require("../authMiddleware/authMidleWare");
const multer = require("multer");

// Configuration de multer pour l'upload
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
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Route pour la connexion
router.post("/", login);

// Route pour l'inscription
router.post("/register", register);

// Route pour la mise à jour du profil avec authentification et upload
router.post("/profile-update", verifierToken, upload.single("avatar"), profileUpdate);

module.exports = router;

const { login, register, profileUpdate, getUser } = require("../controllers/useControllers");
const router = require("express").Router();
const { verifierToken } = require("../authMiddleware/authMidleWare");
const multer = require("multer");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Dossier où les fichiers seront enregistrés
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Nom unique pour chaque fichier
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de taille : 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true); // Accepter uniquement les fichiers image
    } else {
      cb(new Error("Seuls les fichiers image sont autorisés"), false);
    }
  },
});


router.post("/", login);

router.post("/register", register);

router.get("/Home", verifierToken, getUser);

router.post("/profile-update", verifierToken, upload.single("avatar"), profileUpdate);

module.exports = router; 
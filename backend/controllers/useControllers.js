const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { userSchema, User, profileUpdateSchema } = require("../modules/modules");
const fs = require('fs');
const path = require('path');
const multer = require("multer");



module.exports.login = async (req, res) => {
  console.log("Route /login appelée");
  console.log("Données reçues dans req.body :", req.body);
  try {
    // Valider les données avec Zod
    const validatedData = userSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await User.findOne({ email });
    if (!user) {
      console.log("Utilisateur non trouvé :", email);
      return res
        .status(400)
        .json({ msg: "Email ou mot de passe incorrect", status: false });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Mot de passe invalide pour l'utilisateur :", email);
      return res
        .status(400)
        .json({ msg: "Email ou mot de passe incorrect", status: false });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    console.log("Connexion réussie pour l'utilisateur :", userWithoutPassword);

    return res.status(200).json({ 
      status: true, 
      user: userWithoutPassword,
      token: token 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Retourner les erreurs de validation
      return res.status(400).json({
        msg: error.errors.map((err) => err.message).join(", "),
        status: false,
      });
    }
    console.error("Erreur lors de la connexion :", error.message);
    return res
      .status(500)
      .json({ msg: "Erreur interne du serveur", status: false });
  }
};
// Contrôleur pour l'inscription
module.exports.register = async (req, res) => {
  console.log("Données reçues dans req.body :", req.body); // Vérifie les données reçues
  try {
    // Valider les données avec Zod
    const validatedData = userSchema.parse(req.body);
    const { userName, email, password } = validatedData;

    // Vérifiez si l'email est déjà utilisé
    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      return res
        .status(400)
        .json({ msg: "Cet email est déjà utilisé", status: false });
    }

    // Hachez le mot de passe avant de le sauvegarder
    const hashPassword = await bcrypt.hash(password, 10);

    // Créez un nouvel utilisateur
    const newUser = await User.create({
      userName,
      email,
      password: hashPassword,
    });

    // Supprimez le mot de passe de la réponse
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    console.log("Utilisateur créé avec succès :", userWithoutPassword);

    return res.status(201).json({ status: true, user: userWithoutPassword });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Retourner les erreurs de validation
      return res.status(400).json({
        msg: error.errors.map((err) => err.message).join(", "),
        status: false,
      });
    }
    console.error("Erreur lors de l'inscription :", error.message);
    return res
      .status(500)
      .json({ msg: "Erreur interne du serveur", status: false });
  }
};

// Configuration de multer pour stocker les fichiers localement
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Dossier où les fichiers seront stockés
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Nom unique pour chaque fichier
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

module.exports.profileUpdate = async (req, res) => {
  try {
    console.log("=== Début de la mise à jour du profil ===");
    console.log("Données reçues dans req.body :", req.body);
    console.log("userId reçu :", req.userId);

    // Vérifier si l'utilisateur est authentifié
    if (!req.userId) {
      return res.status(401).json({ 
        msg: "Non autorisé - Token manquant ou invalide", 
        status: false 
      });
    }

    // Valider les données reçues avec Zod
    const validatedData = profileUpdateSchema.parse(req.body);
    console.log("Données validées :", validatedData);
    const { userName, bio } = validatedData;

    // Rechercher l'utilisateur dans la base de données
    const user = await User.findById(req.userId);
    if (!user) {
      console.log("Utilisateur non trouvé avec l'ID :", req.userId);
      return res.status(404).json({ 
        msg: "Utilisateur non trouvé", 
        status: false 
      });
    }

    console.log("Ancien userName :", user.userName);

    // Mettre à jour les champs
    if (userName !== undefined) user.userName = userName;
    if (bio !== undefined) user.bio = bio;
    

    
    // Gestion de l'avatar
    if (req.file) {
      const newAvatarPath = "uploads/" + req.file.filename;

      // Supprimer l'ancienne image si elle existe
      if (user.avatar) {
        const oldImagePath = path.join(__dirname, "..", user.avatar);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log("Ancienne image supprimée :", oldImagePath);
          } catch (error) {
            console.error("Erreur lors de la suppression de l'ancienne image :", error.message);
          }
        }
      }

      // Mettre à jour le chemin de l'avatar
      user.avatar = newAvatarPath;
    }
    
    

    // Sauvegarder les modifications
    const updatedUser = await user.save();
    console.log("Utilisateur après sauvegarde :", {
      userName: user.userName,
      bio: user.bio,
      avatar: user.avatar
    });

    // Retourner l'utilisateur mis à jour (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user.toObject();
 
    return res.status(200).json({ 
      msg: "Profil mis à jour avec succès", 
      status: true, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error.message);
    return res.status(500).json({ 
      msg: "Erreur interne du serveur", 
      status: false 
    });
  }
};

module.exports.getAllUsersAndUserById = async (req, res) => {
  try {
    const {userId} = req.query;
    if(userId){
      const user = await User.findById(userId);
      if(!user){
        return res.status(404).json({
          msg: "Utilisateur non trouvé",
          status: false,
        });
      }
      return res.status(200).json(user);
    }

    const users = await User.find();
    const usersMapped = users.map(user => ({
      id: user._id,
      userName: user.userName,
      avatar: user.avatar,
      bio: user.bio,
    }));
    res.status(200).json(usersMapped);
  } catch (error) {
    res.status(500).json({
      msg: "Erreur interne du serveur",
      status: false,
    });
  }
};



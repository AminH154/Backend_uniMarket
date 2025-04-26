const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { userSchema, User, profileUpdateSchema } = require("../modules/modules");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { networkInterfaces } = require("os");

// Contrôleur de connexion
module.exports.login = async (req, res) => {
  try {
    // Valider les données avec Zod
    const validatedData = userSchema.parse(req.body);
    const { email, password } = validatedData;

    // Rechercher l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        msg: "Email ou mot de passe incorrect",
        status: false,
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        msg: "Email ou mot de passe incorrect",
        status: false,
      });
    }

    // Générer le token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    // Retourner l'utilisateur et le token
    const { password: _, ...userWithoutPassword } = user.toObject();
    return res.status(200).json({
      status: true,
      user: userWithoutPassword,
      token: token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        msg: error.errors.map((err) => err.message).join(", "),
        status: false,
      });
    }
    return res.status(500).json({
      msg: "Erreur interne du serveur",
      status: false,
    });
  }
};
module.exports.register = async (req, res) => {
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
module.exports.profileUpdate = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.userId) {
      return res.status(401).json({
        msg: "Non autorisé - Token manquant ou invalide",
        status: false,
      });
    }

    // Rechercher l'utilisateur dans la base de données
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        msg: "Utilisateur non trouvé",
        status: false,
      });
    }

    // Gérer la mise à jour de l'avatar
    if (req.file) {
      const newAvatarPath = `uploads/${req.file.filename}`;
      console.log("Fichier téléchargé :", newAvatarPath);

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

    // Mettre à jour les autres champs (par exemple, bio ou userName)
    const { userName, bio } = req.body;
    if (userName) user.userName = userName;
    if (bio) user.bio = bio;

    // Sauvegarder les modifications
    await user.save();
    console.log("Utilisateur mis à jour :", user);

    // Générer l'URL publique du fichier téléchargé
    const fileUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : user.avatar;

    // Retourner une réponse avec l'URL du fichier et les informations utilisateur
    return res.status(200).json({
      msg: "Profil mis à jour avec succès",
      fileUrl,
      user: {
        userName: user.userName,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    return res.status(500).json({
      msg: "Erreur interne du serveur",
      status: false,
    });
  }
};
// Contrôleur pour obtenir les informations de l'utilisateur
module.exports.getUser = async (req, res) => {
  try {
    console.log("userId reçu dans getUser :", req.userId);

    if (!req.userId) {
      return res.status(401).json({
        msg: "Non autorisé - Token manquant ou invalide",
        status: false,
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        msg: "Utilisateur non trouvé",
        status: false,
      });
    }
    console.log("Utilisateur trouvé :", user);
    return res.status(200).json({
      status: true,
      user: {
        bio: user.bio,
        avatar: user.avatar,
        username: user.userName,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Erreur dans getUser :", error);
    return res.status(500).json({
      msg: "Erreur interne du serveur",
      status: false,
    });
  }
};

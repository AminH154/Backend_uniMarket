const mongoose = require("mongoose");
const { z } = require("zod");

// Schéma Zod pour la validation
const userSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z
    .string()
    .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  userName: z.string().optional(), // Facultatif pour la connexion
});

const profileUpdateSchema = z.object({
  userName: z.string().optional(),
  bio: z.string().optional(),
  // Ajoute d'autres champs si besoin
});

// Schéma Mongoose pour la base de données
const userMongoSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "", requared: false },
  bio: { type: String, required: false },
});

// Modèle Mongoose
const User = mongoose.model("User", userMongoSchema);

console.log("JWT_SECRET:", process.env.JWT_SECRET);

module.exports = { userSchema, User ,  profileUpdateSchema };

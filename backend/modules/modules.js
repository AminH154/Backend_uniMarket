const mongoose = require("mongoose");
const { z } = require("zod");

const userSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  userName: z.string().optional(), // Facultatif pour la connexion
});

const profileUpdateSchema = z.object({
  userName: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),

});

const userMongoSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default:"uploads/utilisateur.png" , requared: false },
  bio: { type: String, required: false },
});

const User = mongoose.model("User", userMongoSchema);

console.log("JWT_SECRET:",process.env.JWT_SECRET);

module.exports = { userSchema, User ,  profileUpdateSchema };

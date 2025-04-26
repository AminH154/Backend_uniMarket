const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/../.env' });

const verifierToken = (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Token non fourni", status: false });
    }

    // Le format est généralement "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "Format de token invalide", status: false });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter l'ID de l'utilisateur à la requête
    req.userId = decoded.userId;
    
    // Passer au middleware suivant
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return res.status(401).json({ 
      message: "Token invalide ou expiré", 
      status: false 
    });
  }
};

module.exports = { verifierToken };

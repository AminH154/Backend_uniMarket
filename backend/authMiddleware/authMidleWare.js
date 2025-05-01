const jwt = require('jsonwebtoken');



const verifierToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token non fourni", status: false });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Format de token invalide", status: false });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.userId;
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
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRouter = require("./Routes/userRouter");
const cors = require("cors");
require("dotenv").config({ path: __dirname + "/.env" });
app.use(express.json());  // Augmentez la limite pour les requêtes JSON
app.use(express.urlencoded({ limit: "10mb", extended: true })); // Augmentez la limite pour les requêtes URL-encodées


// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true,
}));
// Ce middleware doit être défini avant les routes

// Routes
app.use("/api/auth", userRouter);

app.get("/", (req, res) => {
  res.send("Hello, server is running!");
});

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to DB");
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Connection failed:", error.message);
  });
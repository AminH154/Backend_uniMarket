require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRouter = require("./Routes/userRouter");
const cors = require("cors");
const path = require("path");

// Load environment variables
console.log("JWT_SECRET from index.js:", process.env.JWT_SECRET);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", userRouter);

app.get("/", (req, res) => {
  res.send("Hello, server is running!");
});

app.use(
  "/uploads",
  (req, res, next) => {
    console.log(`Static file requested: ${req.path}`);
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to DB");
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Connection failed:", error.message);
  });
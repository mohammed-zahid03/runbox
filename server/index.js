const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Snippet = require("./models/Snippet"); // Import the new Model

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- ROUTES ---

// 1. Test Route
app.get("/", (req, res) => {
  res.send("Runbox API is running!");
});

// 2. SAVE Code Route (The New Feature)
app.post("/api/save", async (req, res) => {
  try {
    const { userId, code, language } = req.body;

    // Create a new snippet in the database
    const newSnippet = new Snippet({
      userId,
      code,
      language,
      title: "Interview Practice"
    });

    await newSnippet.save();
    res.status(201).json({ message: "Code saved successfully!", snippet: newSnippet });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save code" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
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

// 3. GET All Snippets for a User
app.get("/api/snippets/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Find snippets for this user & sort by newest first (-1)
    const snippets = await Snippet.find({ userId }).sort({ createdAt: -1 });
    res.json(snippets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

// 4. GET Single Snippet by ID
app.get("/api/snippet/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json(snippet);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
});

// 5. DELETE Snippet
app.delete("/api/snippets/:id", async (req, res) => {
  try {
    await Snippet.findByIdAndDelete(req.params.id);
    res.json({ message: "Snippet deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete snippet" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
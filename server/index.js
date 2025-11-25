const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Snippet = require("./models/Snippet");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // 1. Import AI

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

// 2. AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ROUTES ---

// Test Route
app.get("/", (req, res) => {
  res.send("Runbox API is running!");
});

// SAVE Code Route
app.post("/api/save", async (req, res) => {
  try {
    const { userId, code, language } = req.body;
    const newSnippet = new Snippet({ userId, code, language, title: "Interview Practice" });
    await newSnippet.save();
    res.status(201).json({ message: "Code saved!", snippet: newSnippet });
  } catch (error) {
    res.status(500).json({ error: "Failed to save code" });
  }
});

// GET All Snippets
app.get("/api/snippets/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snippets = await Snippet.find({ userId }).sort({ createdAt: -1 });
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

// GET Single Snippet
app.get("/api/snippet/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json(snippet);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
});

// DELETE Snippet
app.delete("/api/snippets/:id", async (req, res) => {
  try {
    await Snippet.findByIdAndDelete(req.params.id);
    res.json({ message: "Snippet deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// 6. AI HINT Route
app.post("/api/ai/hint", async (req, res) => {
  console.log("🤖 AI Hint Request Received!");
  
  try {
    const { code } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
      You are an expert coding interviewer. 
      Here is the user's code:
      "${code}"

      Please provide a helpful, concise hint to help them improve or fix their code. 
      DO NOT write the full solution code. Just give a conceptual hint or point out a logic error.
      Keep it under 3 sentences.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hint = response.text();
    
    // --- THE SPY ---
    console.log("🧠 GEMINI SAYS:", hint); 
    // ----------------

    res.json({ hint });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
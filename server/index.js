const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Snippet = require("./models/Snippet");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const http = require("http"); // 1. Import HTTP
const { Server } = require("socket.io"); // 2. Import Socket.io

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 3. Create the Real-Time Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow Frontend to connect
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- SOCKET.IO REAL-TIME LOGIC ---
io.on("connection", (socket) => {
  console.log("🔌 User Connected:", socket.id);

  // User Joins a Room (e.g., room "123")
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // User Types Code -> Send it to others in the room
  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", code);
  });

  // User Disconnects
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

// --- API ROUTES ---

app.get("/", (req, res) => res.send("Runbox API is running!"));

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

app.get("/api/snippets/:userId", async (req, res) => {
  try {
    const snippets = await Snippet.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

app.get("/api/snippet/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json(snippet);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
});

app.delete("/api/snippets/:id", async (req, res) => {
  try {
    await Snippet.findByIdAndDelete(req.params.id);
    res.json({ message: "Snippet deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

app.post("/api/ai/hint", async (req, res) => {
  try {
    const { code } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `You are a coding interviewer. Hint for: "${code}". Short, no solution.`;
    const result = await model.generateContent(prompt);
    res.json({ hint: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

// 4. Start the SERVER (Not app.listen)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
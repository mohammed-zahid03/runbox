// server/index.js (REPLACE your file with this)
require('dotenv').config();

const clerkAuth = require('./middleware/clerkAuth');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Snippet = require('./models/Snippet');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic sanity checks for required secrets (fail fast in non-local envs)
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  Warning: GEMINI_API_KEY not set. AI endpoints will not work until set.');
}

// ----- HTTP SERVER & SOCKET.IO -----
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ----- Middleware: security + parsing + logging -----
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));

// Limit request body size (protect against huge payloads)
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// Sanitize incoming data to prevent NoSQL injection
app.use(mongoSanitize());

// Request logging with request-id
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});
// morgan combined with request id — simple JSON-like log lines
app.use(morgan(':method :url :status :res[content-length] - :response-time ms - reqId=:req[id]'));

// ----- Rate limiters -----
// Global gentle limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // max requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stronger limiter for AI / execution endpoints (protect your paid API usage)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max AI calls per IP per minute — tune according to plan
  message: { error: 'Too many AI requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ----- DB Connection -----
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// ----- AI Client (guarded) -----
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } else {
    genAI = null; // we'll check in endpoints
  }
} catch (err) {
  console.error('❌ Failed to initialize GoogleGenerativeAI:', err);
  genAI = null;
}

// ----- Helper: safeTextExtract (guard against undefined) -----
function extractTextFromModelResponse(result) {
  try {
    const response = result.response;
    if (!response) return '';
    if (typeof response.text === 'function') return response.text();
    // fallback: attempt to stringify
    return String(response);
  } catch (e) {
    return '';
  }
}

// ----- SOCKET.IO Real-time -----
// Keep socket handling minimal and safe — trust server to broadcast, not client-sent lists of sockets
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('code-change', ({ roomId, code }) => {
    if (!roomId) return;
    // broadcast to others
    socket.to(roomId).emit('code-update', { code, sender: socket.id });
  });

  socket.on('signal-warning', (roomId) => {
    if (!roomId) return;
    console.log(`⚠️ Warning in room ${roomId} from ${socket.id}`);
    // broadcast to everyone in room (including sender) so UI shows the warning
    io.to(roomId).emit('receive-warning', { message: 'Candidate switched tabs', from: socket.id });
  });

  // Single consistent handler for chat:
  socket.on('send-message', ({ roomId, message, sender }) => {
    if (!roomId || !message) return;
    // Broadcast message to everyone in the room (including sender)
    io.to(roomId).emit('receive-message', { message, sender, id: socket.id, ts: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ----- Routes -----
// Root
app.get('/', (req, res) => res.send('Runbox API is running!'));

// Centralized async wrapper to catch errors in routes
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Save snippet (basic validation + body size limit)
// Secure Save snippet — replaces your existing /api/save route
app.post(
  '/api/save',
  clerkAuth,
  wrap(async (req, res) => {
    const userId = req.userId; // FROM Clerk middleware
    const { code, language } = req.body || {};

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing required fields: code, language' });
    }

    if (typeof code === 'string' && code.length > 20000) {
      return res.status(413).json({ error: 'Code payload too large' });
    }

    const newSnippet = new Snippet({
      userId,
      code,
      language,
      title: 'Interview Practice',
    });

    await newSnippet.save();
    return res.status(201).json({ message: 'Code saved!', snippet: newSnippet });
  })
);


// Fetch snippets (paginated)
// Get current user's snippets (paginated) — new /api/snippets (auth required)
app.get(
  '/api/snippets',
  clerkAuth,
  wrap(async (req, res) => {
    const userId = req.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const snippets = await Snippet.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ data: snippets, page, limit });
  })
);


// Single snippet
// Get a single snippet — authenticated + ownership check
app.get(
  '/api/snippet/:id',
  clerkAuth,
  wrap(async (req, res) => {
    const userId = req.userId;
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
    if (snippet.userId !== userId) return res.status(403).json({ error: 'Access denied' });
    res.json(snippet);
  })
);

// Delete snippet
// Delete snippet — authenticated + ownership check
app.delete(
  '/api/snippets/:id',
  clerkAuth,
  wrap(async (req, res) => {
    const userId = req.userId;
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
    if (snippet.userId !== userId) return res.status(403).json({ error: 'Not allowed to delete this snippet' });

    await snippet.deleteOne();
    res.json({ message: 'Snippet deleted' });
  })
);


// ----- AI endpoints (rate-limited) -----
// Use aiLimiter to protect your paid AI usage
app.post(
  '/api/ai/hint',
  clerkAuth,
  aiLimiter,
  wrap(async (req, res) => {
    if (!genAI) return res.status(503).json({ error: 'AI not configured' });

    const { code } = req.body || {};
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Missing code' });
    if (code.length > 20000) return res.status(413).json({ error: 'Code too large' });

    // Choose model
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
You are an expert coding interviewer.
Here is the user's code:
"""${code}"""
Provide a short conceptual hint (max 3 sentences). Do not provide full solution code.
    `;

    // generateContent returns an object that may be streamable in some SDKs — keep it simple
    const result = await model.generateContent(prompt);
    const hint = extractTextFromModelResponse(result) || 'No hint generated';
    // Return minimal structured response
    return res.json({ hint });
  })
);

app.post(
  '/api/ai/generate',
  clerkAuth,
  aiLimiter,
  wrap(async (req, res) => {
    if (!genAI) return res.status(503).json({ error: 'AI not configured' });

    const { role, topic, experience, description } = req.body || {};
    // Basic validation
    if (!role || !topic) return res.status(400).json({ error: 'Missing role or topic' });

    let prompt = `
You are an expert technical interviewer.
Generate a single well-formed interview question for:
Role: ${role}
Topic: ${topic}
Experience: ${experience || 'N/A'} years.
    `;

    if (description) {
      prompt += `\nJob Description: """${description}"""\nTailor the question to this JD.\n`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(prompt);
    const question = extractTextFromModelResponse(result) || 'No question generated';
    return res.json({ question });
  })
);

app.post(
  '/api/ai/feedback',
  clerkAuth,
  aiLimiter,
  wrap(async (req, res) => {
    if (!genAI) return res.status(503).json({ error: 'AI not configured' });

    const { question, answer } = req.body || {};
    if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });

    const prompt = `
You are an expert interviewer

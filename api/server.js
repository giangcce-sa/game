import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = 3001;

const GATEWAY_URL = "https://somail.us/v1/chat";
const MODEL = "auto";

// Limits
const MAX_FIELD_LEN     = 2000;    // any single text field (writing, prompt, content)
const MAX_MESSAGES      = 40;       // chat history cap
const MAX_VOCAB         = 50;
const MAX_ANSWERS       = 20;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Trust Caddy/Cloudflare reverse proxy so rate-limit reads correct client IP
app.set("trust proxy", 1);

app.use(
  cors({
    origin: ["https://game.somail.us", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "32kb" }));

// Per-IP rate limit on AI endpoints (expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20,           // 20 AI calls / min / IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Bạn dùng AI quá nhanh. Đợi chút rồi thử lại nhé." },
});

// Tighter limit for story generation (heavier)
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Tạo truyện cần nhiều thời gian, hãy đợi 1 phút." },
});

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isString(x) { return typeof x === "string"; }

function clampStr(s, max = MAX_FIELD_LEN) {
  if (!isString(s)) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES) return null;
  const cleaned = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") return null;
    if (m.role !== "user" && m.role !== "assistant") return null;
    if (!isString(m.content)) return null;
    cleaned.push({ role: m.role, content: clampStr(m.content) });
  }
  return cleaned;
}

function sendError(res, status, code) {
  // Generic message — never leak gateway internals to client
  const messages = {
    bad_request:   "Yêu cầu không hợp lệ.",
    rate_limited:  "Bạn dùng quá nhanh. Hãy đợi rồi thử lại.",
    server_error:  "Có lỗi xảy ra. Hãy thử lại sau.",
    unavailable:   "Dịch vụ AI đang bận. Hãy thử lại.",
  };
  res.status(status).json({ error: messages[code] || messages.server_error });
}

// ---------------------------------------------------------------------------
// Helper: get API key or return 500
// ---------------------------------------------------------------------------

function getApiKey(res) {
  const key = process.env.GATEWAY_API_KEY;
  if (!key) {
    res.status(500).json({ error: "GATEWAY_API_KEY environment variable is not set." });
    return null;
  }
  return key;
}

// ---------------------------------------------------------------------------
// Helper: call gateway, return text (non-streaming)
// ---------------------------------------------------------------------------

async function callGateway(apiKey, messages, maxTokens = 1024) {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Gateway ${response.status}: ${err}`);
  }

  const data = await response.json();

  // Support both OpenAI format and custom format
  const text =
    data?.choices?.[0]?.message?.content ??
    data?.content ??
    data?.text ??
    data?.response ??
    "";

  if (!text) throw new Error("Empty response from gateway");
  return text;
}

// ---------------------------------------------------------------------------
// Helper: send response as SSE (non-streaming gateway → fake SSE for client)
// ---------------------------------------------------------------------------

async function sseGateway(apiKey, messages, res, maxTokens = 300) {
  // Set SSE headers first so client starts reading
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Call gateway without streaming
  const text = await callGateway(apiKey, messages, maxTokens);

  // Send full text as a single SSE event then done
  res.write(`data: ${JSON.stringify({ text })}\n\n`);
  res.write("data: [DONE]\n\n");
}

// ---------------------------------------------------------------------------
// Helper: extract JSON from model response (strip markdown fences if any)
// ---------------------------------------------------------------------------

function extractJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : raw.trim();
  return JSON.parse(jsonText);
}

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, gateway: GATEWAY_URL, model: MODEL });
});

// ---------------------------------------------------------------------------
// POST /api/chat — AI Conversation Partner (SSE streaming)
// ---------------------------------------------------------------------------

app.post("/api/chat", aiLimiter, async (req, res) => {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const body = req.body || {};
  const cleanedMessages = validateMessages(body.messages);
  if (!cleanedMessages) return sendError(res, 400, "bad_request");

  const systemPrompt = clampStr(
    body.systemPrompt || "You are a friendly English tutor owl named Cú for Vietnamese children aged 6-12. Reply in 1-2 SHORT sentences only. Be warm and fun. Gently correct mistakes. Always end with one simple question.",
    2000
  );
  const level = ["A1", "A2", "B1", "B2"].includes(body.level) ? body.level : "A1";

  const gatewayMessages = [
    { role: "system", content: systemPrompt },
    ...cleanedMessages,
  ];

  const tokensByLevel = { A1: 120, A2: 180, B1: 250, B2: 320 };
  const maxTok = tokensByLevel[level];

  try {
    await sseGateway(apiKey, gatewayMessages, res, maxTok);
  } catch (err) {
    console.error("/api/chat error:", err.message);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "AI tạm thời không khả dụng." })}\n\n`);
      res.end();
    } else {
      sendError(res, 502, "unavailable");
    }
  }
});

// ---------------------------------------------------------------------------
// POST /api/grammar — Detect grammar mistakes in a child's English sentence
// Returns: { corrections: [{ original, corrected, explanation_vi }] }
// ---------------------------------------------------------------------------

app.post("/api/grammar", aiLimiter, async (req, res) => {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const body = req.body || {};
  const text = clampStr(body.text, 500);
  if (!text.trim() || text.trim().length < 3) {
    return res.json({ corrections: [] });
  }

  const messages = [
    {
      role: "system",
      content: `You are a kind English grammar coach for Vietnamese children aged 6-12.
Analyze the student's English sentence and identify ONLY clear grammar or spelling mistakes.
Be lenient — ignore casual capitalization, informal contractions, or stylistic choices.
Respond ONLY with valid JSON in this exact shape:
{
  "corrections": [
    {
      "original": "the wrong fragment (max 6 words, must appear in student's text verbatim)",
      "corrected": "the correct version",
      "explanation_vi": "Short Vietnamese explanation (max 18 words) for a child"
    }
  ]
}
Rules:
- Maximum 3 corrections per response.
- If no real mistakes, return {"corrections":[]}.
- "original" MUST be a substring of the student's text.
- Explanations in Vietnamese, friendly, simple words.`
    },
    {
      role: "user",
      content: `Student's English: "${text}"\n\nAnalyze for grammar/spelling mistakes.`
    }
  ];

  try {
    const raw = await callGateway(apiKey, messages, 400);
    const parsed = extractJson(raw);
    const corrections = Array.isArray(parsed?.corrections)
      ? parsed.corrections
          .filter(c => c && typeof c.original === 'string' && typeof c.corrected === 'string')
          .slice(0, 3)
      : [];
    res.json({ corrections });
  } catch (err) {
    console.error("/api/grammar error:", err.message);
    // Fail silently — grammar feedback is non-essential
    res.json({ corrections: [] });
  }
});

// ---------------------------------------------------------------------------
// POST /api/story — Generate interactive story (non-streaming, JSON)
// ---------------------------------------------------------------------------

app.post("/api/story", heavyLimiter, async (req, res) => {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const body = req.body || {};
  const topic = clampStr(body.topic || "animals", 100);
  const gradeLevel = clampStr(body.gradeLevel || "grade1-2", 30);
  const rawVocab = Array.isArray(body.vocab) ? body.vocab.slice(0, MAX_VOCAB) : [];
  const vocab = rawVocab.filter(isString).map(v => clampStr(v, 50));

  const vocabList = vocab.length > 0
    ? vocab.join(", ")
    : "happy, run, big, small, friend";

  const messages = [
    {
      role: "system",
      content: `You are a creative English teacher writing short interactive stories for Vietnamese children learning English.
Create exactly 3 paragraphs. Each paragraph must end with a comprehension question with 3 multiple-choice options (A, B, C).
The correct answer is indicated by its 0-based index (0=A, 1=B, 2=C).
Use simple vocabulary appropriate for ${gradeLevel}. Naturally weave in the provided vocabulary words.
Respond ONLY with valid JSON matching this exact structure:
{
  "title": "string",
  "paragraphs": [
    {
      "text": "paragraph text here",
      "question": {
        "q": "question text?",
        "options": ["option A", "option B", "option C"],
        "answer": 0
      }
    }
  ]
}`,
    },
    {
      role: "user",
      content: `Write a 3-paragraph English story about "${topic}" for ${gradeLevel} children.
Vocabulary words to include naturally: ${vocabList}.
Each paragraph needs a comprehension question with 3 choices and one correct answer.`,
    },
  ];

  try {
    const raw = await callGateway(apiKey, messages, 2048);
    const story = extractJson(raw);
    res.json(story);
  } catch (err) {
    console.error("/api/story error:", err.message);
    sendError(res, 502, "unavailable");
  }
});

// ---------------------------------------------------------------------------
// POST /api/grade-writing — Grade a child's writing (non-streaming, JSON)
// ---------------------------------------------------------------------------

app.post("/api/grade-writing", aiLimiter, async (req, res) => {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const body = req.body || {};
  const prompt  = clampStr(body.prompt, 500);
  const writing = clampStr(body.writing, MAX_FIELD_LEN);
  const level   = clampStr(body.level || "beginner", 30);

  if (!writing.trim()) return sendError(res, 400, "bad_request");

  const messages = [
    {
      role: "system",
      content: `You are a kind and encouraging English teacher grading writing from Vietnamese children learning English.
Your feedback must be constructive, age-appropriate, and motivating.
Respond ONLY with valid JSON matching this exact structure:
{
  "score": <integer 1-5>,
  "feedback": "overall feedback string",
  "corrections": [
    {
      "original": "the mistake phrase",
      "corrected": "the corrected phrase",
      "explanation": "simple explanation for a child"
    }
  ],
  "encouragement": "warm encouraging message string"
}
If there are no corrections needed, return an empty array for corrections.`,
    },
    {
      role: "user",
      content: `Writing prompt given to the student: "${prompt}"\nStudent level: ${level}\nStudent's writing:\n"${writing}"\n\nPlease grade this writing and provide feedback.`,
    },
  ];

  try {
    const raw = await callGateway(apiKey, messages, 1024);
    const grading = extractJson(raw);
    res.json(grading);
  } catch (err) {
    console.error("/api/grade-writing error:", err.message);
    sendError(res, 502, "unavailable");
  }
});

// ---------------------------------------------------------------------------
// POST /api/placement — Placement test evaluation (non-streaming, JSON)
// ---------------------------------------------------------------------------

app.post("/api/placement", aiLimiter, async (req, res) => {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const body = req.body || {};
  const rawAnswers = Array.isArray(body.answers) ? body.answers.slice(0, MAX_ANSWERS) : [];
  if (rawAnswers.length === 0) return sendError(res, 400, "bad_request");

  const answersText = rawAnswers
    .map((a, i) => {
      const q   = clampStr(a?.question || "", 300);
      const ua  = clampStr(a?.userAnswer || "", 200);
      const ca  = clampStr(a?.correctAnswer || "", 200);
      return `Q${i + 1}: ${q}\n  Student answered: "${ua}"\n  Correct answer: "${ca}"`;
    })
    .join("\n\n");

  const messages = [
    {
      role: "system",
      content: `You are an English language assessment specialist for children.
Evaluate the given quiz answers and determine the student's CEFR level.
Respond ONLY with valid JSON matching this exact structure:
{
  "cefrLevel": "A1",
  "score": 75,
  "feedback": "detailed feedback string explaining the result and suggesting next steps"
}
cefrLevel must be exactly one of: "A1", "A2", "B1"`,
    },
    {
      role: "user",
      content: `Please evaluate these placement test answers and determine the student's English level:\n\n${answersText}`,
    },
  ];

  try {
    const raw = await callGateway(apiKey, messages, 512);
    const result = extractJson(raw);

    const validLevels = ["A1", "A2", "B1"];
    if (!validLevels.includes(result.cefrLevel)) result.cefrLevel = "A1";

    res.json(result);
  } catch (err) {
    console.error("/api/placement error:", err.message);
    sendError(res, 502, "unavailable");
  }
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`English Game API listening on port ${PORT}`);
  console.log(`Gateway: ${GATEWAY_URL} | Model: ${MODEL}`);
});

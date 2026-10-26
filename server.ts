import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function getPort(): number {
  // Check for command-line arguments like --port 3000 or --port=3000
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val)) return val;
  }
  for (const arg of process.argv) {
    if (arg.startsWith('--port=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val)) return val;
    }
  }

  // In production (Cloud Run), listen on assigned PORT environment variable
  if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val)) return val;
  }

  // In development, dev server must run on port 3000 (nginx occupies 8080 in dev environment)
  return 3000;
}

const PORT = getPort();

// Parse large JSON payloads for base64 audio
app.use(express.json({ limit: '20mb' }));

// Health check endpoints for immediate container readiness
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Model used for scenarios, questions and pitch evaluation.
// Can be changed without editing code by setting GEMINI_MODEL in the Secrets panel.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Initialize GoogleGenAI server-side client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Format Gemini API errors into clean, friendly human messages instead of raw JSON
 */
function formatGeminiError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const raw = err.message || (typeof err === 'string' ? err : JSON.stringify(err));

  if (raw.includes('GEMINI_TIMEOUT')) {
    return 'The AI took too long to respond. Please try again.';
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error) {
        const code = parsed.error.code;
        const msg = parsed.error.message || '';
        const status = parsed.error.status;
        if (code === 503 || status === 'UNAVAILABLE' || msg.includes('high demand')) {
          return 'The AI service is experiencing temporary high demand spikes from Google servers. Please wait a brief moment and try again.';
        }
        if (code === 429 || status === 'RESOURCE_EXHAUSTED' || msg.includes('quota') || msg.includes('rate')) {
          return 'The AI service temporarily reached request rate limits. Please wait 5-10 seconds and try again.';
        }
        if (msg) return msg;
      }
    }
  } catch {}

  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return 'The AI service is experiencing temporary high demand spikes from Google servers. Please wait a brief moment and try again.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'The AI service temporarily reached request rate limits. Please wait 5-10 seconds and try again.';
  }

  return raw;
}

/**
 * Execute a Gemini API call with automatic retries for transient 503/429 spikes
 */
async function callGeminiWithRetry<T>(
  callFn: () => Promise<T>,
  maxRetries = 2,
  initialDelayMs = 1500,
  timeoutMs = 20000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      // Fail fast instead of leaving the user on a loading screen if Gemini stalls.
      // A timeout is not retried (see isTransient below), so the user gets an answer quickly.
      return await new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs);
        callFn().then(
          (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          }
        );
      });
    } catch (err: any) {
      attempt++;
      const raw = err?.message || String(err);
      const isTransient =
        raw.includes('503') ||
        raw.includes('UNAVAILABLE') ||
        raw.includes('high demand') ||
        raw.includes('429') ||
        raw.includes('RESOURCE_EXHAUSTED') ||
        raw.includes('rateLimitExceeded');

      if (attempt <= maxRetries && isTransient) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
        console.warn(`[Gemini API] Transient 503/429 error, retrying in ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Parse JSON from a model reply, tolerating markdown code fences or stray text around the object.
 */
function parseModelJson(text: string): any {
  const trimmed = (text || '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {}
  }

  throw new Error('The AI returned a reply the app could not read. Please try again.');
}

// Self-test: open /api/diagnose in a browser to see whether this server can reach Gemini and how fast it replies
app.get('/api/diagnose', async (_req, res) => {
  const timed = async (label: string, run: () => Promise<any>) => {
    const started = Date.now();
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 20000);
        run().then(
          () => {
            clearTimeout(timer);
            resolve();
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          }
        );
      });
      return { test: label, ok: true, ms: Date.now() - started };
    } catch (err: any) {
      return { test: label, ok: false, ms: Date.now() - started, error: formatGeminiError(err).slice(0, 300) };
    }
  };

  const results = [
    await timed('tiny text reply', () =>
      ai.models.generateContent({ model: GEMINI_MODEL, contents: 'Reply with the single word OK.' })
    ),
    await timed('short JSON reply', () =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: 'Return JSON like {"title":"..."} with a short title for a pitch about a coffee shop.',
        config: { responseMimeType: 'application/json' },
      })
    ),
  ];

  res.json({ model: GEMINI_MODEL, apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY), results });
});

// Scenario generation endpoint
app.post('/api/scenario', async (req, res) => {
  try {
    const { mode = 'startup', feedbackStyle = 'supportive', industry, freestyleDraft } = req.body;

    let modeDescription = '';
    if (mode === 'freestyle') {
      modeDescription = `Mode: Freestyle Custom Pitch.
${freestyleDraft ? `User's Provided Scenario & Custom Criteria Draft:
- What they are pitching: ${freestyleDraft.title || 'Custom Proposal'}
- Target Audience: ${freestyleDraft.audience || 'Executive Decision Maker'}
- Context / Situation: ${freestyleDraft.context || ''}
- Core Objective (60s limit): ${freestyleDraft.objective || ''}
- Constraint / Curveball: ${freestyleDraft.keyConstraint || ''}
- Custom Criteria to Grade: ${freestyleDraft.customCriteria || ''}

TASK: Polish this into an executive-grade 60-second scenario while strictly preserving the user's pitch topic, target audience, and custom criteria. Provide a crisp constraint/curveball if none was provided, and add an expert starter tip.` : `Generate an inspiring, realistic high-stakes scenario where an executive, founder, or professional must pitch a strategic proposal in 60 seconds.`}`;
    } else {
      modeDescription = `Mode: ${mode} (Options: startup = Startup Pitch to VC, consulting = Consulting Case Answer to McKinsey/BCG partner, elevator = 45-second high-stakes Elevator Pitch).`;
    }

    const prompt = `You are an expert executive coach creating a realistic, high-stakes 60-second scenario for a user practicing:
${modeDescription}
Feedback Style: ${feedbackStyle} (supportive = encouraging mentor, tough = ruthless Tier-1 venture partner or senior partner).
${industry ? `Optional Industry Focus: ${industry}` : ''}

Generate a concise, gripping scenario prompt.
Return pure JSON matching this exact structure:
{
  "title": "Short title (under 6 words)",
  "audience": "Who they are speaking to (e.g. Partner at Benchmark, Senior Partner at BCG, CTO of JPMorgan)",
  "context": "Context background (1-2 crisp sentences setting the scene)",
  "objective": "What the speaker must accomplish in under 60 seconds (1 crisp sentence)",
  "keyConstraint": "A tricky constraint or curveball (e.g. 'Customer acquisition cost doubled last month', 'Margins dipped 300 bps', 'Elevator stops at floor 24 in 45 seconds')",
  "starterTip": "One punchy tip on how to nail this opening",
  "customCriteria": "Specific custom criteria or focus areas to grade against (preserve user's criteria if provided, or supply 1 high-leverage evaluation standard)"
}`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      1,
      1500,
      20000
    );

    const text = response.text || '{}';
    const parsed = parseModelJson(text);

    // Safeguard: Ensure user's custom aspects are strictly preserved
    if (mode === 'freestyle' && freestyleDraft) {
      if (freestyleDraft.title && (!parsed.title || parsed.title.trim() === 'Custom Proposal')) {
        parsed.title = freestyleDraft.title;
      }
      if (freestyleDraft.audience && (!parsed.audience || parsed.audience.trim() === 'Executive Decision Maker')) {
        parsed.audience = freestyleDraft.audience;
      }
      if (freestyleDraft.customCriteria && !parsed.customCriteria) {
        parsed.customCriteria = freestyleDraft.customCriteria;
      }
    }

    return res.json({ success: true, scenario: parsed });
  } catch (error: any) {
    console.error('Error generating scenario:', error);
    return res.status(500).json({
      success: false,
      error: formatGeminiError(error),
    });
  }
});

// Scenario clarifying question endpoint
app.post('/api/scenario-question', async (req, res) => {
  try {
    const { scenario, question, mode = 'startup', feedbackStyle = 'supportive' } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const personaInstructions =
      feedbackStyle === 'tough'
        ? `You are a tough, rigorous venture partner / senior consulting engagement manager. Be incisive, direct, and pragmatic.`
        : `You are an experienced executive pitch coach and mentor. Be tactical, clear, and empowering.`;

    const prompt = `${personaInstructions}
A candidate is preparing a 60-second response to this scenario:
Title: ${scenario?.title || 'Pitch Practice'}
Audience: ${scenario?.audience || 'Executive'}
Context: ${scenario?.context || ''}
Objective: ${scenario?.objective || ''}
Constraint/Skepticism: ${scenario?.keyConstraint || ''}

The candidate has asked ONE clarifying question about this scenario before recording:
"${question.trim()}"

Provide a concise, actionable answer in 2 to 3 sentences maximum. Give concrete tactical guidance on what angle, metric, or framing will work best against this specific audience.`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      })
    );

    const answer = response.text?.trim() || 'Focus on leading with your core quantified metric in the first 10 seconds, then directly address their skepticism before asking for the follow-up meeting.';
    return res.json({ success: true, answer });
  } catch (error: any) {
    console.error('Error answering scenario question:', error);
    return res.status(500).json({
      success: false,
      error: formatGeminiError(error),
    });
  }
});

// Dedicated Audio Transcription endpoint using gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'No audio data received' });
    }

    let cleanMimeType = mimeType.split(';')[0].trim();
    if (!cleanMimeType || cleanMimeType === 'audio') {
      cleanMimeType = 'audio/webm';
    }

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: audioBase64,
      },
    };

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: 'Transcribe this spoken audio recording verbatim. Capture all spoken words exactly as articulated, preserving filler words (e.g. um, uh, like, you know) and natural speech cadence.',
            },
          ],
        },
      }),
      1,
      1500,
      45000
    );

    const transcript = response.text?.trim() || '';
    return res.json({ success: true, transcript });
  } catch (error: any) {
    console.error('Error in /api/transcribe:', error);
    return res.status(500).json({
      success: false,
      error: formatGeminiError(error),
    });
  }
});

// Evaluation endpoint (handles base64 audio from MediaRecorder)
app.post('/api/evaluate', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      scenario,
      feedbackStyle = 'supportive',
      mode = 'startup',
      round = 1,
      followUpQuestion,
      previousFeedback,
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'No audio data received' });
    }

    // Clean mimeType to standard format
    let cleanMimeType = mimeType.split(';')[0].trim();
    if (!cleanMimeType || cleanMimeType === 'audio') {
      cleanMimeType = 'audio/webm';
    }

    const personaInstructions =
      feedbackStyle === 'tough'
        ? `You are a tough, no-nonsense investor / senior consulting partner. You have heard thousands of pitches. You do not tolerate hand-waving, buzzwords, or weak logic. Be sharp, direct, rigorous, yet strictly professional.`
        : `You are an experienced, high-empathy pitch mentor and executive coach. You highlight genuine strengths while pinpointing high-leverage delivery tweaks with encouraging, clear direction.`;

    const roundInstructions =
      round === 2
        ? `This is ROUND 2: The speaker is answering your tough follow-up question: "${followUpQuestion}".
Compare their performance to Round 1 (Round 1 scores: Clarity ${previousFeedback?.scores?.clarity}/10, Structure ${previousFeedback?.scores?.structure}/10, Persuasiveness ${previousFeedback?.scores?.persuasiveness}/10, Confidence ${previousFeedback?.scores?.confidence}/10, Concision ${previousFeedback?.scores?.concision}/10).
Evaluate whether they directly addressed the objection or pivoted evasively. Highlight improvements and calculate score differences.`
        : `This is ROUND 1: The user is delivering their initial 60-second pitch based on the scenario. Provide an incisive follow-up question that pressures their weakest assumption.`;

    const systemPrompt = `${personaInstructions}
${roundInstructions}

Scenario:
Title: ${scenario?.title || 'Pitch Practice'}
Audience: ${scenario?.audience || 'Executive'}
Context: ${scenario?.context || ''}
Objective: ${scenario?.objective || ''}
Key Constraint: ${scenario?.keyConstraint || ''}
${scenario?.customCriteria ? `Custom User-Specified Criteria & Standards to evaluate against:\n"${scenario.customCriteria}"\nIMPORTANT: Evaluate how well the speaker specifically met these custom criteria.` : ''}

LISTEN CAREFULLY TO THE AUDIO. Transcribe the user's spoken words verbatim.
Assess their vocal delivery, tone, pacing, filler words (um, uh, like, you know, sort of, basically), hesitation pauses, and rhetorical strength.

Evaluate strictly on the 5 core dimensions from 1 to 10 (1 = extremely weak, 10 = world-class):
1. Clarity (Were their points easy to understand without jargon or confusing syntax?)
2. Structure (Did they use a clear framework, logical sequencing, or signposting?)
3. Persuasiveness (Did they offer compelling evidence, quantified value, or conviction?)
4. Confidence (Tone of voice, steady cadence, lack of nervous upward inflections or filler words)
5. Concision (Value density, staying focused, zero fluff, respecting the 60s limit)

Provide EXACTLY ONE specific sentence of feedback for each dimension.
${scenario?.customCriteria ? 'Also provide ONE sentence specifically assessing their performance against their Custom Criteria.' : ''}
List specific filler words or pacing issues noticed (with counts or examples from their speech).
Provide ${round === 1 ? 'ONE tough, realistic follow-up question to test their resolve' : 'a closing master tip for future pitches'}.

Output MUST be a valid JSON object matching this schema:
{
  "transcript": "Full accurate transcription of what the speaker said in the audio",
  "scores": {
    "clarity": integer (1-10),
    "structure": integer (1-10),
    "persuasiveness": integer (1-10),
    "confidence": integer (1-10),
    "concision": integer (1-10),
    "overall": number (1.0 to 10.0, average with 1 decimal)
  },
  "feedback": {
    "clarity": "Exactly one sentence of specific feedback on clarity.",
    "structure": "Exactly one sentence of specific feedback on structure.",
    "persuasiveness": "Exactly one sentence of specific feedback on persuasiveness.",
    "confidence": "Exactly one sentence of specific feedback on confidence.",
    "concision": "Exactly one sentence of specific feedback on concision."${scenario?.customCriteria ? `,\n    "customCriteria": "One specific sentence evaluating how effectively they adhered to the custom criteria."` : ''}
  },
  "fillerWordsAndPacing": [
    "Array of strings detailing filler words found, speech rate, pauses, or pacing notes"
  ],
  "followUpQuestion": "One tough, insightful question directly challenging their assumptions (or closing challenge if round 2)",
  "round2Comparison": ${round === 2 ? `{
    "improvementSummary": "2-3 sentences evaluating how they handled the follow-up compared to round 1",
    "keyWins": ["Array of 2-3 specific improvements noticed"],
    "remainingRefinements": ["Array of 1-2 things to polish next"],
    "scoreDeltas": {
      "clarity": number,
      "structure": number,
      "persuasiveness": number,
      "confidence": number,
      "concision": number,
      "overall": number
    }
  }` : `null`}
}`;

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: audioBase64,
      },
    };

    const textPart = {
      text: systemPrompt,
    };

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [audioPart, textPart],
        },
        config: {
          responseMimeType: 'application/json',
        },
      }),
      1,
      1500,
      60000
    );

    const responseText = response.text || '{}';
    const parsed = parseModelJson(responseText);

    return res.json({
      success: true,
      evaluation: parsed,
      round,
    });
  } catch (error: any) {
    console.error('Error in /api/evaluate:', error);
    return res.status(500).json({
      success: false,
      error: formatGeminiError(error),
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  let isViteReady = false;

  // Placeholder middleware during Vite startup
  app.use((req, res, next) => {
    if (isProduction || req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    if (!isViteReady) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="1"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#09090b;color:#f4f4f5;"><p>Starting PitchLab...</p></body></html>`);
    }
    next();
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`PitchLab server listening on http://0.0.0.0:${PORT}`);
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    try {
      const vite = await createViteServer({
        root: __dirname,
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      isViteReady = true;
      console.log('Vite middleware mounted successfully');
    } catch (viteError) {
      console.error('Error starting Vite dev server:', viteError);
    }
  }

  const handleShutdown = () => {
    console.log('Shutting down PitchLab server...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

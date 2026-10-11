import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  analyzeEmailInput,
  analyzeMessageInput,
  analyzeUrlInput,
} from './src/engine/detectionEngine';
import {
  DetectedSignal,
  RiskClassification,
  ScamCategory,
  ScanResult,
} from './src/types/cybernova';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cybernova_scans.json');

function ensureDbFile(): ScanResult[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveScansToDb(scans: ScanResult[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(scans.slice(0, 250), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist scan database:', err);
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim().length < 10) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function enhanceWithGeminiAI(
  baseResult: ScanResult,
  contextDescription: string
): Promise<ScanResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return baseResult;
  }

  try {
    const prompt = `You are Cybernova (Project ID: TRI26158), an explainable cybersecurity and online scam detection engine.
Analyze the following ${baseResult.inputType} submission and our preliminary deterministic multi-signal heuristic findings.

SUBMISSION DETAILS:
${contextDescription}

DETERMINISTIC HEURISTIC BASELINE:
- Heuristic Risk Score: ${baseResult.riskScore}/100
- Heuristic Classification: ${baseResult.classification}
- Detected Signals (${baseResult.signals.length}): ${baseResult.signals.map((s) => s.title).join('; ') || 'None'}

CRITICAL RULES:
1. Do NOT classify a message as a scam based on a single benign word (e.g., an ordinary meeting reminder or a legitimate bank debit alert that says "Never share your OTP" and has no malicious link or demand MUST remain Low Risk with score <= 15).
2. For URLs, never claim a URL is safe solely because it uses HTTPS.
3. Combine multiple signals across psychological urgency, credential harvesting, financial extraction, brand impersonation, and link obfuscation.

Return a JSON object refining the analysis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedRiskScore: {
              type: Type.INTEGER,
              description: 'Refined risk score from 0 to 100 combining heuristic baseline and semantic intent.',
            },
            aiForensicNote: {
              type: Type.STRING,
              description: '2-3 sentence explainable forensic synthesis of the sender intent, manipulation tactics, or benign nature.',
            },
            additionalWarningTitle: {
              type: Type.STRING,
              description: 'Optional title of any subtle semantic social-engineering signal missed by regex rules (empty string if none).',
            },
            additionalWarningExplanation: {
              type: Type.STRING,
              description: 'Explanation for the additional semantic signal (empty string if none).',
            },
            additionalWarningExcerpt: {
              type: Type.STRING,
              description: 'Exact phrase from the input that triggered the additional warning (empty string if none).',
            },
          },
          required: [
            'refinedRiskScore',
            'aiForensicNote',
            'additionalWarningTitle',
            'additionalWarningExplanation',
            'additionalWarningExcerpt',
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) return baseResult;

    const aiData = JSON.parse(rawText.trim());
    const blendedScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(baseResult.riskScore * 0.65 + Number(aiData.refinedRiskScore || baseResult.riskScore) * 0.35)
      )
    );

    const classification: RiskClassification =
      blendedScore >= 60 ? 'High Risk' : blendedScore >= 28 ? 'Suspicious' : 'Low Risk';

    const updatedSignals: DetectedSignal[] = [...baseResult.signals];
    if (
      aiData.additionalWarningTitle &&
      aiData.additionalWarningTitle.trim().length > 3 &&
      blendedScore >= 28 &&
      updatedSignals.length < 6
    ) {
      updatedSignals.push({
        id: `ai-semantic-${Date.now()}`,
        title: aiData.additionalWarningTitle.trim(),
        category: 'AI Semantic Intent Analysis',
        severity: blendedScore >= 60 ? 'high' : 'medium',
        weight: 18,
        explanation:
          aiData.additionalWarningExplanation?.trim() ||
          'Identified by Gemini semantic analysis as a social-engineering manipulation pattern.',
        matchedExcerpts: aiData.additionalWarningExcerpt?.trim()
          ? [aiData.additionalWarningExcerpt.trim()]
          : [],
      });
    }

    const primaryCategory: ScamCategory =
      classification === 'Low Risk'
        ? 'Benign / Legitimate Communication'
        : baseResult.primaryCategory;

    return {
      ...baseResult,
      riskScore: blendedScore,
      classification,
      primaryCategory,
      signals: updatedSignals,
      aiForensicNote: aiData.aiForensicNote?.trim() || undefined,
      analysisEngine: 'Hybrid AI + Multi-Signal Heuristics',
    };
  } catch (err) {
    // Gracefully fallback to deterministic multi-signal engine
    console.warn('Gemini enhancement fallback to deterministic heuristics:', err);
    return baseResult;
  }
}

async function buildProjectZipBuffer(): Promise<Buffer> {
  const zip = new JSZip();
  const rootFiles = [
    'README.md',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'metadata.json',
    '.env.example',
    'firebase-applet-config.json',
    'server.ts',
  ];

  for (const file of rootFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      zip.file(file, fs.readFileSync(filePath, 'utf-8'));
    }
  }

  const addDirRecursively = (dirPath: string, zipFolderPrefix: string) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const zipPath = `${zipFolderPrefix}/${entry.name}`;
      if (entry.isDirectory()) {
        addDirRecursively(fullPath, zipPath);
      } else if (entry.isFile()) {
        zip.file(zipPath, fs.readFileSync(fullPath));
      }
    }
  };

  addDirRecursively(path.join(__dirname, 'src'), 'src');
  addDirRecursively(path.join(__dirname, 'data'), 'data');

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Pre-build static ZIP in /public so direct <a download> links work instantaneously
  try {
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const zipBuf = await buildProjectZipBuffer();
    fs.writeFileSync(
      path.join(publicDir, 'Cybernova-TRI26158-FullProject.zip'),
      zipBuf
    );
  } catch (err) {
    console.warn('Could not pre-write static zip:', err);
  }

  // 1. Get scan history
  app.get('/api/history', (_req, res) => {
    const scans = ensureDbFile();
    res.json({ scans });
  });

  // 2. Analyze Message (SMS / WhatsApp / Social / Payment)
  app.post('/api/analyze/message', async (req, res) => {
    try {
      const { text, channel, isDemoCase, demoCaseId } = req.body || {};
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ error: 'Please provide message text to analyze.' });
        return;
      }

      const baseResult = analyzeMessageInput({
        text: text.slice(0, 8000),
        channel,
        isDemoCase: Boolean(isDemoCase),
        demoCaseId,
      });

      const finalResult = await enhanceWithGeminiAI(
        baseResult,
        `Channel: ${channel || 'SMS'}\nMessage Content:\n${text.slice(0, 3000)}`
      );

      const scans = ensureDbFile();
      scans.unshift(finalResult);
      saveScansToDb(scans);

      res.json({ result: finalResult });
    } catch (error) {
      console.error('Error in /api/analyze/message:', error);
      res.status(500).json({ error: 'Failed to analyze message.' });
    }
  });

  // 3. Analyze URL (Safe Non-Visiting Heuristic + AI Inspection)
  app.post('/api/analyze/url', async (req, res) => {
    try {
      const { url, isDemoCase, demoCaseId } = req.body || {};
      if (!url || typeof url !== 'string' || url.trim().length === 0) {
        res.status(400).json({ error: 'Please enter a URL or domain name to inspect.' });
        return;
      }

      const baseResult = analyzeUrlInput({
        url: url.slice(0, 2048),
        isDemoCase: Boolean(isDemoCase),
        demoCaseId,
      });

      const finalResult = await enhanceWithGeminiAI(
        baseResult,
        `Submitted URL (Non-Visiting Inspection): ${url.slice(0, 1000)}\nParsed Hostname: ${baseResult.urlBreakdown?.hostname}\nRegistrable Domain: ${baseResult.urlBreakdown?.domain}`
      );

      const scans = ensureDbFile();
      scans.unshift(finalResult);
      saveScansToDb(scans);

      res.json({ result: finalResult });
    } catch (error) {
      console.error('Error in /api/analyze/url:', error);
      res.status(500).json({ error: 'Failed to analyze URL.' });
    }
  });

  // 4. Analyze Email (Sender, Reply-To, Subject, Body)
  app.post('/api/analyze/email', async (req, res) => {
    try {
      const { sender, replyTo, subject, body, isDemoCase, demoCaseId } = req.body || {};
      if (!body || typeof body !== 'string' || body.trim().length === 0) {
        res.status(400).json({ error: 'Please provide the email message body to analyze.' });
        return;
      }

      const baseResult = analyzeEmailInput({
        sender: String(sender || 'unknown@sender.org').slice(0, 300),
        replyTo: replyTo ? String(replyTo).slice(0, 300) : undefined,
        subject: String(subject || '(No Subject)').slice(0, 500),
        body: body.slice(0, 10000),
        isDemoCase: Boolean(isDemoCase),
        demoCaseId,
      });

      const finalResult = await enhanceWithGeminiAI(
        baseResult,
        `Sender: ${sender || 'Unknown'}\nReply-To: ${replyTo || 'Same as sender'}\nSubject: ${subject || '(No Subject)'}\nEmail Body:\n${body.slice(0, 3000)}`
      );

      const scans = ensureDbFile();
      scans.unshift(finalResult);
      saveScansToDb(scans);

      res.json({ result: finalResult });
    } catch (error) {
      console.error('Error in /api/analyze/email:', error);
      res.status(500).json({ error: 'Failed to analyze email.' });
    }
  });

  // 5. Delete single history item
  app.delete('/api/history/:id', (req, res) => {
    const { id } = req.params;
    const scans = ensureDbFile();
    const filtered = scans.filter((s) => s.id !== id);
    saveScansToDb(filtered);
    res.json({ success: true, scans: filtered });
  });

  // 6. Clear all history
  app.delete('/api/history', (_req, res) => {
    saveScansToDb([]);
    res.json({ success: true, scans: [] });
  });

  // 7. Export complete project source code as a .ZIP archive
  app.get('/api/export/project-zip', async (_req, res) => {
    try {
      const zipBuffer = await buildProjectZipBuffer();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Cybernova-TRI26158-FullProject.zip"'
      );
      res.send(zipBuffer);
    } catch (error) {
      console.error('Error generating project ZIP:', error);
      res.status(500).json({ error: 'Failed to generate project ZIP archive.' });
    }
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cybernova (TRI26158) Server listening on http://localhost:${PORT}`);
  });
}

startServer();

import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import {
  classifyVideoApiError,
  formatScriptApiError,
  parseScriptResponse,
  validateTutorialQuery,
} from './src/utils/tutorialLogic.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// In-memory LRU store for generated MP4 buffers so HTML5 <video> can seek and download cleanly.
interface CachedVideo {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  createdAt: number;
}

const MAX_CACHED_VIDEOS = 12;
const videoStore = new Map<string, CachedVideo>();

function storeVideoBuffer(buffer: Buffer, mimeType: string, filename: string): string {
  if (videoStore.size >= MAX_CACHED_VIDEOS) {
    const oldestKey = videoStore.keys().next().value;
    if (oldestKey) {
      videoStore.delete(oldestKey);
    }
  }
  const id = crypto.randomUUID();
  videoStore.set(id, {
    buffer,
    mimeType,
    filename,
    createdAt: Date.now(),
  });
  return id;
}

function getGeminiClient(apiVersion?: 'v1' | 'v1beta'): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  // Phase 1: Script, Key Steps & English Text-to-Video Prompt via Gemini Flash
  app.post('/api/tutorial/script', async (req, res) => {
    const rawQuery = typeof req.body?.query === 'string' ? req.body.query : '';
    const validation = validateTutorialQuery(rawQuery);

    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Chiave API Gemini non configurata sul server. Aggiungi GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const scriptConfig = {
      systemInstruction: [
        'Sei un regista didattico e autore di video tutorial pratici chiamato TutAI.',
        "Trasforma la richiesta pratica dell'utente in una guida strutturata in italiano e in un prompt visivo cinematografico in inglese pronto per un modello text-to-video (Veo / Omni Flash).",
        'Regole per i campi in italiano:',
        '- title: titolo accattivante, chiaro e sintetico (max 65 caratteri).',
        '- subtitle: frase riassuntiva chiara (max 140 caratteri).',
        '- category: breve nome categoria (es. "Fai da te", "Cucina", "Stile", "Motori", "Tecnologia").',
        '- estimatedTime: stima realistica (es. "3 minuti").',
        '- difficulty: esattamente "Facile", "Media" oppure "Avanzata".',
        '- toolsNeeded: 2-5 oggetti essenziali richiesti.',
        '- steps: da 4 a 6 passaggi chiave sintetici, concreti e ordinati logicamente.',
        '- Per ogni step: title (max 45 caratteri), description (1-2 frasi chiare e azionabili), visualCue (breve descrizione visiva in inglese della scena di quello step), iconKey (uno tra: prepare, hand, tool, measure, heat, check, finish), durationSeconds (intero tra 2 e 3).',
        'Regole per videoPromptEn (SOLO IN INGLESE):',
        '- Un unico paragrafo descrittivo in inglese (60-90 parole) ottimizzato per modelli text-to-video.',
        '- Specifica stile visivo pulito da studio didattico, inquadratura ravvicinata o media ben composta, illuminazione naturale morbida, sequenza fluida dei gesti passo dopo passo e totale assenza di testo sovrapposto, scritte o watermark.',
      ].join('\n'),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          category: { type: Type.STRING },
          estimatedTime: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          toolsNeeded: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                visualCue: { type: Type.STRING },
                iconKey: { type: Type.STRING },
                durationSeconds: { type: Type.INTEGER },
              },
              required: [
                'stepNumber',
                'title',
                'description',
                'visualCue',
                'iconKey',
                'durationSeconds',
              ],
            },
          },
          videoPromptEn: { type: Type.STRING },
        },
        required: [
          'title',
          'subtitle',
          'category',
          'estimatedTime',
          'difficulty',
          'toolsNeeded',
          'steps',
          'videoPromptEn',
        ],
      },
    };

    try {
      const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
      let responseText = '';
      let lastError: unknown = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          const response = await ai.models.generateContent({
            model: modelsToTry[i],
            contents: `Richiesta dell'utente: "${validation.sanitized}"`,
            config: scriptConfig,
          });
          responseText = response.text ?? '';
          if (responseText.trim()) break;
        } catch (attemptErr) {
          lastError = attemptErr;
          const msg = attemptErr instanceof Error ? attemptErr.message : String(attemptErr);
          const isTransient =
            msg.includes('503') ||
            msg.toUpperCase().includes('UNAVAILABLE') ||
            msg.toLowerCase().includes('high demand');
          if (!isTransient || i === modelsToTry.length - 1) {
            throw attemptErr;
          }
          await new Promise((resolve) => setTimeout(resolve, 900));
        }
      }

      if (!responseText.trim()) {
        throw lastError ?? new Error('Risposta vuota dal modello di sceneggiatura.');
      }

      const script = parseScriptResponse(responseText);
      res.json({ script });
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : 'Errore imprevisto durante la generazione della guida.';
      const status =
        rawMessage.includes('403') || rawMessage.includes('PERMISSION_DENIED')
          ? 403
          : rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')
            ? 429
            : rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE')
              ? 503
              : 500;
      res.status(status).json({ error: formatScriptApiError(rawMessage) });
    }
  });

  // Phase 2: Video Generation via Veo / Omni Flash (Interactions API)
  app.post('/api/tutorial/video', async (req, res) => {
    const prompt = typeof req.body?.videoPromptEn === 'string' ? req.body.videoPromptEn.trim() : '';
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : 'tutai-tutorial';
    const aspectRatio = req.body?.aspectRatio === '9:16' ? '9:16' : '16:9';
    const duration = req.body?.duration === '6s' ? '6s' : '10s';

    if (!prompt || prompt.length < 10) {
      res.status(400).json({
        code: 'INVALID_PROMPT',
        isQuotaOrBilling: false,
        isTimeout: false,
        message: 'Prompt visivo non valido per la generazione video.',
      });
      return;
    }

    const ai = getGeminiClient('v1beta');
    if (!ai) {
      res.status(503).json(
        classifyVideoApiError(503, 'GEMINI_API_KEY non configurata sul server.')
      );
      return;
    }

    try {
      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: prompt,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
            duration,
            resolution: '720p',
          },
        },
        { timeout: 240000 }
      );

      const videoPart = interaction.output_video;
      if (videoPart?.data) {
        const buffer = Buffer.from(videoPart.data, 'base64');
        const mimeType = videoPart.mime_type || 'video/mp4';
        const safeSlug =
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 48) || 'tutai-video';
        const videoId = storeVideoBuffer(buffer, mimeType, `${safeSlug}.mp4`);
        res.json({
          videoUrl: `/api/video/${videoId}`,
          mimeType,
          duration,
        });
        return;
      }

      if (videoPart?.uri) {
        res.json({
          videoUrl: videoPart.uri,
          mimeType: videoPart.mime_type || 'video/mp4',
          duration,
        });
        return;
      }

      throw new Error('Il modello non ha restituito alcun flusso video.');
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const statusGuess =
        typeof (err as { status?: number })?.status === 'number'
          ? (err as { status: number }).status
          : rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')
            ? 429
            : rawMessage.includes('403') || rawMessage.includes('PERMISSION_DENIED')
              ? 403
              : rawMessage.toLowerCase().includes('timeout')
                ? 504
                : 502;

      const classified = classifyVideoApiError(statusGuess, rawMessage);
      res.status(statusGuess).json(classified);
    }
  });

  // Stream cached video with Range support for smooth HTML5 player seeking and download
  app.get('/api/video/:id', (req, res) => {
    const { id } = req.params;
    if (!/^[a-f0-9-]{36}$/i.test(id)) {
      res.status(400).json({ error: 'ID video non valido.' });
      return;
    }

    const entry = videoStore.get(id);
    if (!entry) {
      res.status(404).json({ error: 'Video scaduto o non trovato.' });
      return;
    }

    const { buffer, mimeType, filename } = entry;
    const totalLength = buffer.length;

    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= totalLength || end >= totalLength) {
        res.status(416).setHeader('Content-Range', `bytes */${totalLength}`).end();
        return;
      }
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      });
      res.end(buffer.subarray(start, end + 1));
      return;
    }

    res.writeHead(200, {
      'Content-Length': totalLength,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    });
    res.end(buffer);
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output missing.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TutAI server listening on http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start TutAI server:', err);
  process.exit(1);
});

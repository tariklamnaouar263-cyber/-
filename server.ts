import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import {
  analyzeReferenceAudioSample,
  applyVoiceCloneAcousticProfile,
  type ServerVoiceAcousticProfile,
} from './serverVoiceClone.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_GEMINI_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
const ALLOWED_NEURAL_VOICES = new Set([
  // English US & UK
  'en-US-BrianMultilingualNeural',
  'en-US-AndrewMultilingualNeural',
  'en-US-AvaMultilingualNeural',
  'en-US-EmmaMultilingualNeural',
  'en-US-AndrewNeural',
  'en-US-BrianNeural',
  'en-US-EmmaNeural',
  'en-US-JennyNeural',
  'en-US-GuyNeural',
  'en-US-ChristopherNeural',
  'en-US-AnaNeural',
  'en-GB-RyanNeural',
  'en-GB-SoniaNeural',
  'en-GB-MaisieNeural',
  // French FR & CA
  'fr-FR-HenriNeural',
  'fr-FR-DeniseNeural',
  'fr-FR-EloiseNeural',
  'fr-FR-RemyMultilingualNeural',
  'fr-FR-VivienneMultilingualNeural',
  'fr-CA-AntoineNeural',
  'fr-CA-SylvieNeural',
  // Arabic Dialects (All regions)
  'ar-SA-ZariyahNeural',
  'ar-SA-HamedNeural',
  'ar-EG-SalmaNeural',
  'ar-EG-ShakirNeural',
  'ar-MA-MounaNeural',
  'ar-MA-JamalNeural',
  'ar-SY-AmanyNeural',
  'ar-SY-LaithNeural',
  'ar-LB-LaylaNeural',
  'ar-LB-RamiNeural',
  'ar-AE-FatimaNeural',
  'ar-AE-HamdanNeural',
  'ar-IQ-RanaNeural',
  'ar-IQ-BasselNeural',
  'ar-JO-SanaNeural',
  'ar-JO-TaimNeural',
  'ar-OM-AbdullahNeural',
  'ar-OM-AyshaNeural',
  'ar-QA-MoazNeural',
  'ar-QA-AmalNeural',
  'ar-TN-HediNeural',
  'ar-TN-ReemNeural',
  'ar-DZ-IsmaelNeural',
  'ar-DZ-AminaNeural',
  'ar-KW-FahedNeural',
  'ar-KW-NouraNeural',
  'ar-BH-AliNeural',
  'ar-BH-LailaNeural',
  'ar-LY-OmarNeural',
  'ar-LY-ImanNeural',
  'ar-YE-SalehNeural',
  'ar-YE-MaryamNeural',
]);

const ALLOWED_TTS_MODELS = new Set([
  'free-neural',
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
]);

function getAiClient(apiVersion: string = 'v1beta') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSpeedDescriptor(speed: number): string {
  if (speed <= 0.75) return 'very slow, deliberate, unhurried pacing';
  if (speed <= 0.9) return 'measured, calm, slightly slower pacing';
  if (speed >= 1.35) return 'brisk, fast-paced, energetic delivery';
  if (speed >= 1.15) return 'upbeat, slightly faster natural pacing';
  return 'natural, balanced conversational pacing';
}

function buildExpressivenessDescriptor(expressiveness: number): string {
  if (expressiveness >= 75) return 'highly expressive, dynamic vocal inflection, rich emotional emphasis';
  if (expressiveness >= 45) return 'balanced natural inflection with clear articulation';
  return 'steady, uniform, broadcast-stable vocal consistency';
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  console.error('[TTS/AI Error]', raw);
  const lower = raw.toLowerCase();

  if (lower.includes('free tier is not available') || lower.includes('billing')) {
    return {
      status: 403,
      message:
        'ميزة الذكاء الاصطناعي التوليدي للنصوص تتطلب تفعيل الفوترة على مفتاح Gemini API، بينما محرك تحويل النص إلى صوت المجاني يعمل بدون أي تكلفة.',
    };
  }
  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 403,
      message: 'تعذر التحقق من مفتاح Gemini API. يمكنك استخدام المحرك المجاني لتحويل النص إلى صوت مباشرة.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      status: 429,
      message: 'تم تجاوز حد الطلبات المؤقت. يرجى الانتظار قليلاً ثم إعادة المحاولة.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: 'النموذج المطلوب غير متاح حالياً. يرجى استخدام المحرك المجاني.',
    };
  }
  return {
    status: 500,
    message: raw || 'حدث خطأ غير متوقع أثناء المعالجة.',
  };
}

function extractAudioBase64(response: any): { data: string; mimeType: string } | null {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'audio/wav',
      };
    }
  }
  return null;
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/(?<=[.!؟،؛\n])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > maxLen) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      const words = sentence.split(' ');
      for (let w of words) {
        while (w.length > maxLen) {
          if (current) {
            chunks.push(current.trim());
            current = '';
          }
          chunks.push(w.slice(0, maxLen));
          w = w.slice(maxLen);
        }
        if ((current + ' ' + w).trim().length > maxLen) {
          if (current) chunks.push(current.trim());
          current = w;
        } else {
          current = (current + ' ' + w).trim();
        }
      }
    } else if ((current + ' ' + sentence).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = (current + ' ' + sentence).trim();
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function escapeXmlForSsml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeForFreeTts(text: string): string {
  const cleaned = text
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '') // Strip invisible control marks
    .replace(/\u0640+/g, '') // Strip Tatweel/Kashida so words aren't misread
    .replace(/<breath>/gi, '، ')
    .replace(/<laugh>/gi, ' ')
    .replace(/<gasp>/gi, ' ')
    .replace(/[*_`~#•▪●◄►—–]+/g, ' ') // Strip markdown/bullet symbols that cause spelling out
    .replace(/[«»“”"()[\]{}]/g, ' ') // Avoid symbol reading glitches
    .replace(/\.{3,}|…/g, '، ') // Natural gentle pause for ellipsis
    .replace(/\n+/g, '. ') // Pause cleanly at paragraph breaks
    .replace(/([\u0600-\u06FF]),([\u0600-\u06FF\s])/g, '$1،$2') // Normalize Latin comma in Arabic
    .replace(/\s*([،؛؟!.])\s*/g, '$1 ') // Clean spacing after punctuation for smooth breathing
    .replace(/\s+/g, ' ')
    .trim();

  return escapeXmlForSsml(cleaned);
}

const HIGH_BITRATE_CAPABLE_PREFIXES = [
  'ar-SA-',
  'ar-AE-',
  'ar-QA-',
  'ar-JO-',
  'ar-OM-',
  'ar-LY-',
  'ar-YE-',
  'ar-KW-',
  'ar-BH-',
  'en-US-',
  'en-GB-',
  'fr-FR-',
  'fr-CA-',
];

async function runEdgeTtsStream(
  text: string,
  neuralVoice: string,
  format: OUTPUT_FORMAT,
  rateStr: string,
  pitchStr: string
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(neuralVoice, format);

  return await new Promise<Buffer>((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        tts.close();
      } catch {
        // ignore close errors
      }
      reject(new Error('Edge TTS timeout'));
    }, 25000);

    try {
      const { audioStream } = tts.toStream(text, {
        rate: rateStr,
        pitch: pitchStr,
      });
      const chunks: Buffer[] = [];
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => {
        clearTimeout(timer);
        try {
          tts.close();
        } catch {
          // ignore
        }
        resolve(Buffer.concat(chunks));
      });
      audioStream.on('error', (err: Error) => {
        clearTimeout(timer);
        try {
          tts.close();
        } catch {
          // ignore
        }
        reject(err);
      });
    } catch (err) {
      clearTimeout(timer);
      try {
        tts.close();
      } catch {
        // ignore
      }
      reject(err);
    }
  });
}

async function synthesizeEdgeChunk(
  text: string,
  neuralVoice: string,
  ratePct: number,
  pitchHz: number,
  isCartoon = false
): Promise<Buffer> {
  // Keep realistic voices gentle (-8Hz..+8Hz) and allow expressive character range for cartoon voices (-28Hz..+50Hz)
  const clampedRate = Math.max(-45, Math.min(75, Math.round(ratePct)));
  const minPitch = isCartoon ? -28 : -8;
  const maxPitch = isCartoon ? 50 : 8;
  const clampedPitch = Math.max(minPitch, Math.min(maxPitch, Math.round(pitchHz)));
  const rateStr = `${clampedRate >= 0 ? '+' : ''}${clampedRate}%`;
  const pitchStr = `${clampedPitch >= 0 ? '+' : ''}${clampedPitch}Hz`;

  const prefer96k = HIGH_BITRATE_CAPABLE_PREFIXES.some((p) => neuralVoice.startsWith(p));
  if (prefer96k) {
    try {
      const buf = await runEdgeTtsStream(
        text,
        neuralVoice,
        OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
        rateStr,
        pitchStr
      );
      if (buf.length > 0) return buf;
    } catch {
      // Fall through cleanly to universal 48kbps format
    }
  }

  return runEdgeTtsStream(
    text,
    neuralVoice,
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    rateStr,
    pitchStr
  );
}

async function synthesizeGoogleTranslateFallback(text: string, langCode = 'ar'): Promise<Buffer> {
  const chunks = splitTextIntoChunks(text, 180);
  const buffers = await mapWithConcurrency(chunks, 3, async (chunk) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      chunk
    )}&tl=${langCode}&client=tw-ob`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!resp.ok) {
      throw new Error(`Free TTS HTTP ${resp.status}`);
    }
    const arr = await resp.arrayBuffer();
    return Buffer.from(arr);
  });
  return Buffer.concat(buffers);
}

async function synthesizeChunkWithResilience(
  chunk: string,
  safeVoice: string,
  baseRatePct: number,
  pitchHz: number,
  isCartoon = false
): Promise<Buffer> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const buf = await synthesizeEdgeChunk(chunk, safeVoice, baseRatePct, pitchHz, isCartoon);
      if (buf.length > 0) return buf;
    } catch (err) {
      if (attempt === 1) {
        console.warn('[Chunk Edge TTS failed, using fallback]', err instanceof Error ? err.message : err);
      }
    }
  }
  const fallbackLang = safeVoice.startsWith('fr-')
    ? 'fr'
    : safeVoice.startsWith('en-')
      ? 'en'
      : 'ar';
  return synthesizeGoogleTranslateFallback(chunk, fallbackLang);
}

async function synthesizeFreeSpeechBuffer(
  text: string,
  neuralVoice: string,
  speed: number,
  rateOffsetPct: number,
  pitchHz: number,
  allowWidePitchRange = false
): Promise<Buffer> {
  const cleanText = sanitizeForFreeTts(text);
  const safeVoice = ALLOWED_NEURAL_VOICES.has(neuralVoice)
    ? neuralVoice
    : 'ar-SA-ZariyahNeural';

  const baseRatePct = (speed - 1.0) * 100 + rateOffsetPct;

  const chunks = splitTextIntoChunks(cleanText, 750);
  const buffers = await mapWithConcurrency(chunks, 2, (chunk) =>
    synthesizeChunkWithResilience(chunk, safeVoice, baseRatePct, pitchHz, allowWidePitchRange)
  );
  const combined = Buffer.concat(buffers.filter((b) => b.length > 0));
  if (combined.length === 0) {
    throw new Error('تعذر توليد الصوت لهذا النص.');
  }

  return combined;
}

async function synthesizeFreeSpeech(
  text: string,
  neuralVoice: string,
  speed: number,
  rateOffsetPct: number,
  pitchHz: number,
  isCartoon = false
): Promise<{ audioBase64: string; mimeType: string }> {
  const combined = await synthesizeFreeSpeechBuffer(
    text,
    neuralVoice,
    speed,
    rateOffsetPct,
    pitchHz,
    isCartoon
  );

  return {
    audioBase64: combined.toString('base64'),
    mimeType: 'audio/mpeg',
  };
}

const CLONE_BASE_VOICES: Record<string, { male: string; female: string }> = {
  msa: { male: 'ar-SA-HamedNeural', female: 'ar-SA-ZariyahNeural' },
  moroccan: { male: 'ar-MA-JamalNeural', female: 'ar-MA-MounaNeural' },
  egyptian: { male: 'ar-EG-ShakirNeural', female: 'ar-EG-SalmaNeural' },
  gulf: { male: 'ar-AE-HamdanNeural', female: 'ar-AE-FatimaNeural' },
  levantine: { male: 'ar-JO-TaimNeural', female: 'ar-JO-SanaNeural' },
  iraqi: { male: 'ar-IQ-BasselNeural', female: 'ar-IQ-RanaNeural' },
  tunisian: { male: 'ar-TN-HediNeural', female: 'ar-TN-ReemNeural' },
  algerian: { male: 'ar-DZ-IsmaelNeural', female: 'ar-DZ-AminaNeural' },
  libyan: { male: 'ar-LY-OmarNeural', female: 'ar-LY-ImanNeural' },
  yemeni: { male: 'ar-YE-SalehNeural', female: 'ar-YE-MaryamNeural' },
  french: { male: 'fr-FR-HenriNeural', female: 'fr-FR-DeniseNeural' },
  english: { male: 'en-US-AndrewNeural', female: 'en-US-EmmaNeural' },
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = (
      process.env.APP_URL ||
      `${req.protocol}://${req.get('host') || 'localhost:3000'}`
    ).replace(/\/+$/, '');
    res
      .type('text/plain')
      .send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = (
      process.env.APP_URL ||
      `${req.protocol}://${req.get('host') || 'localhost:3000'}`
    ).replace(/\/+$/, '');
    const lastmod = new Date().toISOString().split('T')[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.type('application/xml').send(xml);
  });

  app.post('/api/tts/generate', async (req: Request, res: Response) => {
    try {
      const {
        text,
        voiceName = 'Kore',
        neuralVoice = 'ar-SA-ZariyahNeural',
        basePitchHz = 0,
        pitchOffsetHz = 0,
        rateOffsetPct = 0,
        isCartoon = false,
        voicePersonaPrompt = '',
        dialectLabel = 'العربية الفصحى',
        dialectPrompt = 'Modern Standard Arabic (Fusha) with crisp classical pronunciation',
        toneLabel = 'سردي دافئ',
        tonePrompt = 'Natural, clear, engaging studio voice',
        customStyle = '',
        speed = 1.0,
        expressiveness = 60,
        model = 'free-neural',
      } = req.body ?? {};

      if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'يرجى إدخال النص المراد تحويله إلى صوت.' });
        return;
      }

      const trimmedText = text.trim();

      const safeModel = ALLOWED_TTS_MODELS.has(model) ? model : 'free-neural';
      const numericSpeed = Math.min(1.6, Math.max(0.6, Number(speed) || 1.0));
      const numericExpr = Math.min(100, Math.max(0, Number(expressiveness) || 60));

      if (safeModel === 'free-neural') {
        const exprScale = 0.5 + (numericExpr / 100) * 0.9;
        const totalPitch = isCartoon
          ? (Number(basePitchHz) || 0) + (Number(pitchOffsetHz) || 0) * 0.5
          : (Number(basePitchHz) || 0) + (Number(pitchOffsetHz) || 0) * exprScale;
        const result = await synthesizeFreeSpeech(
          trimmedText,
          neuralVoice,
          numericSpeed,
          Number(rateOffsetPct) || 0,
          totalPitch,
          Boolean(isCartoon)
        );
        res.json({
          audioBase64: result.audioBase64,
          mimeType: result.mimeType,
          model: 'free-neural',
          voiceName: neuralVoice,
        });
        return;
      }

      const safeVoice = ALLOWED_GEMINI_VOICES.has(voiceName) ? voiceName : 'Kore';
      const styleParts = [
        `Language & Dialect: ${dialectPrompt} (${dialectLabel}).`,
        `Vocal Tone: ${tonePrompt} (${toneLabel}).`,
        voicePersonaPrompt ? `Voice Persona: ${voicePersonaPrompt}.` : '',
        `Pacing: ${buildSpeedDescriptor(numericSpeed)}.`,
        `Delivery Stability & Expression: ${buildExpressivenessDescriptor(numericExpr)}.`,
        typeof customStyle === 'string' && customStyle.trim()
          ? `Additional Direction: ${customStyle.trim()}.`
          : '',
        'Pronounce Arabic words naturally and authentically according to the specified dialect.',
      ].filter(Boolean);

      const ai = getAiClient('v1beta');
      const response = await ai.models.generateContent({
        model: safeModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: trimmedText,
                speechMetadata: {
                  style: styleParts.join(' '),
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: safeVoice },
            },
          },
        },
      });

      const audio = extractAudioBase64(response);
      if (!audio) {
        res.status(502).json({
          error: 'لم يُرجع محرك الصوت بيانات صوتية صالحة. يرجى تعديل النص والمحاولة مجدداً.',
        });
        return;
      }

      res.json({
        audioBase64: audio.data,
        mimeType: audio.mimeType,
        model: safeModel,
        voiceName: safeVoice,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/tts/dialogue', async (req: Request, res: Response) => {
    try {
      const {
        speaker1,
        speaker2,
        lines,
        dialectPrompt = 'Modern Standard Arabic (Fusha) or natural conversational Arabic',
        speed = 1.0,
        model = 'free-neural',
      } = req.body ?? {};

      if (!speaker1?.name || !speaker2?.name || !Array.isArray(lines) || lines.length === 0) {
        res.status(400).json({ error: 'يرجى تحديد المتحدثين وإضافة جمل الحوار.' });
        return;
      }

      const validLines = lines.filter(
        (l: any) => typeof l?.text === 'string' && l.text.trim().length > 0
      );

      if (validLines.length === 0) {
        res.status(400).json({ error: 'يجب أن يحتوي الحوار على سطر نصي واحد على الأقل.' });
        return;
      }

      const numericSpeed = Math.min(1.6, Math.max(0.6, Number(speed) || 1.0));

      if (model === 'free-neural') {
        const s1Neural = ALLOWED_NEURAL_VOICES.has(speaker1.neuralVoice)
          ? speaker1.neuralVoice
          : 'ar-SA-HamedNeural';
        const s2Neural = ALLOWED_NEURAL_VOICES.has(speaker2.neuralVoice)
          ? speaker2.neuralVoice
          : 'ar-SA-ZariyahNeural';

        const buffers = await mapWithConcurrency(validLines, 3, async (line: any) => {
          const isFirst = line.speakerId !== 'speaker2';
          const voiceId = isFirst ? s1Neural : s2Neural;
          const pitchHz = isFirst ? Number(speaker1.basePitchHz) || 0 : Number(speaker2.basePitchHz) || 0;
          const cartoonFlag = isFirst ? Boolean(speaker1.isCartoon) : Boolean(speaker2.isCartoon);
          const result = await synthesizeFreeSpeech(
            String(line.text),
            voiceId,
            numericSpeed,
            0,
            pitchHz,
            cartoonFlag
          );
          return Buffer.from(result.audioBase64, 'base64');
        });

        const combined = Buffer.concat(buffers);
        res.json({
          audioBase64: combined.toString('base64'),
          mimeType: 'audio/mpeg',
          model: 'free-neural',
        });
        return;
      }

      const s1Voice = ALLOWED_GEMINI_VOICES.has(speaker1.voiceName) ? speaker1.voiceName : 'Puck';
      const s2Voice = ALLOWED_GEMINI_VOICES.has(speaker2.voiceName) ? speaker2.voiceName : 'Kore';
      const speedDesc = buildSpeedDescriptor(numericSpeed);

      const parts = validLines.map((line: any) => {
        const isFirst = line.speakerId !== 'speaker2';
        const speakerName = isFirst ? String(speaker1.name).trim() : String(speaker2.name).trim();
        const speakerStyle = isFirst ? speaker1.style : speaker2.style;
        const lineTone = typeof line.tone === 'string' && line.tone.trim() ? line.tone.trim() : '';

        return {
          text: `${speakerName}: ${line.text.trim()}`,
          speechMetadata: {
            speaker: speakerName,
            style: [
              `Dialect: ${dialectPrompt}.`,
              speakerStyle || 'Natural podcast speaker',
              lineTone ? `Emotion: ${lineTone}.` : '',
              `Pacing: ${speedDesc}.`,
            ]
              .filter(Boolean)
              .join(' '),
          },
        };
      });

      const ai = getAiClient('v1beta');
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: String(speaker1.name).trim(),
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: s1Voice },
                  },
                },
                {
                  speaker: String(speaker2.name).trim(),
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: s2Voice },
                  },
                },
              ],
            },
          },
        },
      });

      const audio = extractAudioBase64(response);
      if (!audio) {
        res.status(502).json({
          error: 'تعذر توليد الصوت الحواري. يرجى التحقق من نص الحوار والمحاولة مرة أخرى.',
        });
        return;
      }

      res.json({
        audioBase64: audio.data,
        mimeType: audio.mimeType,
        model: 'gemini-3.8-flash-tts',
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/text/enhance', async (req: Request, res: Response) => {
    try {
      const { text, mode = 'diacritize', dialectName = 'العربية الفصحى' } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'يرجى إدخال نص أولاً لتطبيق التحسين الذكي.' });
        return;
      }

      let instruction = '';
      if (mode === 'diacritize') {
        instruction =
          'أضف التشكيل الكامل والدقيق (الحركات: الفتحة والضمة والكسرة والسكون والشدة والتنوين) إلى النص العربي التالي لتحسين جودة النطق الصوتي الآلي، مع الحفاظ التام على نفس الكلمات والمعنى وعلامات الترقيم. أرجع النص المشكول فقط دون أي مقدمات أو شروحات.';
      } else if (mode === 'adapt_dialect') {
        instruction = `أعد صياغة النص التالي ليتحدث بـ (${dialectName}) بشكل طبيعي وسلس وواقعي يناسب الإلقاء الصوتي، مع الحفاظ على المعنى والمحتوى الكامل. أرجع النص المعدل فقط دون أي مقدمات أو تعليقات.`;
      } else {
        instruction =
          'حسّن النص العربي التالي ليكون مثالياً للإلقاء الصوتي الاحترافي: أضف علامات الترقيم والوقفات الطبيعية (...) واضبط الصياغة لتتدفق بسلاسة عند قراءتها بصوت عالٍ. أرجع النص المحسن فقط دون أي مقدمات.';
      }

      const ai = getAiClient('v1beta');
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: text.trim(),
        config: {
          systemInstruction: instruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const resultText = response.text?.trim();
      if (!resultText) {
        res.status(502).json({ error: 'لم يتمكن المساعد الذكي من معالجة النص.' });
        return;
      }

      res.json({ text: resultText });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/voice-clone/analyze', async (req: Request, res: Response) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', genderOverride = 'auto' } = req.body ?? {};
      if (typeof audioBase64 !== 'string' || !audioBase64.trim()) {
        res.status(400).json({ error: 'يرجى تسجيل عينة صوتية أو رفع ملف صوتي أولاً.' });
        return;
      }

      const safeGender =
        genderOverride === 'ذكر' || genderOverride === 'أنثى' ? genderOverride : 'auto';
      const profile = await analyzeReferenceAudioSample(audioBase64, mimeType, safeGender);
      res.json({ profile });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'تعذر تحليل العينة الصوتية. يرجى المحاولة بصوت أوضح.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/tts/clone-generate', async (req: Request, res: Response) => {
    try {
      const {
        text,
        dialectId = 'msa',
        speed = 1.0,
        pitchOffsetHz: tonePitchOffsetHz = 0,
        rateOffsetPct: toneRateOffsetPct = 0,
        profile,
      } = req.body ?? {};

      if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'يرجى إدخال النص المراد قراءته بالصوت المستنسخ.' });
        return;
      }
      if (!profile || typeof profile !== 'object') {
        res.status(400).json({ error: 'بيانات البصمة الصوتية غير مكتملة.' });
        return;
      }

      const safeProfile: ServerVoiceAcousticProfile = {
        pitchHz: Number(profile.pitchHz) || 135,
        detectedGender: profile.detectedGender === 'أنثى' ? 'أنثى' : 'ذكر',
        pitchOffsetHz: Math.max(-24, Math.min(24, Number(profile.pitchOffsetHz) || 0)),
        rateOffsetPct: Math.max(-18, Math.min(18, Number(profile.rateOffsetPct) || 0)),
        formantRatio: Math.max(0.93, Math.min(1.08, Number(profile.formantRatio) || 1.0)),
        bassDb: Math.max(-5, Math.min(6, Number(profile.bassDb) || 0)),
        midDb: Math.max(-4, Math.min(5, Number(profile.midDb) || 0)),
        trebleDb: Math.max(-5, Math.min(6, Number(profile.trebleDb) || 0)),
        cadenceLabel: String(profile.cadenceLabel || 'طبيعي'),
        timbreLabel: String(profile.timbreLabel || 'متوازن'),
        durationSec: Number(profile.durationSec) || 3,
      };

      const dialectPair = CLONE_BASE_VOICES[String(dialectId)] || CLONE_BASE_VOICES.msa;
      const baseNeuralVoice =
        safeProfile.detectedGender === 'أنثى' ? dialectPair.female : dialectPair.male;

      const numericSpeed = Math.min(1.6, Math.max(0.6, Number(speed) || 1.0));
      const combinedRateOffset = safeProfile.rateOffsetPct + (Number(toneRateOffsetPct) || 0) * 0.5;
      const combinedPitch = safeProfile.pitchOffsetHz + (Number(tonePitchOffsetHz) || 0) * 0.5;

      const rawMp3 = await synthesizeFreeSpeechBuffer(
        text.trim(),
        baseNeuralVoice,
        numericSpeed,
        combinedRateOffset,
        combinedPitch,
        true
      );

      const shapedMp3 = await applyVoiceCloneAcousticProfile(rawMp3, safeProfile);

      res.json({
        audioBase64: shapedMp3.toString('base64'),
        mimeType: 'audio/mpeg',
        model: 'free-neural',
        voiceName: baseNeuralVoice,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'تعذر توليد الصوت المستنسخ. يرجى المحاولة مجدداً.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Sawt Studio server running on http://0.0.0.0:${port}`);
  });
}

startServer();

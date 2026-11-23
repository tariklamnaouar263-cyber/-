import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export interface ServerVoiceAcousticProfile {
  pitchHz: number;
  detectedGender: 'ذكر' | 'أنثى';
  pitchOffsetHz: number;
  rateOffsetPct: number;
  formantRatio: number;
  bassDb: number;
  midDb: number;
  trebleDb: number;
  cadenceLabel: string;
  timbreLabel: string;
  durationSec: number;
}

const MIME_TO_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/webm;codecs=opus': 'webm',
  'audio/ogg': 'ogg',
  'audio/ogg;codecs=opus': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/mp4': 'm4a',
  'audio/mp4;codecs=mp4a.40.2': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/3gpp': '3gp',
  'audio/amr': 'amr',
};

function goertzelPower(samples: Float32Array, start: number, len: number, sampleRate: number, targetFreq: number): number {
  const k = Math.round((len * targetFreq) / sampleRate);
  const omega = (2 * Math.PI * k) / len;
  const coeff = 2 * Math.cos(omega);
  let q1 = 0;
  let q2 = 0;
  for (let i = 0; i < len; i++) {
    const q0 = coeff * q1 - q2 + samples[start + i];
    q2 = q1;
    q1 = q0;
  }
  return q1 * q1 + q2 * q2 - q1 * q2 * coeff;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export async function analyzeReferenceAudioSample(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  genderOverride: 'auto' | 'ذكر' | 'أنثى' = 'auto'
): Promise<ServerVoiceAcousticProfile> {
  const cleanBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
  const inputBuffer = Buffer.from(cleanBase64, 'base64');
  if (inputBuffer.length < 1024) {
    throw new Error('الملف الصوتي صغير جداً أو تالف. يرجى تسجيل أو رفع مقطع واضح.');
  }

  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
  const ext = MIME_TO_EXT[mimeType.toLowerCase()] || MIME_TO_EXT[normalizedMime] || 'webm';
  const uid = crypto.randomUUID();
  const inPath = path.join(os.tmpdir(), `sawt-in-${uid}.${ext}`);
  const pcmPath = path.join(os.tmpdir(), `sawt-pcm-${uid}.pcm`);

  try {
    await fs.writeFile(inPath, inputBuffer);

    await execFileAsync(
      'ffmpeg',
      ['-y', '-i', inPath, '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', pcmPath],
      { timeout: 20000 }
    );

    const pcmBuf = await fs.readFile(pcmPath);
    const totalSamples = Math.floor(pcmBuf.length / 2);
    const sampleRate = 16000;
    const durationSec = Math.round((totalSamples / sampleRate) * 10) / 10;

    if (durationSec < 0.8) {
      throw new Error('مدة التسجيل قصيرة جداً. يرجى تسجيل 3 ثوانٍ على الأقل للحصول على بصمة صوتية دقيقة.');
    }

    const maxSamples = Math.min(totalSamples, sampleRate * 45);
    const samples = new Float32Array(maxSamples);
    let globalSqSum = 0;
    for (let i = 0; i < maxSamples; i++) {
      const val = pcmBuf.readInt16LE(i * 2) / 32768;
      samples[i] = val;
      globalSqSum += val * val;
    }

    const globalRms = Math.sqrt(globalSqSum / maxSamples);
    if (globalRms < 0.004) {
      throw new Error('لم يتم رصد صوت واضح في التسجيل. يرجى الاقتراب من الميكروفون أو اختيار ملف أوضح.');
    }

    const frameLen = 480; // 30ms @ 16kHz
    const hop = 240;      // 15ms hop
    const minLag = Math.floor(sampleRate / 330); // ~48
    const maxLag = Math.floor(sampleRate / 72);  // ~222
    const activeThreshold = Math.max(0.012, globalRms * 0.45);

    const f0Values: number[] = [];
    const bassRatios: number[] = [];
    const midRatios: number[] = [];
    const trebleRatios: number[] = [];
    const frameRmsEnvelope: number[] = [];

    for (let start = 0; start + frameLen + maxLag < maxSamples; start += hop) {
      let sq = 0;
      for (let i = 0; i < frameLen; i++) {
        const s = samples[start + i];
        sq += s * s;
      }
      const rms = Math.sqrt(sq / frameLen);
      frameRmsEnvelope.push(rms);

      if (rms < activeThreshold) continue;

      // Autocorrelation F0 estimation
      let bestLag = 0;
      let bestCorr = 0;
      for (let lag = minLag; lag <= maxLag; lag++) {
        let dot = 0;
        let e1 = 0;
        let e2 = 0;
        for (let i = 0; i < frameLen; i++) {
          const a = samples[start + i];
          const b = samples[start + i + lag];
          dot += a * b;
          e1 += a * a;
          e2 += b * b;
        }
        const denom = Math.sqrt(e1 * e2);
        const corr = denom > 1e-8 ? dot / denom : 0;
        if (corr > bestCorr) {
          bestCorr = corr;
          bestLag = lag;
        }
      }

      if (bestCorr >= 0.54 && bestLag > 0) {
        f0Values.push(sampleRate / bestLag);
      }

      // 3-band spectral balance via Goertzel
      const bassE =
        goertzelPower(samples, start, frameLen, sampleRate, 165) +
        goertzelPower(samples, start, frameLen, sampleRate, 250);
      const midE =
        goertzelPower(samples, start, frameLen, sampleRate, 950) +
        goertzelPower(samples, start, frameLen, sampleRate, 1550) +
        goertzelPower(samples, start, frameLen, sampleRate, 2200);
      const trebleE =
        goertzelPower(samples, start, frameLen, sampleRate, 3800) +
        goertzelPower(samples, start, frameLen, sampleRate, 5200);

      const totalE = bassE + midE + trebleE + 1e-9;
      bassRatios.push(bassE / totalE);
      midRatios.push(midE / totalE);
      trebleRatios.push(trebleE / totalE);
    }

    if (f0Values.length < 4 && bassRatios.length < 5) {
      throw new Error('تعذر استخلاص نبرة صوتية واضحة من التسجيل. جرّب التحدث بنبرة طبيعية لمدة 4 إلى 10 ثوانٍ.');
    }

    const medianF0 = f0Values.length >= 4 ? computeMedian(f0Values) : 145;
    const pitchHz = Math.round(clamp(medianF0, 78, 320));

    const detectedGender: 'ذكر' | 'أنثى' =
      genderOverride === 'ذكر' || genderOverride === 'أنثى'
        ? genderOverride
        : pitchHz < 164
          ? 'ذكر'
          : 'أنثى';

    const referenceNormHz = detectedGender === 'ذكر' ? 124 : 206;
    const rawPitchOffset = Math.round((pitchHz - referenceNormHz) * 0.42);
    const pitchOffsetHz = clamp(rawPitchOffset, -22, 24);

    // Estimate speaking cadence (syllable envelope transitions per active second)
    let syllableTransitions = 0;
    let activeFrames = 0;
    const envSmooth: number[] = frameRmsEnvelope.map((v, idx) => {
      const prev = frameRmsEnvelope[idx - 1] ?? v;
      const next = frameRmsEnvelope[idx + 1] ?? v;
      return (prev + v + next) / 3;
    });
    for (let i = 1; i < envSmooth.length - 1; i++) {
      if (envSmooth[i] > activeThreshold) {
        activeFrames++;
        if (envSmooth[i] > envSmooth[i - 1] && envSmooth[i] >= envSmooth[i + 1] && envSmooth[i] > globalRms * 0.85) {
          syllableTransitions++;
        }
      }
    }
    const activeSeconds = Math.max(0.6, (activeFrames * hop) / sampleRate);
    const syllablesPerSec = syllableTransitions / activeSeconds;
    const rateOffsetPct = clamp(Math.round((syllablesPerSec - 3.6) * 4.5), -14, 14);

    const avgBass = bassRatios.length ? computeMedian(bassRatios) : 0.42;
    const avgMid = midRatios.length ? computeMedian(midRatios) : 0.42;
    const avgTreble = trebleRatios.length ? computeMedian(trebleRatios) : 0.16;

    const bassDb = clamp(Math.round((avgBass - 0.38) * 18 * 10) / 10, -4.5, 5.5);
    const midDb = clamp(Math.round((avgMid - 0.40) * 14 * 10) / 10, -3.5, 4.0);
    const trebleDb = clamp(Math.round((avgTreble - 0.14) * 20 * 10) / 10, -4.5, 5.0);

    // Subtle vocal tract / formant shift preserving natural clarity
    const warmthDelta = (avgTreble - avgBass) * 0.12;
    const pitchDelta = (pitchHz - referenceNormHz) / 1800;
    const formantRatio = clamp(
      Math.round((1.0 + warmthDelta + pitchDelta) * 1000) / 1000,
      0.93,
      1.08
    );

    const cadenceLabel =
      rateOffsetPct <= -5
        ? 'هادئ ومتزن'
        : rateOffsetPct >= 5
          ? 'حيوي وسريع'
          : 'طبيعي متوازن';

    const timbreLabel =
      bassDb >= 2.0
        ? 'عميق ودافئ'
        : trebleDb >= 2.0
          ? 'مشرق وواضح'
          : 'رخيم ومتوازن';

    return {
      pitchHz,
      detectedGender,
      pitchOffsetHz,
      rateOffsetPct,
      formantRatio,
      bassDb,
      midDb,
      trebleDb,
      cadenceLabel,
      timbreLabel,
      durationSec,
    };
  } finally {
    await fs.unlink(inPath).catch(() => {});
    await fs.unlink(pcmPath).catch(() => {});
  }
}

export async function applyVoiceCloneAcousticProfile(
  mp3Buffer: Buffer,
  profile: ServerVoiceAcousticProfile
): Promise<Buffer> {
  const uid = crypto.randomUUID();
  const inMp3 = path.join(os.tmpdir(), `sawt-tts-${uid}.mp3`);
  const outMp3 = path.join(os.tmpdir(), `sawt-cloned-${uid}.mp3`);

  try {
    await fs.writeFile(inMp3, mp3Buffer);

    const formant = clamp(Number(profile.formantRatio) || 1.0, 0.93, 1.08);
    const tempoComp = clamp(1 / formant, 0.9, 1.1).toFixed(4);
    const bassDb = clamp(Number(profile.bassDb) || 0, -5, 6).toFixed(1);
    const midDb = clamp(Number(profile.midDb) || 0, -4, 5).toFixed(1);
    const trebleDb = clamp(Number(profile.trebleDb) || 0, -5, 6).toFixed(1);

    const filterGraph = [
      'highpass=f=70',
      `asetrate=${Math.round(24000 * formant)}`,
      'aresample=24000',
      `atempo=${tempoComp}`,
      `equalizer=f=180:width_type=o:width=1.2:g=${bassDb}`,
      `equalizer=f=1300:width_type=o:width=1.4:g=${midDb}`,
      `equalizer=f=4400:width_type=o:width=1.5:g=${trebleDb}`,
      'dynaudnorm=f=150:g=9',
    ].join(',');

    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        inMp3,
        '-af',
        filterGraph,
        '-codec:a',
        'libmp3lame',
        '-b:a',
        '128k',
        outMp3,
      ],
      { timeout: 25000 }
    );

    const processed = await fs.readFile(outMp3);
    return processed.length > 0 ? processed : mp3Buffer;
  } catch (err) {
    console.warn('[VoiceClone DSP fallback]', err instanceof Error ? err.message : err);
    return mp3Buffer;
  } finally {
    await fs.unlink(inMp3).catch(() => {});
    await fs.unlink(outMp3).catch(() => {});
  }
}

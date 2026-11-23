import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AudioLines,
  Check,
  Loader2,
  Mic,
  Play,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { ARABIC_DIALECTS } from '../data/voices';
import {
  AudioTrackItem,
  ClonedVoiceProfile,
  DialectId,
} from '../types/tts';

interface VoiceCloneStudioProps {
  clonedVoices: ClonedVoiceProfile[];
  onSaveClonedVoice: (voice: ClonedVoiceProfile) => void;
  onDeleteClonedVoice: (id: string) => void;
  onUseInMainStudio: (voice: ClonedVoiceProfile) => void;
  onAudioGenerated: (track: AudioTrackItem) => void;
}

type CaptureMode = 'record' | 'upload';

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function encodeFloat32ToWavBlob(chunks: Float32Array[], sampleRate: number): Blob {
  let totalLength = 0;
  for (const ch of chunks) totalLength += ch.length;

  const buffer = new ArrayBuffer(44 + totalLength * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalLength * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true);  // Linear PCM
  view.setUint16(22, 1, true);  // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalLength * 2, true);

  let offset = 44;
  for (const ch of chunks) {
    for (let i = 0; i < ch.length; i++) {
      const clamped = Math.max(-1, Math.min(1, ch[i]));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function getMobileMicErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'تم رفض إذن الميكروفون. على الهاتف: اضغط على أيقونة القفل أو الإعدادات بجانب رابط الموقع في المتصفح ثم فعّل «الميكروفون (السماح)»، أو استخدم خيار «رفع ملف صوتي» أو تسجيل الصوت من تطبيق المسجل.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'لم يتم العثور على ميكروفون متصل بهذا الجهاز. يمكنك رفع تسجيل صوتي جاهز من الهاتف.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'الميكروفون قيد الاستخدام حالياً من طرف تطبيق آخر (مثل مكالمة أو مسجل). أغلقه ثم أعد المحاولة.';
  }
  if (name === 'SecurityError') {
    return 'يجب فتح الموقع عبر اتصال آمن HTTPS لتشغيل الميكروفون على الهاتف.';
  }
  return 'تعذر تشغيل الميكروفون على هذا المتصفح. يمكنك السماح بالميكروفون من إعدادات المتصفح أو رفع ملف صوتي مباشرة.';
}

export function VoiceCloneStudio({
  clonedVoices,
  onSaveClonedVoice,
  onDeleteClonedVoice,
  onUseInMainStudio,
  onAudioGenerated,
}: VoiceCloneStudioProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('record');
  const [cloneName, setCloneName] = useState('صوتي المستنسخ');
  const [preferredDialect, setPreferredDialect] = useState<DialectId>('msa');
  const [genderOverride, setGenderOverride] = useState<'auto' | 'ذكر' | 'أنثى'>('auto');

  // Audio capture state
  const [isRecording, setIsRecording] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micLevels, setMicLevels] = useState<number[]>(() => Array(24).fill(0.14));
  const [sampleBase64, setSampleBase64] = useState<string | null>(null);
  const [sampleMimeType, setSampleMimeType] = useState<string>('audio/webm');
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [sampleFileName, setSampleFileName] = useState<string | null>(null);

  // Analysis & test synthesis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeSuccessMsg, setAnalyzeSuccessMsg] = useState<string | null>(null);

  const [activeCloneId, setActiveCloneId] = useState<string>(clonedVoices[0]?.id ?? '');
  const [testText, setTestText] = useState<string>(ARABIC_DIALECTS[0].sampleScript);
  const [testDialect, setTestDialect] = useState<DialectId>('msa');
  const [testSpeed, setTestSpeed] = useState<number>(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const pcmFallbackChunksRef = useRef<Float32Array[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const usingWavFallbackRef = useRef(false);

  useEffect(() => {
    if (clonedVoices.length > 0 && !clonedVoices.some((v) => v.id === activeCloneId)) {
      setActiveCloneId(clonedVoices[0].id);
      setTestDialect(clonedVoices[0].preferredDialect);
    }
  }, [clonedVoices, activeCloneId]);

  useEffect(() => {
    return () => {
      cleanupRecordingResources();
      if (sampleUrl) URL.revokeObjectURL(sampleUrl);
    };
  }, []);

  const cleanupRecordingResources = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (scriptNodeRef.current) {
      try {
        scriptNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      scriptNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const setSampleAudioFromBlob = (blob: Blob, labelName: string) => {
    if (sampleUrl) URL.revokeObjectURL(sampleUrl);
    const url = URL.createObjectURL(blob);
    setSampleUrl(url);
    setSampleMimeType(blob.type || 'audio/wav');
    setSampleFileName(labelName);
    setAnalyzeError(null);
    setAnalyzeSuccessMsg(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setSampleBase64(base64 || null);
    };
    reader.readAsDataURL(blob);
  };

  const startRecording = async () => {
    setAnalyzeError(null);
    setAnalyzeSuccessMsg(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setAnalyzeError(
        'متصفحك الحالي لا يدعم الوصول للميكروفون داخل هذه الصفحة. جرّب فتح الموقع في Chrome أو Safari أو ارفع ملفاً صوتياً.'
      );
      return;
    }

    setIsRequestingMic(true);

    try {
      // Request mic directly on user tap (essential for iOS Safari & Android Chrome)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      audioCtxRef.current = ctx;

      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);

      // Always capture backup PCM frames so quirky mobile MediaRecorders never leave 0 bytes
      pcmFallbackChunksRef.current = [];
      const scriptNode = ctx.createScriptProcessor(4096, 1, 1);
      scriptNode.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        pcmFallbackChunksRef.current.push(new Float32Array(input));
      };
      src.connect(scriptNode);
      // Connect through muted gain node so mobile browsers keep processing audio frames
      const zeroGain = ctx.createGain();
      zeroGain.gain.value = 0;
      scriptNode.connect(zeroGain);
      zeroGain.connect(ctx.destination);
      scriptNodeRef.current = scriptNode;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(freqData);
        const bars = Array.from({ length: 24 }, (_, idx) => {
          const val = freqData[idx % freqData.length] / 255;
          return Math.max(0.12, Math.min(1, val * 1.45));
        });
        setMicLevels(bars);
        rafRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      usingWavFallbackRef.current = false;
      let recorder: MediaRecorder | null = null;

      if (typeof MediaRecorder !== 'undefined') {
        const mimeOptions = [
          'audio/mp4',
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/ogg',
        ];
        const supportedMime = mimeOptions.find((m) => {
          try {
            return MediaRecorder.isTypeSupported(m);
          } catch {
            return false;
          }
        });

        try {
          recorder = supportedMime
            ? new MediaRecorder(stream, { mimeType: supportedMime })
            : new MediaRecorder(stream);
        } catch {
          try {
            recorder = new MediaRecorder(stream);
          } catch {
            recorder = null;
          }
        }
      }

      if (recorder) {
        chunksRef.current = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            chunksRef.current.push(ev.data);
          }
        };

        recorder.onstop = () => {
          const detectedType =
            chunksRef.current[0]?.type || recorder?.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: detectedType });
          const sampleRate = ctx.sampleRate || 44100;
          const pcmSnapshot = pcmFallbackChunksRef.current;

          cleanupRecordingResources();
          setIsRecording(false);
          setMicLevels(Array(24).fill(0.14));

          if (blob.size > 600) {
            setSampleAudioFromBlob(blob, 'تسجيل الميكروفون المباشر');
          } else if (pcmSnapshot.length > 0) {
            const wavBlob = encodeFloat32ToWavBlob(pcmSnapshot, sampleRate);
            setSampleAudioFromBlob(wavBlob, 'تسجيل الميكروفون (WAV)');
          } else {
            setAnalyzeError('لم يتم التقاط أي صوت. حاول التحدث بصوت أوضح لمدة 4 ثوانٍ.');
          }
        };

        mediaRecorderRef.current = recorder;
        try {
          recorder.start(400);
        } catch {
          recorder.start();
        }
      } else {
        usingWavFallbackRef.current = true;
      }

      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      cleanupRecordingResources();
      setIsRecording(false);
      setAnalyzeError(getMobileMicErrorMessage(err));
    } finally {
      setIsRequestingMic(false);
    }
  };

  const stopRecording = () => {
    if (usingWavFallbackRef.current || !mediaRecorderRef.current) {
      const sampleRate = audioCtxRef.current?.sampleRate || 44100;
      const pcmSnapshot = pcmFallbackChunksRef.current;
      cleanupRecordingResources();
      setIsRecording(false);
      setMicLevels(Array(24).fill(0.14));
      if (pcmSnapshot.length > 0) {
        const wavBlob = encodeFloat32ToWavBlob(pcmSnapshot, sampleRate);
        setSampleAudioFromBlob(wavBlob, 'تسجيل الميكروفون (WAV)');
      }
      return;
    }

    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setAnalyzeError('حجم الملف يتجاوز 15 ميغابايت. يرجى اختيار مقطع صوتي أقصر (5 إلى 30 ثانية).');
      return;
    }
    setSampleAudioFromBlob(file, file.name);
  };

  const handleAnalyzeAndCreateClone = async () => {
    if (!sampleBase64 || isAnalyzing) return;
    setAnalyzeError(null);
    setAnalyzeSuccessMsg(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/voice-clone/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: sampleBase64,
          mimeType: sampleMimeType,
          genderOverride,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر تحليل الصوت.');
      }

      const cleanName = cloneName.trim() || `صوت مستنسخ ${clonedVoices.length + 1}`;
      const newClone: ClonedVoiceProfile = {
        id: `clone-${Date.now()}`,
        nameAr: cleanName,
        preferredDialect,
        genderOverride,
        profile: data.profile,
        createdAt: Date.now(),
      };

      onSaveClonedVoice(newClone);
      setActiveCloneId(newClone.id);
      setTestDialect(preferredDialect);
      const sampleScript = ARABIC_DIALECTS.find((d) => d.id === preferredDialect)?.sampleScript;
      if (sampleScript) setTestText(sampleScript);
      setAnalyzeSuccessMsg(
        `تم استخراج البصمة الصوتية لـ «${cleanName}» بنجاح (${data.profile.pitchHz} Hz · ${data.profile.timbreLabel}).`
      );
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحليل البصمة الصوتية.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeClone = clonedVoices.find((v) => v.id === activeCloneId) ?? clonedVoices[0] ?? null;
  const activeDialectObj = ARABIC_DIALECTS.find((d) => d.id === testDialect) ?? ARABIC_DIALECTS[0];
  const promptDialectObj = ARABIC_DIALECTS.find((d) => d.id === preferredDialect) ?? ARABIC_DIALECTS[0];

  const handleSynthesizeWithClone = async () => {
    if (!activeClone || !testText.trim() || isSynthesizing) return;
    setSynthError(null);
    setIsSynthesizing(true);

    try {
      const res = await fetch('/api/tts/clone-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText.trim(),
          dialectId: testDialect,
          speed: testSpeed,
          profile: activeClone.profile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر توليد الصوت بالنسخة المستنسخة.');
      }

      const words = testText.trim().split(/\s+/).length;
      const track: AudioTrackItem = {
        id: `cloned-track-${Date.now()}`,
        title: `${activeClone.nameAr}: ${testText.trim().slice(0, 42)}${testText.trim().length > 42 ? '...' : ''}`,
        text: testText.trim(),
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/mpeg',
        voiceNameAr: `${activeClone.nameAr} (مستنسخ)`,
        geminiVoice: 'Charon',
        dialectNameAr: activeDialectObj.nameAr,
        toneNameAr: activeClone.profile.timbreLabel,
        speed: testSpeed,
        expressiveness: 70,
        model: 'free-neural',
        durationSec: Math.max(1, Math.round(words / 2.2 / testSpeed)),
        createdAt: Date.now(),
        isCloned: true,
      };

      onAudioGenerated(track);
    } catch (err) {
      setSynthError(err instanceof Error ? err.message : 'حدث خطأ أثناء توليد الصوت المستنسخ.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left/Main Card: Capture Reference Voice & Extract Acoustic Fingerprint */}
        <section className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827]">
          <div className="border-b border-slate-200 dark:border-slate-800/90 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    استنساخ الصوت بالبصمة الصوتية مجاناً
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    سجّل صوتك من الهاتف أو الكمبيوتر مباشرة (أو ارفع ملفاً) لاستخلاص نبرتك وإنشاء نسختك الصوتية.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {/* Clone Identity Settings */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="clone-name-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  اسم الصوت المستنسخ
                </label>
                <input
                  id="clone-name-input"
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="مثال: صوتي الشخصي"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="clone-dialect-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  اللهجة أو اللغة الأساسية
                </label>
                <select
                  id="clone-dialect-select"
                  value={preferredDialect}
                  onChange={(e) => setPreferredDialect(e.target.value as DialectId)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
                >
                  {ARABIC_DIALECTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="clone-gender-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  طبقة الصوت
                </label>
                <select
                  id="clone-gender-select"
                  value={genderOverride}
                  onChange={(e) => setGenderOverride(e.target.value as 'auto' | 'ذكر' | 'أنثى')}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
                >
                  <option value="auto">تحديد تلقائي بالتحليل</option>
                  <option value="ذكر">صوت رجالي</option>
                  <option value="أنثى">صوت نسائي</option>
                </select>
              </div>
            </div>

            {/* Capture Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 dark:bg-[#0D1322] dark:border dark:border-slate-800 p-1">
              <button
                type="button"
                onClick={() => setCaptureMode('record')}
                className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  captureMode === 'record'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                <span>تسجيل بالميكروفون</span>
              </button>
              <button
                type="button"
                onClick={() => setCaptureMode('upload')}
                className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  captureMode === 'upload'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>رفع ملف صوتي</span>
              </button>
            </div>

            {captureMode === 'record' ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-[#0D1322] p-4">
                <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/60 dark:border-indigo-500/20 dark:bg-indigo-950/20 p-3">
                  <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    نص مقترح اقرأه بصوتك الطبيعي أثناء التسجيل (5–15 ثانية):
                  </p>
                  <p
                    dir={promptDialectObj.langCode === 'ar' ? 'rtl' : 'ltr'}
                    className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200"
                  >
                    {promptDialectObj.sampleScript}
                  </p>
                </div>

                {/* Real-time Audio Meter */}
                <div className="flex h-12 items-center justify-center gap-1 px-2" dir="ltr">
                  {micLevels.map((lvl, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        isRecording
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ height: `${Math.round(lvl * 100)}%` }}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                    {formatTimer(recordSeconds)}
                  </span>

                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 whitespace-nowrap"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>إيقاف التسجيل وحفظ العينة</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isRequestingMic}
                      onClick={startRecording}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-60 whitespace-nowrap"
                    >
                      {isRequestingMic ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>جاري فتح الميكروفون...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span>اضغط للتسجيل بالميكروفون</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Native mobile microphone recording fallback input */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>في حال عدم توفر زر التسجيل في تطبيق مدمج:</span>
                  <label className="cursor-pointer font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                    <span>تسجيل أو اختيار ملف من الهاتف</span>
                    <input
                      type="file"
                      accept="audio/*"
                      capture="user"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-indigo-300 bg-indigo-50/30 px-4 py-8 text-center transition-colors hover:border-indigo-500 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-[#0D1322] dark:hover:border-indigo-500/70">
                <Upload className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
                <span className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                  اختر ملفاً صوتياً من جهازك أو هاتفك
                </span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  يدعم MP3, WAV, M4A, OGG, WEBM, 3GP (أفضل مدة من 5 إلى 30 ثانية)
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            )}

            {/* Recorded / Uploaded Sample Preview */}
            {sampleUrl && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0D1322] p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                    العينة المختارة: {sampleFileName}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                    جاهزة للتحليل
                  </span>
                </div>
                <audio controls src={sampleUrl} className="h-9 w-full" />
              </div>
            )}

            {analyzeError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 text-xs leading-relaxed font-medium text-red-700 dark:text-red-300">
                {analyzeError}
              </div>
            )}

            {analyzeSuccessMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>{analyzeSuccessMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!sampleBase64 || isAnalyzing || isRecording}
              onClick={handleAnalyzeAndCreateClone}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري استخلاص البصمة الصوتية...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>تحليل البصمة وحفظ الصوت المستنسخ</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Test Cloned Voice & Saved Clones Library */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/90 pb-3.5">
              <Volume2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                نطق النص بالصوت المستنسخ
              </h2>
            </div>

            {clonedVoices.length === 0 ? (
              <div className="py-8 text-center">
                <AudioLines className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  لم تقم باستنساخ أي صوت بعد
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  سجّل صوتك أو ارفع عينة ثم اضغط على «تحليل البصمة وحفظ الصوت المستنسخ».
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="active-clone-select"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      الصوت المستنسخ
                    </label>
                    <select
                      id="active-clone-select"
                      value={activeClone?.id ?? ''}
                      onChange={(e) => setActiveCloneId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
                    >
                      {clonedVoices.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.nameAr} ({cv.profile.pitchHz} Hz)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="clone-test-dialect"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      اللهجة أو اللغة
                    </label>
                    <select
                      id="clone-test-dialect"
                      value={testDialect}
                      onChange={(e) => setTestDialect(e.target.value as DialectId)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
                    >
                      {ARABIC_DIALECTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="clone-test-text"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    اكتب أي نص ليقرأه الصوت المستنسخ (بدون حدود)
                  </label>
                  <textarea
                    id="clone-test-text"
                    dir={activeDialectObj.langCode === 'ar' ? 'rtl' : 'ltr'}
                    rows={4}
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="اكتب أي جملة أو قصة ليقرأها صوتك المستنسخ..."
                    className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-[#0D1322] dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">سرعة النطق</span>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums" dir="ltr">
                      {testSpeed.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={1.5}
                    step={0.05}
                    value={testSpeed}
                    onChange={(e) => setTestSpeed(parseFloat(e.target.value))}
                    className="studio-slider mt-2 w-full"
                    dir="ltr"
                  />
                </div>

                {synthError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                    {synthError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={!testText.trim() || isSynthesizing}
                  onClick={handleSynthesizeWithClone}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جاري توليد الصوت المستنسخ...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>توليد والاستماع بالصوت المستنسخ</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {clonedVoices.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/90 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    الأصوات المستنسخة المحفوظة ({clonedVoices.length})
                  </h3>
                </div>
              </div>

              <div className="mt-3.5 space-y-3">
                {clonedVoices.map((cv) => {
                  const isActive = activeClone?.id === cv.id;
                  const dialectLabel =
                    ARABIC_DIALECTS.find((d) => d.id === cv.preferredDialect)?.nameAr ?? 'الفصحى';
                  return (
                    <div
                      key={cv.id}
                      className={`rounded-xl border p-3.5 transition-colors ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/40 dark:border-indigo-500/70 dark:bg-indigo-950/20'
                          : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-[#0D1322]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {cv.nameAr}
                          </h4>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <span>{cv.profile.detectedGender}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                              {cv.profile.pitchHz} Hz
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>{cv.profile.timbreLabel}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{cv.profile.cadenceLabel}</span>
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            المرجع: <span className="font-mono tabular-nums">{cv.profile.durationSec}s</span> · {dialectLabel}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteClonedVoice(cv.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          aria-label="حذف الصوت المستنسخ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCloneId(cv.id);
                            setTestDialect(cv.preferredDialect);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                        >
                          <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>اختيار للتجربة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUseInMainStudio(cv)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 whitespace-nowrap"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>استخدام في الاستوديو</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

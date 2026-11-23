import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Eraser,
  Languages,
  Loader2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react';
import { ARABIC_DIALECTS, VOICE_PERSONAS, VOICE_TONES } from '../data/voices';
import {
  AudioTrackItem,
  ClonedVoiceProfile,
  DialectId,
  ToneId,
  TtsModelId,
} from '../types/tts';
import { copyTextToClipboard, downloadAudioFile, getAudioExtension } from '../utils/audio';
import { FaqSeoSection } from './FaqSeoSection';

interface TextToSpeechStudioProps {
  text: string;
  onTextChange: (val: string) => void;
  selectedVoiceId: string;
  onSelectVoiceId: (id: string) => void;
  selectedDialectId: DialectId;
  onSelectDialectId: (id: DialectId) => void;
  selectedToneId: ToneId;
  onSelectToneId: (id: ToneId) => void;
  customStyle: string;
  onCustomStyleChange: (val: string) => void;
  speed: number;
  onSpeedChange: (val: number) => void;
  expressiveness: number;
  onExpressivenessChange: (val: number) => void;
  model: TtsModelId;
  onModelChange: (val: TtsModelId) => void;
  onAudioGenerated: (track: AudioTrackItem) => void;
  latestTrack: AudioTrackItem | null;
  onPlayTrack: (track: AudioTrackItem) => void;
  onOpenPrivacy: () => void;
  clonedVoices?: ClonedVoiceProfile[];
}

export function TextToSpeechStudio({
  text,
  onTextChange,
  selectedVoiceId,
  onSelectVoiceId,
  selectedDialectId,
  onSelectDialectId,
  selectedToneId,
  onSelectToneId,
  customStyle,
  onCustomStyleChange,
  speed,
  onSpeedChange,
  expressiveness,
  onExpressivenessChange,
  model,
  onModelChange,
  onAudioGenerated,
  latestTrack,
  onPlayTrack,
  onOpenPrivacy,
  clonedVoices = [],
}: TextToSpeechStudioProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [enhancingMode, setEnhancingMode] = useState<'diacritize' | 'adapt_dialect' | 'polish' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const selectedClonedVoice =
    clonedVoices.find((c) => c.id === selectedVoiceId) ?? null;
  const selectedVoice =
    VOICE_PERSONAS.find((v) => v.id === selectedVoiceId) ?? VOICE_PERSONAS[0];
  const selectedDialect =
    ARABIC_DIALECTS.find((d) => d.id === selectedDialectId) ?? ARABIC_DIALECTS[0];
  const selectedTone =
    VOICE_TONES.find((t) => t.id === selectedToneId) ?? VOICE_TONES[0];

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 2.2) / speed));

  const storyVoices = VOICE_PERSONAS.filter(
    (v) => v.isStoryteller && v.languageTag === 'ar' && !v.isCartoon && !v.isAnime
  );
  const dialectVoices = VOICE_PERSONAS.filter(
    (v) => !v.isStoryteller && v.languageTag === 'ar' && !v.isCartoon && !v.isAnime
  );
  const animeVoices = VOICE_PERSONAS.filter((v) => v.isAnime);
  const cartoonVoices = VOICE_PERSONAS.filter((v) => v.isCartoon && !v.isAnime);
  const frenchVoices = VOICE_PERSONAS.filter((v) => v.languageTag === 'fr');
  const englishVoices = VOICE_PERSONAS.filter((v) => v.languageTag === 'en');

  const handleCopyScript = async () => {
    if (!text.trim()) return;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1800);
    }
  };

  const handleEnhanceText = async (mode: 'diacritize' | 'adapt_dialect' | 'polish') => {
    if (!text.trim() || enhancingMode || isGenerating) return;
    setErrorMsg(null);
    setEnhancingMode(mode);

    try {
      const res = await fetch('/api/text/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          dialectName: selectedDialect.nameAr,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر تحسين النص.');
      }
      if (data.text) {
        onTextChange(data.text);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة النص.');
    } finally {
      setEnhancingMode(null);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim() || isGenerating) return;
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      if (selectedClonedVoice) {
        const res = await fetch('/api/tts/clone-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            dialectId: selectedDialectId,
            speed,
            pitchOffsetHz: selectedTone.pitchOffsetHz,
            rateOffsetPct: selectedTone.rateOffsetPct,
            profile: selectedClonedVoice.profile,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'فشل توليد الصوت المستنسخ.');
        }

        const snippet = text.trim().slice(0, 48) + (text.trim().length > 48 ? '...' : '');
        const clonedTrack: AudioTrackItem = {
          id: `tts-clone-${Date.now()}`,
          title: snippet,
          text: text.trim(),
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/mpeg',
          voiceNameAr: `${selectedClonedVoice.nameAr} (مستنسخ)`,
          geminiVoice: 'Charon',
          dialectNameAr: selectedDialect.nameAr,
          toneNameAr: selectedTone.nameAr,
          speed,
          expressiveness,
          model: 'free-neural',
          durationSec: estimatedSeconds,
          createdAt: Date.now(),
          isCloned: true,
        };
        onAudioGenerated(clonedTrack);
        return;
      }

      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice.geminiVoice,
          neuralVoice: selectedVoice.neuralVoices[selectedDialectId],
          basePitchHz: selectedVoice.basePitchHz,
          pitchOffsetHz: selectedTone.pitchOffsetHz,
          rateOffsetPct: (selectedVoice.baseRateOffsetPct || 0) + selectedTone.rateOffsetPct,
          isCartoon: Boolean(selectedVoice.isCartoon || selectedVoice.isAnime),
          voicePersonaPrompt: selectedVoice.stylePrompt,
          dialectLabel: selectedDialect.nameAr,
          dialectPrompt: selectedDialect.promptDescription,
          toneLabel: selectedTone.nameAr,
          tonePrompt: selectedTone.promptDescription,
          customStyle,
          speed,
          expressiveness,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل توليد الصوت.');
      }

      const snippet = text.trim().slice(0, 48) + (text.trim().length > 48 ? '...' : '');
      const newTrack: AudioTrackItem = {
        id: `tts-${Date.now()}`,
        title: snippet,
        text: text.trim(),
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/mpeg',
        voiceNameAr: selectedVoice.nameAr,
        geminiVoice: selectedVoice.geminiVoice,
        dialectNameAr: selectedDialect.nameAr,
        toneNameAr: selectedTone.nameAr,
        speed,
        expressiveness,
        model,
        durationSec: estimatedSeconds,
        createdAt: Date.now(),
      };

      onAudioGenerated(newTrack);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء توليد الصوت.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetSettings = () => {
    onSpeedChange(1.0);
    onExpressivenessChange(60);
    onCustomStyleChange('');
    onSelectToneId('storyteller');
    onModelChange('free-neural');
  };

  const alignVoiceWithDialect = (dialectId: DialectId) => {
    if (selectedClonedVoice || selectedVoice.isCartoon) return;
    if (dialectId === 'french' && selectedVoice.languageTag !== 'fr') {
      onSelectVoiceId('henri-french');
    } else if (dialectId === 'english' && selectedVoice.languageTag !== 'en') {
      onSelectVoiceId('andrew-english');
    } else if (
      dialectId !== 'french' &&
      dialectId !== 'english' &&
      (selectedVoice.languageTag === 'fr' || selectedVoice.languageTag === 'en')
    ) {
      onSelectVoiceId('adam-storyteller');
    }
  };

  const handleSelectDialect = (dialectId: DialectId) => {
    onSelectDialectId(dialectId);
    alignVoiceWithDialect(dialectId);
  };

  const handleSelectVoice = (voiceId: string) => {
    onSelectVoiceId(voiceId);
    const v = VOICE_PERSONAS.find((item) => item.id === voiceId);
    if (!v) return;
    if (v.languageTag === 'fr' && selectedDialectId !== 'french') {
      onSelectDialectId('french');
    } else if (v.languageTag === 'en' && selectedDialectId !== 'english') {
      onSelectDialectId('english');
    } else if (
      v.languageTag === 'ar' &&
      (selectedDialectId === 'french' || selectedDialectId === 'english')
    ) {
      onSelectDialectId('msa');
    }
  };

  const applySampleScript = (dialectId: DialectId) => {
    const target = ARABIC_DIALECTS.find((d) => d.id === dialectId);
    if (!target) return;
    handleSelectDialect(dialectId);
    onTextChange(target.sampleScript);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main Script Editor Column */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827]">
          {/* Sample Presets Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/90 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 ml-1 whitespace-nowrap">
                نصوص جاهزة:
              </span>
              {ARABIC_DIALECTS.map((d) => {
                const active = d.id === selectedDialectId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => applySampleScript(d.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {d.nameAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative flex-1 p-5">
            <label htmlFor="tts-script-input" className="sr-only">
              النص المراد تحويله إلى صوت
            </label>
            <textarea
              id="tts-script-input"
              dir={selectedDialect.langCode === 'ar' ? 'rtl' : 'ltr'}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              rows={11}
              placeholder="اكتب أو الصق أي نص بالعربية الفصحى أو اللهجات أو الفرنسية أو الإنجليزية بدون حدود للكلمات..."
              className="w-full resize-none bg-transparent text-base leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Smart Text & Copy Tools Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-[#0D1322] px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!text.trim() || enhancingMode !== null || isGenerating}
                onClick={() => handleEnhanceText('diacritize')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {enhancingMode === 'diacritize' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                )}
                <span>تشكيل تلقائي</span>
              </button>

              <button
                type="button"
                disabled={!text.trim() || enhancingMode !== null || isGenerating}
                onClick={() => handleEnhanceText('adapt_dialect')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50/60 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-500/50 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {enhancingMode === 'adapt_dialect' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                ) : (
                  <Languages className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                )}
                <span>تحويل إلى {selectedDialect.nameAr}</span>
              </button>

              <button
                type="button"
                disabled={!text.trim() || enhancingMode !== null || isGenerating}
                onClick={() => handleEnhanceText('polish')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {enhancingMode === 'polish' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                )}
                <span>تحسين الإلقاء</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!text.trim()}
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                {copiedText ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>نسخ النص</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!text}
                onClick={() => onTextChange('')}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>مسح</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="border-t border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-5 py-3 text-xs font-medium text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Primary Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800/90 px-5 py-4">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums">
                {charCount.toLocaleString('en-US')} حرف
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {wordCount.toLocaleString('en-US')} كلمة
              </span>
              {wordCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                    مدة تقديرية ~{estimatedSeconds} ث
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {latestTrack && !latestTrack.isDialogue && (
                <>
                  <button
                    type="button"
                    onClick={() => onPlayTrack(latestTrack)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <Play className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>استماع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadAudioFile(
                        latestTrack.audioBase64,
                        `${latestTrack.voiceNameAr}-${latestTrack.dialectNameAr}`,
                        latestTrack.mimeType
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 whitespace-nowrap shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>
                      تنزيل الصوت ({getAudioExtension(latestTrack.mimeType).toUpperCase()})
                    </span>
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={!text.trim() || isGenerating}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري توليد الصوت...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>توليد الصوت مجاناً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Voice & Acoustic Settings Panel */}
        <aside className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/90 pb-3.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                إعدادات الصوت واللغة
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetSettings}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              title="إعادة ضبط الإعدادات"
            >
              <RotateCcw className="h-3 w-3" />
              <span>إعادة ضبط</span>
            </button>
          </div>

          <div className="mt-4 space-y-5">
            {/* Voice Persona Grouped Dropdown */}
            <div>
              <label
                htmlFor="voice-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                المتحدث الصوتي (واقعي / كرتون / لغات)
              </label>
              <select
                id="voice-select"
                value={selectedVoiceId}
                onChange={(e) => handleSelectVoice(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
              >
                {clonedVoices.length > 0 && (
                  <optgroup label="الأصوات المستنسخة الخاصة بي">
                    {clonedVoices.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.nameAr} (مستنسخ · {cv.profile.pitchHz} Hz)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="أصوات سرد القصص (آدم وبريان)">
                  {storyVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameAr} · {v.specialty}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="أصوات اللهجات العربية">
                  {dialectVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameAr} · {v.specialty}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="أصوات شخصيات الأنمي">
                  {animeVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameAr} · {v.specialty}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="أصوات كرتون وشخصيات">
                  {cartoonVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameAr} · {v.specialty}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="اللغة الفرنسية (Français)">
                  {frenchVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameAr}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="اللغة الإنجليزية (English)">
                  {englishVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameAr}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {selectedClonedVoice
                  ? `صوت مستنسخ مخصص (${selectedClonedVoice.profile.detectedGender} · ${selectedClonedVoice.profile.pitchHz} Hz · ${selectedClonedVoice.profile.timbreLabel}).`
                  : selectedVoice.description}
              </p>
            </div>

            {/* Arabic Dialects + French + English */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                اللهجة العربية أو اللغة
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {ARABIC_DIALECTS.map((dialect) => {
                  const active = dialect.id === selectedDialectId;
                  return (
                    <button
                      key={dialect.id}
                      type="button"
                      onClick={() => handleSelectDialect(dialect.id)}
                      className={`rounded-lg border px-2.5 py-2 text-right text-xs font-medium transition-colors whitespace-nowrap truncate ${
                        active
                          ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-[#0D1322] dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-white'
                      }`}
                    >
                      {dialect.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone & Emotion */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                نبرة الصوت والأسلوب
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {VOICE_TONES.map((tone) => {
                  const active = tone.id === selectedToneId;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => onSelectToneId(tone.id)}
                      className={`rounded-lg border px-2.5 py-2 text-right text-xs font-medium transition-colors whitespace-nowrap truncate ${
                        active
                          ? 'border-violet-500 bg-violet-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-800 dark:bg-[#0D1322] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-white'
                      }`}
                    >
                      {tone.nameAr}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={customStyle}
                onChange={(e) => onCustomStyleChange(e.target.value)}
                placeholder="توجيه إضافي للنبرة (اختياري)"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-[#0D1322] dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Speaking Speed Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="speed-slider"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  سرعة الإلقاء
                </label>
                <span
                  className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums"
                  dir="ltr"
                >
                  {speed.toFixed(2).replace(/\.00$/, '.0')}x
                </span>
              </div>
              <input
                id="speed-slider"
                type="range"
                min={0.6}
                max={1.6}
                step={0.05}
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="studio-slider mt-2 w-full"
                dir="ltr"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>سريع (1.6x)</span>
                <span>متوازن (1.0x)</span>
                <span>بطيء (0.6x)</span>
              </div>
            </div>

            {/* Expressiveness Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="expr-slider"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  التعبير العاطفي والحيوية
                </label>
                <span
                  className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums"
                  dir="ltr"
                >
                  {expressiveness}%
                </span>
              </div>
              <input
                id="expr-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={expressiveness}
                onChange={(e) => onExpressivenessChange(parseInt(e.target.value, 10))}
                className="studio-slider mt-2 w-full"
                dir="ltr"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>تعبير عالٍ</span>
                <span>ثبات إذاعي</span>
              </div>
            </div>

            {/* Engine Selection */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                محرك التوليد
              </span>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 dark:bg-[#0D1322] dark:border dark:border-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => onModelChange('free-neural')}
                  className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    model === 'free-neural'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  مجاني فوري
                </button>
                <button
                  type="button"
                  onClick={() => onModelChange('gemini-3.8-flash-lite-tts')}
                  className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    model === 'gemini-3.8-flash-lite-tts'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Gemini سريع
                </button>
                <button
                  type="button"
                  onClick={() => onModelChange('gemini-3.8-flash-tts')}
                  className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    model === 'gemini-3.8-flash-tts'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Gemini فائق
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Studio Visual Showcase & SEO FAQ Section */}
      <FaqSeoSection
        compact
        onSelectVoiceCategory={(voiceId, dialectId) => {
          handleSelectVoice(voiceId);
          if (dialectId) {
            onSelectDialectId(dialectId);
            const target = ARABIC_DIALECTS.find((d) => d.id === dialectId);
            if (target) onTextChange(target.sampleScript);
          }
          document
            .getElementById('tts-script-input')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onOpenPrivacy={onOpenPrivacy}
      />
    </div>
  );
}

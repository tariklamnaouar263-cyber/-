import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Loader2,
  MessagesSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { ARABIC_DIALECTS, VOICE_PERSONAS } from '../data/voices';
import { AudioTrackItem, DialectId, DialogueLine } from '../types/tts';
import { copyTextToClipboard, downloadAudioFile, getAudioExtension } from '../utils/audio';

interface DialogueStudioProps {
  onAudioGenerated: (track: AudioTrackItem) => void;
  latestDialogueTrack: AudioTrackItem | null;
}

const INITIAL_LINES: DialogueLine[] = [
  {
    id: 'l1',
    speakerId: 'speaker1',
    text: 'أهلاً بكم في حلقة جديدة من بودكاست تقنية الغد! اليوم حديثنا عن ثورة الأصوات الذكية.',
    tone: 'Enthusiastic podcast host',
  },
  {
    id: 'l2',
    speakerId: 'speaker2',
    text: 'أهلاً فيك! فعلاً التطور اللي صار في فهم اللهجات العربية ونبرة الصوت أصبح مذهل جداً.',
    tone: 'Curious, warm co-host',
  },
];

export function DialogueStudio({
  onAudioGenerated,
  latestDialogueTrack,
}: DialogueStudioProps) {
  const [speaker1VoiceId, setSpeaker1VoiceId] = useState(VOICE_PERSONAS[3].id);
  const [speaker2VoiceId, setSpeaker2VoiceId] = useState(VOICE_PERSONAS[0].id);
  const [dialectId, setDialectId] = useState<DialectId>('msa');
  const [speed, setSpeed] = useState(1.0);
  const [lines, setLines] = useState<DialogueLine[]>(INITIAL_LINES);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const s1Persona = VOICE_PERSONAS.find((v) => v.id === speaker1VoiceId) ?? VOICE_PERSONAS[0];
  const s2Persona = VOICE_PERSONAS.find((v) => v.id === speaker2VoiceId) ?? VOICE_PERSONAS[1];
  const dialect = ARABIC_DIALECTS.find((d) => d.id === dialectId) ?? ARABIC_DIALECTS[0];

  const addLine = () => {
    const last = lines[lines.length - 1];
    const nextSpeaker = last?.speakerId === 'speaker1' ? 'speaker2' : 'speaker1';
    setLines((prev) => [
      ...prev,
      {
        id: `l-${Date.now()}`,
        speakerId: nextSpeaker,
        text: '',
        tone: 'Natural conversational flow',
      },
    ]);
  };

  const updateLine = (id: string, patch: Partial<DialogueLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const insertTagIntoLine = (id: string, tag: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, text: `${l.text}${l.text.endsWith(' ') || !l.text ? '' : ' '}${tag} ` } : l
      )
    );
  };

  const compiledScript = lines
    .filter((l) => l.text.trim())
    .map((l) => `${l.speakerId === 'speaker1' ? s1Persona.nameAr : s2Persona.nameAr}: ${l.text.trim()}`)
    .join('\n');

  const handleCopyDialogue = async () => {
    if (!compiledScript) return;
    const ok = await copyTextToClipboard(compiledScript);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleGenerateDialogue = async () => {
    const nonEmpty = lines.filter((l) => l.text.trim());
    if (nonEmpty.length === 0 || isGenerating) return;
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/tts/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker1: {
            name: s1Persona.nameAr,
            voiceName: s1Persona.geminiVoice,
            neuralVoice: s1Persona.neuralVoices[dialectId],
            basePitchHz: s1Persona.basePitchHz,
            isCartoon: Boolean(s1Persona.isCartoon || s1Persona.isAnime),
            style: s1Persona.stylePrompt,
          },
          speaker2: {
            name: s2Persona.nameAr === s1Persona.nameAr ? `${s2Persona.nameAr} ٢` : s2Persona.nameAr,
            voiceName: s2Persona.geminiVoice,
            neuralVoice: s2Persona.neuralVoices[dialectId],
            basePitchHz: s2Persona.basePitchHz,
            isCartoon: Boolean(s2Persona.isCartoon || s2Persona.isAnime),
            style: s2Persona.stylePrompt,
          },
          lines: nonEmpty,
          dialectPrompt: dialect.promptDescription,
          speed,
          model: 'free-neural',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر توليد الحوار الصوتي.');
      }

      const words = compiledScript.split(/\s+/).length;
      const newTrack: AudioTrackItem = {
        id: `dlg-${Date.now()}`,
        title: `حوار: ${s1Persona.nameAr} و${s2Persona.nameAr}`,
        text: compiledScript,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        voiceNameAr: `${s1Persona.nameAr} و${s2Persona.nameAr}`,
        geminiVoice: s1Persona.geminiVoice,
        dialectNameAr: dialect.nameAr,
        toneNameAr: 'حوار ثنائي',
        speed,
        expressiveness: 75,
        model: 'free-neural',
        durationSec: Math.max(2, Math.round(words / 2.2 / speed)),
        createdAt: Date.now(),
        isDialogue: true,
      };

      onAudioGenerated(newTrack);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء توليد الحوار.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Speakers & Dialect Config Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="s1-voice"
            className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          >
            المتحدث الأول
          </label>
          <select
            id="s1-voice"
            value={speaker1VoiceId}
            onChange={(e) => setSpeaker1VoiceId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
          >
            {VOICE_PERSONAS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nameAr} ({v.gender})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="s2-voice"
            className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            المتحدث الثاني
          </label>
          <select
            id="s2-voice"
            value={speaker2VoiceId}
            onChange={(e) => setSpeaker2VoiceId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
          >
            {VOICE_PERSONAS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nameAr} ({v.gender})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="dlg-dialect"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            لهجة الحوار
          </label>
          <select
            id="dlg-dialect"
            value={dialectId}
            onChange={(e) => setDialectId(e.target.value as DialectId)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-[#0D1322] dark:text-slate-100"
          >
            {ARABIC_DIALECTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="dlg-speed"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              سرعة الحوار
            </label>
            <span
              className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums"
              dir="ltr"
            >
              {speed.toFixed(1)}x
            </span>
          </div>
          <input
            id="dlg-speed"
            type="range"
            min={0.7}
            max={1.4}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="studio-slider mt-3.5 w-full"
            dir="ltr"
          />
        </div>
      </div>

      {/* Dialogue Lines Editor */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/90 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              نص الحوار والبودكاست
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يدعم المؤثرات الصوتية الطبيعية مثل أخذ نفس أو ضحكة خفيفة أثناء الحوار.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDialogue}
              disabled={!compiledScript}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الحوار'}</span>
            </button>

            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة سطر</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {lines.map((line, idx) => {
            const isS1 = line.speakerId === 'speaker1';
            const speakerName = isS1 ? s1Persona.nameAr : s2Persona.nameAr;
            return (
              <div key={line.id} className="p-4 sm:px-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateLine(line.id, {
                          speakerId: isS1 ? 'speaker2' : 'speaker1',
                        })
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                        isS1
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {speakerName}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertTagIntoLine(line.id, '<breath>')}
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        + نفس
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTagIntoLine(line.id, '<laugh>')}
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        + ضحكة
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 1}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 disabled:opacity-30"
                    aria-label="حذف السطر"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={line.text}
                  onChange={(e) => updateLine(line.id, { text: e.target.value })}
                  rows={2}
                  placeholder={`اكتب ما سيقوله ${speakerName}...`}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-[#0D1322] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500"
                />
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="border-t border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-5 py-3 text-xs font-medium text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800/90 px-5 py-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {lines.length} أسطر حوارية · محرك الحوار التعبيري
          </span>

          <div className="flex items-center gap-2.5">
            {latestDialogueTrack && (
              <button
                type="button"
                onClick={() =>
                  downloadAudioFile(
                    latestDialogueTrack.audioBase64,
                    'dialogue-sawt-studio',
                    latestDialogueTrack.mimeType
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  تنزيل الحوار ({getAudioExtension(latestDialogueTrack.mimeType).toUpperCase()})
                </span>
              </button>
            )}

            <button
              type="button"
              disabled={!compiledScript || isGenerating}
              onClick={handleGenerateDialogue}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري توليد الحوار...</span>
                </>
              ) : (
                <>
                  <MessagesSquare className="h-4 w-4" />
                  <span>توليد الحوار الصوتي</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Check, Headphones, Loader2, Play, Search, Sparkles } from 'lucide-react';
import { ARABIC_DIALECTS, VOICE_PERSONAS } from '../data/voices';
import { AudioTrackItem, VoicePersona } from '../types/tts';

interface VoiceLibraryProps {
  selectedVoiceId: string;
  onUseVoice: (voiceId: string) => void;
  onPreviewTrack: (track: AudioTrackItem) => void;
}

type FilterMode = 'all' | 'anime' | 'cartoon' | 'story' | 'intl' | 'أنثى' | 'ذكر';

export function VoiceLibrary({
  selectedVoiceId,
  onUseVoice,
  onPreviewTrack,
}: VoiceLibraryProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredVoices = VOICE_PERSONAS.filter((v) => {
    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'anime'
        ? Boolean(v.isAnime)
        : filterMode === 'story'
          ? Boolean(v.isStoryteller) && v.languageTag === 'ar'
          : filterMode === 'cartoon'
            ? Boolean(v.isCartoon) && !v.isAnime
            : filterMode === 'intl'
              ? v.languageTag === 'fr' || v.languageTag === 'en'
              : v.gender === filterMode);
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      v.nameAr.toLowerCase().includes(q) ||
      v.specialty.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const handlePreviewVoice = async (voice: VoicePersona) => {
    if (previewingId) return;
    setErrorMsg(null);
    setPreviewingId(voice.id);

    try {
      const primaryDialect =
        ARABIC_DIALECTS.find((d) => d.id === voice.recommendedDialects[0]) ??
        ARABIC_DIALECTS[0];

      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voiceName: voice.geminiVoice,
          neuralVoice: voice.neuralVoices[primaryDialect.id],
          basePitchHz: voice.basePitchHz,
          rateOffsetPct: voice.baseRateOffsetPct || 0,
          isCartoon: Boolean(voice.isCartoon || voice.isAnime),
          voicePersonaPrompt: voice.stylePrompt,
          dialectLabel: primaryDialect.nameAr,
          dialectPrompt: primaryDialect.promptDescription,
          toneLabel: voice.specialty,
          tonePrompt: voice.stylePrompt,
          speed: 1.0,
          expressiveness: 65,
          model: 'free-neural',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر تشغيل العينة الصوتية.');
      }

      onPreviewTrack({
        id: `preview-${voice.id}-${Date.now()}`,
        title: `عينة صوتية: ${voice.nameAr}`,
        text: voice.sampleText,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/mpeg',
        voiceNameAr: voice.nameAr,
        geminiVoice: voice.geminiVoice,
        dialectNameAr: primaryDialect.nameAr,
        toneNameAr: voice.specialty,
        speed: 1.0,
        expressiveness: 65,
        model: 'free-neural',
        durationSec: 6,
        createdAt: Date.now(),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر تشغيل العينة.');
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Visual Quick Highlights */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setFilterMode('intl')}
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 text-right transition-colors hover:border-indigo-300 dark:border-slate-800/90 dark:bg-[#111827] dark:hover:border-indigo-500/50"
        >
          <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {!failedImages['intl'] ? (
              <img
                src="/src/assets/images/podcast_dialogue_studio_1795446500438.jpg"
                alt="أصوات فرنسية وإنجليزية وعربية واقعية"
                referrerPolicy="no-referrer"
                onError={() => setFailedImages((p) => ({ ...p, intl: true }))}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-indigo-500">
                <Headphones className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              أصوات فرنسية وإنجليزية وجميع اللهجات العربية
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              متحدثون واقعيون بالفرنسية (Henri, Denise) والإنجليزية (Andrew, Brian, Emma, Ryan) وكل اللهجات العربية.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('cartoon')}
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 text-right transition-colors hover:border-amber-300 dark:border-slate-800/90 dark:bg-[#111827] dark:hover:border-amber-500/50"
        >
          <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {!failedImages['cartoon'] ? (
              <img
                src="/src/assets/images/cartoon_voices_art_1795446500230.jpg"
                alt="أصوات كرتون وشخصيات أنمي"
                referrerPolicy="no-referrer"
                onError={() => setFailedImages((p) => ({ ...p, cartoon: true }))}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-amber-500">
                <Sparkles className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
              قسم أصوات الكرتون وشخصيات الأنمي
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              أصوات شخصيات مرحة وأطفال وعمالقة وسناجب لدبلجة الكرتون بالعربية والفرنسية والإنجليزية مجاناً.
            </p>
          </div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0D1322] dark:border dark:border-slate-800 p-1 w-fit">
          {(
            [
              { id: 'all', label: 'جميع الأصوات' },
              { id: 'anime', label: 'شخصيات أنمي' },
              { id: 'cartoon', label: 'أصوات كرتون' },
              { id: 'story', label: 'سرد قصص (Adam / Brian)' },
              { id: 'intl', label: 'الفرنسية والإنجليزية' },
              { id: 'أنثى', label: 'نسائية' },
              { id: 'ذكر', label: 'رجالية' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filterMode === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، أنمي، كرتون، فرنسي..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-[#0D1322] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Voices Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isPreviewing = previewingId === voice.id;
          const dialectLabels = voice.recommendedDialects
            .map((id) => ARABIC_DIALECTS.find((d) => d.id === id)?.nameAr)
            .filter(Boolean)
            .join(' · ');

          return (
            <div
              key={voice.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/30 dark:border-indigo-500/70 dark:bg-indigo-950/20'
                  : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800/90 dark:bg-[#111827] dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {voice.nameAr}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{voice.gender}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{voice.ageGroup}</span>
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      voice.isAnime
                        ? 'text-violet-600 dark:text-violet-400'
                        : voice.isCartoon
                          ? 'text-amber-600 dark:text-amber-400'
                          : voice.languageTag !== 'ar'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {voice.specialty}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {voice.description}
                </p>

                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  الأنسب لـ:{' '}
                  <span className="text-slate-600 dark:text-slate-300">{dialectLabels}</span>
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/90 pt-4">
                <button
                  type="button"
                  disabled={previewingId !== null}
                  onClick={() => handlePreviewVoice(voice)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                      <span>جاري التحميل</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>سماع عينة</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onUseVoice(voice.id)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>مختار حالياً</span>
                    </>
                  ) : (
                    <span>استخدام الصوت</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

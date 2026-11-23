import { useState } from 'react';
import {
  ArrowUpRight,
  AudioLines,
  Check,
  Copy,
  Download,
  Play,
  Search,
  Trash2,
} from 'lucide-react';
import { AudioTrackItem } from '../types/tts';
import { copyTextToClipboard, downloadAudioFile, formatDuration, getAudioExtension } from '../utils/audio';

interface HistoryViewProps {
  history: AudioTrackItem[];
  onPlayTrack: (track: AudioTrackItem) => void;
  onDeleteTrack: (id: string) => void;
  onLoadIntoStudio: (track: AudioTrackItem) => void;
  onGoToStudio: () => void;
}

export function HistoryView({
  history,
  onPlayTrack,
  onDeleteTrack,
  onLoadIntoStudio,
  onGoToStudio,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = history.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.text.toLowerCase().includes(q) ||
      item.voiceNameAr.includes(q) ||
      item.dialectNameAr.includes(q)
    );
  });

  const handleCopy = async (item: AudioTrackItem) => {
    const ok = await copyTextToClipboard(item.text);
    if (ok) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1600);
    }
  };

  if (history.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
          <AudioLines className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          لا توجد مقاطع صوتية محفوظة بعد
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          كل مقطع صوتي تقوم بتوليده سيظهر هنا تلقائياً لتتمكن من إعادة تشغيله أو نسخه أو تنزيله لاحقاً.
        </p>
        <button
          type="button"
          onClick={onGoToStudio}
          className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          الانتقال إلى استوديو الصوت
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          إجمالي التسجيلات المحفوظة:{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{history.length}</span>
        </p>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في النصوص أو اللهجات..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-[#0D1322] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800/80 dark:border-slate-800/90 dark:bg-[#111827]">
        {filtered.map((item) => {
          const dateLabel = new Intl.DateTimeFormat('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric',
          }).format(new Date(item.createdAt));

          return (
            <div
              key={item.id}
              className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/35 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onPlayTrack(item)}
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500"
                  aria-label="تشغيل المقطع"
                >
                  <Play className="h-3.5 w-3.5 translate-x-[-1px]" />
                </button>

                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                    {item.text}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">{item.voiceNameAr}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{item.dialectNameAr}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{item.toneNameAr}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">{item.speed.toFixed(1)}x</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">{formatDuration(item.durationSec)}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{dateLabel}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>نسخ النص</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadAudioFile(
                      item.audioBase64,
                      `${item.voiceNameAr}-${item.dialectNameAr}`,
                      item.mimeType
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>تنزيل {getAudioExtension(item.mimeType).toUpperCase()}</span>
                </button>

                {!item.isDialogue && (
                  <button
                    type="button"
                    onClick={() => onLoadIntoStudio(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                    title="فتح النص والإعدادات في الاستوديو"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>تعديل</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteTrack(item.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  aria-label="حذف المقطع"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

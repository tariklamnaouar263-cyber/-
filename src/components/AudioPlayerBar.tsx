import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AudioTrackItem } from '../types/tts';
import {
  analyzeAudioWaveform,
  copyTextToClipboard,
  createAudioBlobUrl,
  downloadAudioFile,
  formatDuration,
  getAudioExtension,
} from '../utils/audio';

interface AudioPlayerBarProps {
  track: AudioTrackItem | null;
  autoPlayTrigger: number;
}

const PLAYBACK_RATES = [0.75, 0.9, 1.0, 1.15, 1.25, 1.5];

export function AudioPlayerBar({ track, autoPlayTrigger }: AudioPlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>(() => Array(52).fill(0.28));
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!track) {
      setObjectUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const url = createAudioBlobUrl(track.audioBase64, track.mimeType);
    setObjectUrl(url);
    setCurrentTime(0);
    setPlaybackRate(track.speed || 1.0);

    let cancelled = false;
    analyzeAudioWaveform(track.audioBase64, 52).then((res) => {
      if (!cancelled) {
        setPeaks(res.peaks);
        if (res.durationSec > 0) {
          setDuration(res.durationSec);
        }
      }
    });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !objectUrl) return;
    audio.playbackRate = playbackRate;
    audio.preservesPitch = true;
  }, [playbackRate, objectUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !objectUrl || autoPlayTrigger === 0) return;

    const tryPlay = async () => {
      try {
        audio.currentTime = 0;
        audio.playbackRate = playbackRate;
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };
    tryPlay();
  }, [objectUrl, autoPlayTrigger]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !objectUrl) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const skipBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, Math.min(audio.duration || duration, audio.currentTime + delta));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const handleSeekBar = (index: number) => {
    const audio = audioRef.current;
    const total = audio?.duration || duration;
    if (!audio || !total) return;
    const ratio = (index + 0.5) / peaks.length;
    const targetTime = ratio * total;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const cyclePlaybackRate = () => {
    const currentIdx = PLAYBACK_RATES.findIndex((r) => Math.abs(r - playbackRate) < 0.05);
    const nextRate = PLAYBACK_RATES[(currentIdx + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(nextRate);
  };

  const handleCopyText = async () => {
    if (!track) return;
    const ok = await copyTextToClipboard(track.text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownload = () => {
    if (!track) return;
    downloadAudioFile(track.audioBase64, `${track.voiceNameAr}-${track.dialectNameAr}`, track.mimeType);
  };

  if (!track) {
    return null;
  }

  const effectiveDuration = duration > 0 ? duration : track.durationSec;
  const progressRatio = effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#0D1322] px-4 py-3 sm:px-6">
      <audio
        ref={audioRef}
        src={objectUrl ?? undefined}
        muted={muted}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration);
          }
          e.currentTarget.playbackRate = playbackRate;
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Track metadata & playback controls */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 transition-transform hover:bg-indigo-500 active:scale-95"
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[-1px]" />}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => skipBy(-5)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              title="تقديم 5 ثوانٍ"
              aria-label="رجوع 5 ثوانٍ"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => skipBy(5)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              title="تخطي 5 ثوانٍ"
              aria-label="تقدم 5 ثوانٍ"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{track.title}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">{track.voiceNameAr}</span>
              <span aria-hidden="true"> · </span>
              <span>{track.dialectNameAr}</span>
              <span aria-hidden="true"> · </span>
              <span>{track.toneNameAr}</span>
            </p>
          </div>
        </div>

        {/* Real decoded waveform scrubber */}
        <div className="flex flex-1 items-center gap-3 px-0 md:px-4" dir="ltr">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            {formatDuration(currentTime)}
          </span>

          <div
            className="flex h-9 flex-1 items-center gap-[2px] cursor-pointer"
            role="slider"
            aria-label="شريط تقدم الصوت"
            aria-valuemin={0}
            aria-valuemax={Math.round(effectiveDuration)}
            aria-valuenow={Math.round(currentTime)}
          >
            {peaks.map((peak, i) => {
              const barRatio = (i + 0.5) / peaks.length;
              const active = barRatio <= progressRatio;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSeekBar(i)}
                  className="flex h-full flex-1 items-center justify-center focus:outline-none"
                  aria-label={`الانتقال إلى ${Math.round(barRatio * 100)}%`}
                >
                  <span
                    className={`w-full rounded-full transition-colors ${
                      active
                        ? 'bg-indigo-600 dark:bg-indigo-400'
                        : 'bg-slate-200 hover:bg-indigo-300 dark:bg-slate-700 dark:hover:bg-indigo-500/60'
                    }`}
                    style={{ height: `${Math.max(18, Math.round(peak * 100))}%` }}
                  />
                </button>
              );
            })}
          </div>

          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            {formatDuration(effectiveDuration)}
          </span>
        </div>

        {/* Speed, Volume, Copy Text & Download Audio actions */}
        <div className="flex items-center justify-between gap-2 shrink-0 md:justify-end">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={cyclePlaybackRate}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 tabular-nums whitespace-nowrap shrink-0"
              title="تغيير سرعة التشغيل"
            >
              {playbackRate.toFixed(2).replace(/\.00$/, '.0')}x
            </button>

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={muted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            >
              {muted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {copied ? (
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
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-500 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تنزيل {getAudioExtension(track.mimeType).toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(clean);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function getAudioExtension(mimeType = 'audio/mpeg'): 'mp3' | 'wav' {
  return mimeType.includes('wav') ? 'wav' : 'mp3';
}

export function createAudioBlobUrl(base64: string, mimeType = 'audio/mpeg'): string {
  const bytes = base64ToUint8Array(base64);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function downloadAudioFile(
  base64: string,
  filenamePrefix: string,
  mimeType = 'audio/mpeg'
): void {
  const bytes = base64ToUint8Array(base64);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const ext = getAudioExtension(mimeType);
  const safeName =
    filenamePrefix.replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '-').slice(0, 40) || 'sawt-audio';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-${Date.now().toString().slice(-6)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function analyzeAudioWaveform(
  base64: string,
  barCount = 56
): Promise<{ peaks: number[]; durationSec: number }> {
  try {
    const bytes = base64ToUint8Array(base64);
    const arrayBuffer = new Uint8Array(bytes).buffer;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / barCount));
    const peaks: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize && start + j < channelData.length; j++) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) max = val;
      }
      peaks.push(Math.max(0.12, Math.min(1, max)));
    }

    const durationSec = audioBuffer.duration;
    await ctx.close();
    return { peaks, durationSec };
  } catch {
    return {
      peaks: Array.from({ length: barCount }, (_, idx) => 0.25 + ((idx * 17) % 60) / 100),
      durationSec: 0,
    };
  }
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

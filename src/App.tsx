/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { DialogueStudio } from './components/DialogueStudio';
import { FaqSeoSection } from './components/FaqSeoSection';
import { HistoryView } from './components/HistoryView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { Sidebar } from './components/Sidebar';
import { TextToSpeechStudio } from './components/TextToSpeechStudio';
import { TopBar } from './components/TopBar';
import { VoiceCloneStudio } from './components/VoiceCloneStudio';
import { VoiceLibrary } from './components/VoiceLibrary';
import { ARABIC_DIALECTS, VOICE_PERSONAS, VOICE_TONES } from './data/voices';
import {
  AudioTrackItem,
  ClonedVoiceProfile,
  DialectId,
  ToneId,
  TtsModelId,
  WorkspaceTab,
} from './types/tts';

const STORAGE_KEY = 'sawt_studio_history_v1';
const CLONES_STORAGE_KEY = 'sawt_studio_clones_v1';
const THEME_STORAGE_KEY = 'sawt_studio_theme_v1';

function loadStoredClones(): ClonedVoiceProfile[] {
  try {
    const raw = localStorage.getItem(CLONES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadStoredTheme(): 'dark' | 'light' {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // Ignore storage errors
  }
  return 'dark';
}

function loadStoredHistory(): AudioTrackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredHistory(items: AudioTrackItem[]): void {
  const slice = items.slice(0, 8);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slice.slice(0, 3)));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadStoredTheme());
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Studio controls state
  const [text, setText] = useState<string>(ARABIC_DIALECTS[0].sampleScript);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(VOICE_PERSONAS[0].id);
  const [selectedDialectId, setSelectedDialectId] = useState<DialectId>('msa');
  const [selectedToneId, setSelectedToneId] = useState<ToneId>('storyteller');
  const [customStyle, setCustomStyle] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1.0);
  const [expressiveness, setExpressiveness] = useState<number>(60);
  const [model, setModel] = useState<TtsModelId>('free-neural');

  // Audio playback, clones & history state
  const [history, setHistory] = useState<AudioTrackItem[]>(() => loadStoredHistory());
  const [clonedVoices, setClonedVoices] = useState<ClonedVoiceProfile[]>(() => loadStoredClones());
  const [currentTrack, setCurrentTrack] = useState<AudioTrackItem | null>(null);
  const [autoPlayTrigger, setAutoPlayTrigger] = useState<number>(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const canonicalUrl = window.location.origin + window.location.pathname;
    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    let ogUrlMeta = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrlMeta) {
      ogUrlMeta = document.createElement('meta');
      ogUrlMeta.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrlMeta);
    }
    ogUrlMeta.content = canonicalUrl;
  }, []);

  useEffect(() => {
    saveStoredHistory(history);
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(CLONES_STORAGE_KEY, JSON.stringify(clonedVoices.slice(0, 12)));
    } catch {
      // Ignore storage quota errors
    }
  }, [clonedVoices]);

  const handleSaveClonedVoice = (voice: ClonedVoiceProfile) => {
    setClonedVoices((prev) => [voice, ...prev]);
  };

  const handleDeleteClonedVoice = (id: string) => {
    setClonedVoices((prev) => prev.filter((item) => item.id !== id));
    if (selectedVoiceId === id) {
      setSelectedVoiceId(VOICE_PERSONAS[0].id);
    }
  };

  const handleAudioGenerated = (track: AudioTrackItem) => {
    setHistory((prev) => [track, ...prev]);
    setCurrentTrack(track);
    setAutoPlayTrigger((n) => n + 1);
  };

  const handlePlayTrack = (track: AudioTrackItem) => {
    setCurrentTrack(track);
    setAutoPlayTrigger((n) => n + 1);
  };

  const handleDeleteTrack = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentTrack?.id === id) {
      setCurrentTrack(null);
    }
  };

  const handleLoadIntoStudio = (track: AudioTrackItem) => {
    setText(track.text);
    const matchingVoice = VOICE_PERSONAS.find((v) => v.nameAr === track.voiceNameAr);
    if (matchingVoice) setSelectedVoiceId(matchingVoice.id);

    const matchingDialect = ARABIC_DIALECTS.find((d) => d.nameAr === track.dialectNameAr);
    if (matchingDialect) setSelectedDialectId(matchingDialect.id);

    const matchingTone = VOICE_TONES.find((t) => t.nameAr === track.toneNameAr);
    if (matchingTone) setSelectedToneId(matchingTone.id);

    setSpeed(track.speed);
    setExpressiveness(track.expressiveness);
    setModel(track.model);
    setActiveTab('studio');
  };

  const handleNewProject = () => {
    setText('');
    setCustomStyle('');
    setActiveTab('studio');
  };

  const totalCharsProcessed = history.reduce((acc, item) => acc + item.text.length, 0);
  const latestSingleTrack = history.find((item) => !item.isDialogue) ?? null;
  const latestDialogueTrack = history.find((item) => item.isDialogue) ?? null;

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#F4F6FB] text-slate-900 dark:bg-[#090D16] dark:text-slate-100"
      dir="rtl"
    >
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        historyCount={history.length}
        clonedVoicesCount={clonedVoices.length}
        totalCharsProcessed={totalCharsProcessed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNewProject={handleNewProject}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'studio' && (
            <TextToSpeechStudio
              text={text}
              onTextChange={setText}
              selectedVoiceId={selectedVoiceId}
              onSelectVoiceId={setSelectedVoiceId}
              selectedDialectId={selectedDialectId}
              onSelectDialectId={setSelectedDialectId}
              selectedToneId={selectedToneId}
              onSelectToneId={setSelectedToneId}
              customStyle={customStyle}
              onCustomStyleChange={setCustomStyle}
              speed={speed}
              onSpeedChange={setSpeed}
              expressiveness={expressiveness}
              onExpressivenessChange={setExpressiveness}
              model={model}
              onModelChange={setModel}
              onAudioGenerated={handleAudioGenerated}
              latestTrack={latestSingleTrack}
              onPlayTrack={handlePlayTrack}
              onOpenPrivacy={() => setActiveTab('privacy')}
              clonedVoices={clonedVoices}
            />
          )}

          {activeTab === 'clone' && (
            <VoiceCloneStudio
              clonedVoices={clonedVoices}
              onSaveClonedVoice={handleSaveClonedVoice}
              onDeleteClonedVoice={handleDeleteClonedVoice}
              onUseInMainStudio={(voice) => {
                setSelectedVoiceId(voice.id);
                setSelectedDialectId(voice.preferredDialect);
                const sample = ARABIC_DIALECTS.find((d) => d.id === voice.preferredDialect)?.sampleScript;
                if (sample) setText(sample);
                setActiveTab('studio');
              }}
              onAudioGenerated={handleAudioGenerated}
            />
          )}

          {activeTab === 'dialogue' && (
            <DialogueStudio
              onAudioGenerated={handleAudioGenerated}
              latestDialogueTrack={latestDialogueTrack}
            />
          )}

          {activeTab === 'voices' && (
            <VoiceLibrary
              selectedVoiceId={selectedVoiceId}
              onUseVoice={(voiceId) => {
                setSelectedVoiceId(voiceId);
                const voice = VOICE_PERSONAS.find((v) => v.id === voiceId);
                if (voice?.languageTag === 'fr') {
                  setSelectedDialectId('french');
                  setText(
                    ARABIC_DIALECTS.find((d) => d.id === 'french')?.sampleScript ?? text
                  );
                } else if (voice?.languageTag === 'en') {
                  setSelectedDialectId('english');
                  setText(
                    ARABIC_DIALECTS.find((d) => d.id === 'english')?.sampleScript ?? text
                  );
                } else if (voice?.isCartoon || voice?.isAnime) {
                  setText(voice.sampleText);
                }
                setActiveTab('studio');
              }}
              onPreviewTrack={handlePlayTrack}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              onPlayTrack={handlePlayTrack}
              onDeleteTrack={handleDeleteTrack}
              onLoadIntoStudio={handleLoadIntoStudio}
              onGoToStudio={() => setActiveTab('studio')}
            />
          )}

          {activeTab === 'faq' && (
            <FaqSeoSection
              onSelectVoiceCategory={(voiceId, dialectId) => {
                setSelectedVoiceId(voiceId);
                if (dialectId) {
                  setSelectedDialectId(dialectId);
                  const target = ARABIC_DIALECTS.find((d) => d.id === dialectId);
                  if (target) setText(target.sampleScript);
                }
                setActiveTab('studio');
              }}
              onOpenPrivacy={() => setActiveTab('privacy')}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPolicyView onGoToStudio={() => setActiveTab('studio')} />
          )}

          <footer className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800/80 pt-5 pb-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              صوت ستوديو — موقع توليد صوت مجاناً بالعربية والفرنسية والإنجليزية وأصوات الكرتون
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className="font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                الأسئلة الشائعة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className="font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                سياسة الخصوصية
              </button>
            </div>
          </footer>
        </main>

        <AudioPlayerBar track={currentTrack} autoPlayTrigger={autoPlayTrigger} />
      </div>
    </div>
  );
}

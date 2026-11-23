export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export type TtsModelId =
  | 'free-neural'
  | 'gemini-3.8-flash-lite-tts'
  | 'gemini-3.8-flash-tts';

export type WorkspaceTab =
  | 'studio'
  | 'clone'
  | 'dialogue'
  | 'voices'
  | 'history'
  | 'faq'
  | 'privacy';

export type DialectId =
  | 'msa'
  | 'moroccan'
  | 'egyptian'
  | 'gulf'
  | 'levantine'
  | 'iraqi'
  | 'tunisian'
  | 'algerian'
  | 'libyan'
  | 'yemeni'
  | 'french'
  | 'english';

export type ToneId =
  | 'storyteller'
  | 'news'
  | 'warm_narrator'
  | 'energetic'
  | 'calm'
  | 'dramatic'
  | 'conversational';

export interface VoiceAcousticProfile {
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

export interface ClonedVoiceProfile {
  id: string;
  nameAr: string;
  preferredDialect: DialectId;
  genderOverride: 'auto' | 'ذكر' | 'أنثى';
  profile: VoiceAcousticProfile;
  createdAt: number;
}

export interface VoicePersona {
  id: string;
  nameAr: string;
  geminiVoice: GeminiVoiceName;
  neuralVoices: Record<DialectId, string>;
  basePitchHz: number;
  baseRateOffsetPct?: number;
  gender: 'أنثى' | 'ذكر' | 'شخصية كرتون' | 'شخصية أنمي';
  ageGroup: string;
  specialty: string;
  isStoryteller?: boolean;
  isCartoon?: boolean;
  isAnime?: boolean;
  languageTag?: 'ar' | 'fr' | 'en' | 'multi';
  recommendedDialects: DialectId[];
  description: string;
  stylePrompt: string;
  sampleText: string;
  accentColor: string;
}

export interface ArabicDialect {
  id: DialectId;
  nameAr: string;
  region: string;
  langCode: 'ar' | 'fr' | 'en';
  promptDescription: string;
  sampleScript: string;
}

export interface VoiceTone {
  id: ToneId;
  nameAr: string;
  shortDesc: string;
  promptDescription: string;
  pitchOffsetHz: number;
  rateOffsetPct: number;
}

export interface AudioTrackItem {
  id: string;
  title: string;
  text: string;
  audioBase64: string;
  mimeType: string;
  voiceNameAr: string;
  geminiVoice: GeminiVoiceName;
  dialectNameAr: string;
  toneNameAr: string;
  speed: number;
  expressiveness: number;
  model: TtsModelId;
  durationSec: number;
  createdAt: number;
  isDialogue?: boolean;
  isCloned?: boolean;
}

export interface DialogueLine {
  id: string;
  speakerId: 'speaker1' | 'speaker2';
  text: string;
  tone: string;
}

import { ArabicDialect, DialectId, VoicePersona, VoiceTone } from '../types/tts';

function buildDialectMap(
  overrides: Partial<Record<DialectId, string>>,
  defaults: { male?: boolean } = {}
): Record<DialectId, string> {
  const isMale = defaults.male ?? true;
  const fallback: Record<DialectId, string> = isMale
    ? {
        msa: 'ar-SA-HamedNeural',
        moroccan: 'ar-MA-JamalNeural',
        egyptian: 'ar-EG-ShakirNeural',
        gulf: 'ar-AE-HamdanNeural',
        levantine: 'ar-JO-TaimNeural',
        iraqi: 'ar-IQ-BasselNeural',
        tunisian: 'ar-TN-HediNeural',
        algerian: 'ar-DZ-IsmaelNeural',
        libyan: 'ar-LY-OmarNeural',
        yemeni: 'ar-YE-SalehNeural',
        french: 'fr-FR-HenriNeural',
        english: 'en-US-AndrewNeural',
      }
    : {
        msa: 'ar-SA-ZariyahNeural',
        moroccan: 'ar-MA-MounaNeural',
        egyptian: 'ar-EG-SalmaNeural',
        gulf: 'ar-AE-FatimaNeural',
        levantine: 'ar-JO-SanaNeural',
        iraqi: 'ar-IQ-RanaNeural',
        tunisian: 'ar-TN-ReemNeural',
        algerian: 'ar-DZ-AminaNeural',
        libyan: 'ar-LY-ImanNeural',
        yemeni: 'ar-YE-MaryamNeural',
        french: 'fr-FR-DeniseNeural',
        english: 'en-US-EmmaNeural',
      };

  return { ...fallback, ...overrides };
}

export const VOICE_PERSONAS: VoicePersona[] = [
  // --- Realistic Arabic & International Storytellers ---
  {
    id: 'adam-storyteller',
    nameAr: 'آدم (Adam — سرد عميق)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-SA-HamedNeural',
        moroccan: 'ar-MA-JamalNeural',
        gulf: 'ar-QA-MoazNeural',
        english: 'en-US-AndrewNeural',
        french: 'fr-FR-HenriNeural',
      },
      { male: true }
    ),
    basePitchHz: -3,
    gender: 'ذكر',
    ageGroup: 'عميق · طبيعي ومتقن',
    specialty: 'سرد قصص وكتب صوتية',
    isStoryteller: true,
    languageTag: 'ar',
    recommendedDialects: ['msa', 'gulf', 'egyptian', 'moroccan'],
    description:
      'نموذج صوت Adam الشهير: نبرة بشرية عميقة وهادئة بنطق سليم 100% للقصص والكتب الصوتية والوثائقيات.',
    stylePrompt: 'Deep, calm, authoritative Adam-style audiobook and story narrator',
    sampleText:
      'في سكون الليل العميق، حين تهدأ المدينة وتنام العيون، تبدأ الحكايات التي تبقى في الذاكرة إلى الأبد.',
    accentColor: '#0F172A',
  },
  {
    id: 'brian-storyteller',
    nameAr: 'بريان (Brian)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-AE-HamdanNeural',
        levantine: 'ar-SY-LaithNeural',
        english: 'en-US-BrianNeural',
        french: 'fr-FR-RemyMultilingualNeural',
      },
      { male: true }
    ),
    basePitchHz: -2,
    gender: 'ذكر',
    ageGroup: 'دافئ · مريح وبشري',
    specialty: 'سرد قصص ووثائقيات',
    isStoryteller: true,
    languageTag: 'ar',
    recommendedDialects: ['msa', 'gulf', 'levantine', 'english'],
    description:
      'صوت دافئ ومريح مثل Brian بأداء بشري طبيعي تماماً وخالٍ من أخطاء النطق في النصوص العربية والعالمية.',
    stylePrompt: 'Deep, comforting, resonant Brian-style master storyteller and audiobook narrator',
    sampleText:
      'في ليلةٍ هادئةٍ تحت سماءٍ مرصعةٍ بالنجوم، بدأت الحكاية التي لم يروِها أحدٌ من قبل.',
    accentColor: '#0F172A',
  },
  {
    id: 'rachel-audiobook',
    nameAr: 'راشيل (Rachel)',
    geminiVoice: 'Kore',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-SA-ZariyahNeural',
        english: 'en-US-EmmaNeural',
        french: 'fr-FR-VivienneMultilingualNeural',
      },
      { male: false }
    ),
    basePitchHz: -1,
    gender: 'أنثى',
    ageGroup: 'هادئة · واضحة جداً',
    specialty: 'كتب صوتية وروايات',
    isStoryteller: true,
    languageTag: 'ar',
    recommendedDialects: ['msa', 'levantine', 'egyptian'],
    description:
      'مستوحاة من صوت Rachel: راوية هادئة بمخارج حروف دقيقة ونطق عربي سليم 100% للقصص الطويلة.',
    stylePrompt: 'Calm, crystal-clear, soothing Rachel-style female audiobook narrator',
    sampleText:
      'افتح صفحات الكتاب بهدوء، واستمع إلى تفاصيل القصة وهي تتشكل كلمةً بعد كلمة بكل وضوح.',
    accentColor: '#334155',
  },
  {
    id: 'josh-doc',
    nameAr: 'جوش (Josh)',
    geminiVoice: 'Fenrir',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-JO-TaimNeural',
        gulf: 'ar-KW-FahedNeural',
        english: 'en-US-GuyNeural',
      },
      { male: true }
    ),
    basePitchHz: -2,
    gender: 'ذكر',
    ageGroup: 'دافئ · رصين',
    specialty: 'سرد وثائقي وقصص',
    isStoryteller: true,
    languageTag: 'ar',
    recommendedDialects: ['msa', 'levantine', 'gulf'],
    description:
      'خامة رجالية دافئة ومتزنة (مثل Josh): مثالية للسرد الوثائقي، قصص التاريخ، والقراءة البشرية الواضحة.',
    stylePrompt: 'Warm, grounded, mature Josh-style documentary and narrative voice',
    sampleText:
      'عبر قرونٍ من التاريخ، ظلت الكلمة المسموعة هي الجسر الذي ينقل الحكمة من جيلٍ إلى جيل.',
    accentColor: '#1E293B',
  },
  {
    id: 'callum-midnight',
    nameAr: 'كالوم (Callum)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-OM-AbdullahNeural',
        gulf: 'ar-OM-AbdullahNeural',
        english: 'en-GB-RyanNeural',
      },
      { male: true }
    ),
    basePitchHz: -3,
    gender: 'ذكر',
    ageGroup: 'رخيم · هادئ ووقور',
    specialty: 'قصص الغموض والليل',
    isStoryteller: true,
    languageTag: 'ar',
    recommendedDialects: ['msa', 'gulf', 'iraqi'],
    description:
      'صوت رجالي هادئ ورخيم (مثل Callum) مناسب لقصص الغموض، الحكايات الليلية، والمقاطع التأملية العميقة.',
    stylePrompt: 'Calm, low, gravelly Callum-style midnight storyteller',
    sampleText:
      'عند منتصف الليل، حين ساد الصمت كل أرجاء المكان، كُشف السر الذي انتظره الجميع.',
    accentColor: '#0F172A',
  },
  {
    id: 'emily-calm',
    nameAr: 'إيميلي (Emily)',
    geminiVoice: 'Kore',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-AE-FatimaNeural',
        levantine: 'ar-SY-AmanyNeural',
        english: 'en-GB-SoniaNeural',
      },
      { male: false }
    ),
    basePitchHz: -1,
    gender: 'أنثى',
    ageGroup: 'ناعمة · مريحة',
    specialty: 'قصص قبل النوم وتأمل',
    isStoryteller: true,
    languageTag: 'ar',
    recommendedDialects: ['msa', 'gulf', 'levantine'],
    description:
      'صوت نسائي هادئ وحالم (مثل Emily): مثالي لحكايات قبل النوم والقصص الهادئة بنطق عربي متقن.',
    stylePrompt: 'Gentle, peaceful, soft-spoken Emily-style bedtime and calm story narrator',
    sampleText:
      'في هدوء الفجر الجميل، تتنفس الطبيعة ببطء وتبدأ قصةٌ مليئة بالسكينة والسلام.',
    accentColor: '#475569',
  },

  // --- Arabic Regional Dialects Specialists ---
  {
    id: 'jamal-darija',
    nameAr: 'جمال (مغربي)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap({}, { male: true }),
    basePitchHz: 0,
    gender: 'ذكر',
    ageGroup: 'مغربي · طبيعي',
    specialty: 'الدارجة المغربية والفصحى',
    languageTag: 'ar',
    recommendedDialects: ['moroccan', 'msa', 'algerian', 'tunisian'],
    description:
      'صوت رجالي مغربي أصيل للدارجة المغربية وجميع اللهجات المغاربية والعربية الفصحى بوضوح تام.',
    stylePrompt: 'Natural Moroccan Arabic male narrator',
    sampleText:
      'مرحبا بكم معانا فهاد الموقع المجاني! اليوم غادي نحوّلو النص ديالكم لصوت طبيعي بالدارجة المغربية.',
    accentColor: '#0F172A',
  },
  {
    id: 'mouna-darija',
    nameAr: 'منى (مغربية)',
    geminiVoice: 'Kore',
    neuralVoices: buildDialectMap({}, { male: false }),
    basePitchHz: 0,
    gender: 'أنثى',
    ageGroup: 'مغربية · واضحة',
    specialty: 'الدارجة المغربية والقصص',
    languageTag: 'ar',
    recommendedDialects: ['moroccan', 'msa', 'algerian', 'tunisian'],
    description:
      'صوت نسائي مغربي طبيعي وواضح للدارجة المغربية والحكايات والمحتوى الرقمي.',
    stylePrompt: 'Natural Moroccan Arabic female narrator',
    sampleText:
      'مرحبا بكم! دابا تقدر تولد صوت احترافي بالدارجة المغربية مجاناً وبلا حدود للكلمات.',
    accentColor: '#334155',
  },
  {
    id: 'hedi-tunisian',
    nameAr: 'هادي (تونسي ومغاربي)',
    geminiVoice: 'Puck',
    neuralVoices: buildDialectMap(
      { msa: 'ar-TN-HediNeural' },
      { male: true }
    ),
    basePitchHz: 0,
    gender: 'ذكر',
    ageGroup: 'مغاربي · حيوي',
    specialty: 'التونسية والجزائرية والليبية',
    languageTag: 'ar',
    recommendedDialects: ['tunisian', 'algerian', 'libyan'],
    description:
      'صوت متقن للهجة التونسية والمغاربية ينطق المفردات المحلية بسلاسة وطبيعية.',
    stylePrompt: 'Authentic Tunisian and Maghrebi male narrator',
    sampleText:
      'عسلامة ومرحبا بيكم الناس الكل! اليوم تنجموا تحولوا أي كلام لصوت تونسي طبيعي ومجاني.',
    accentColor: '#0F172A',
  },
  {
    id: 'moaz-novels',
    nameAr: 'معاذ (خليجي وروائي)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      { msa: 'ar-QA-MoazNeural', gulf: 'ar-QA-MoazNeural' },
      { male: true }
    ),
    basePitchHz: -2,
    gender: 'ذكر',
    ageGroup: 'عميق · روائي',
    specialty: 'سرد درامي وروايات',
    isStoryteller: true,
    languageTag: 'ar',
    recommendedDialects: ['msa', 'gulf', 'iraqi', 'yemeni'],
    description:
      'صوت رجالي عميق ورخيم يضفي هيبةً وتشويقاً على القصص البوليسية والروايات الدرامية.',
    stylePrompt: 'Deep, cinematic, dramatic Arabic novel narrator voice',
    sampleText:
      'مع حلول الظلام، انكشف السر الذي ظل مخفياً خلف جدران القصر لعقودٍ طويلة.',
    accentColor: '#1E293B',
  },
  {
    id: 'salma-social',
    nameAr: 'سلمى (مصرية وحيوية)',
    geminiVoice: 'Zephyr',
    neuralVoices: buildDialectMap(
      { levantine: 'ar-LB-LaylaNeural', gulf: 'ar-BH-LailaNeural' },
      { male: false }
    ),
    basePitchHz: 2,
    gender: 'أنثى',
    ageGroup: 'حيوية · عصرية',
    specialty: 'مصري وإعلانات ومحتوى',
    languageTag: 'ar',
    recommendedDialects: ['egyptian', 'levantine', 'moroccan'],
    description:
      'صوت نسائي مشرق وحيوي قريب من المستمع، ممتاز للهجة المصرية والإعلانات والبودكاست.',
    stylePrompt: 'Bright, friendly, modern female Arabic speaker',
    sampleText:
      'أهلاً بيكم! دلوقتي تقدر تطلع تعليق صوتي واقعي جداً باللهجة المصرية مجاناً في ثواني.',
    accentColor: '#334155',
  },
  {
    id: 'faisal-gulf',
    nameAr: 'فيصل (خليجي وبودكاست)',
    geminiVoice: 'Puck',
    neuralVoices: buildDialectMap(
      { gulf: 'ar-KW-FahedNeural', levantine: 'ar-LB-RamiNeural' },
      { male: true }
    ),
    basePitchHz: 0,
    gender: 'ذكر',
    ageGroup: 'شاب · منطلق',
    specialty: 'خليجي وبودكاست وحواري',
    languageTag: 'ar',
    recommendedDialects: ['gulf', 'yemeni', 'msa'],
    description:
      'صوت شبابي خليجي متفاعل ومباشر، مثالي للبودكاست واليوتيوب والشروحات التقنية.',
    stylePrompt: 'Youthful, charismatic Gulf male podcast host',
    sampleText:
      'يا هلا والله وحياكم الله في حلقة جديدة، اليوم نستعرض أفضل أدوات توليد الصوت بالذكاء الاصطناعي.',
    accentColor: '#0F172A',
  },

  // --- Realistic French Voices ---
  {
    id: 'henri-french',
    nameAr: 'هنري (Henri — فرنسي واقعي)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      { french: 'fr-FR-HenriNeural', msa: 'fr-FR-HenriNeural' },
      { male: true }
    ),
    basePitchHz: -1,
    gender: 'ذكر',
    ageGroup: 'فرنسي · واقعي ورصين',
    specialty: 'اللغة الفرنسية (سرد وإعلانات)',
    isStoryteller: true,
    languageTag: 'fr',
    recommendedDialects: ['french'],
    description:
      'صوت فرنسي أصلي وواقعي جداً (Henri) لنطق اللغة الفرنسية بمخارج حروف باريسية طبيعية 100%.',
    stylePrompt: 'Authentic, refined native Parisian French male narrator',
    sampleText:
      'Bonjour et bienvenue sur notre studio vocal gratuit. Transformez vos textes français en une voix humaine réaliste.',
    accentColor: '#0F172A',
  },
  {
    id: 'denise-french',
    nameAr: 'دينيز (Denise — فرنسية واقعية)',
    geminiVoice: 'Kore',
    neuralVoices: buildDialectMap(
      { french: 'fr-FR-DeniseNeural', msa: 'fr-FR-DeniseNeural' },
      { male: false }
    ),
    basePitchHz: 0,
    gender: 'أنثى',
    ageGroup: 'فرنسية · واضحة وعصرية',
    specialty: 'اللغة الفرنسية (بودكاست وتعليم)',
    languageTag: 'fr',
    recommendedDialects: ['french'],
    description:
      'صوت نسائي فرنسي طبيعي وعذب (Denise)، مثالي للكتب الفرنسية والفيديوهات والدروس التعليمية.',
    stylePrompt: 'Clear, expressive native French female studio voice',
    sampleText:
      'Découvrez une synthèse vocale française fluide, naturelle et entièrement gratuite sans limite de mots.',
    accentColor: '#334155',
  },
  {
    id: 'remy-french',
    nameAr: 'ريمي (Rémy — فرنسي متعدد)',
    geminiVoice: 'Puck',
    neuralVoices: buildDialectMap(
      { french: 'fr-FR-RemyMultilingualNeural', msa: 'fr-FR-RemyMultilingualNeural' },
      { male: true }
    ),
    basePitchHz: 0,
    gender: 'ذكر',
    ageGroup: 'فرنسي · دافئ وحيوي',
    specialty: 'اللغة الفرنسية (قصص وبودكاست)',
    isStoryteller: true,
    languageTag: 'fr',
    recommendedDialects: ['french'],
    description:
      'أحدث نموذج فرنسي فائق الواقعية (Rémy Multilingual)، رائع للقصص الفرنسية والحوارات الشبابية.',
    stylePrompt: 'Warm, modern, ultra-realistic French male narrator',
    sampleText:
      'Dans le calme du matin, chaque mot prend vie avec une clarté et une émotion surprenantes.',
    accentColor: '#1E293B',
  },
  {
    id: 'vivienne-french',
    nameAr: 'فيفيان (Vivienne — فرنسية)',
    geminiVoice: 'Zephyr',
    neuralVoices: buildDialectMap(
      { french: 'fr-FR-VivienneMultilingualNeural', msa: 'fr-FR-VivienneMultilingualNeural' },
      { male: false }
    ),
    basePitchHz: 0,
    gender: 'أنثى',
    ageGroup: 'فرنسية · راقية وهادئة',
    specialty: 'اللغة الفرنسية (سرد ووثائقي)',
    isStoryteller: true,
    languageTag: 'fr',
    recommendedDialects: ['french'],
    description:
      'صوت نسائي فرنسي فائق النقاء (Vivienne) مناسب للروايات الفرنسية والمحتوى التسويقي الراقي.',
    stylePrompt: 'Sophisticated, natural French female audiobook narrator',
    sampleText:
      'Écoutez vos histoires et présentations en français avec une qualité de studio exceptionnelle.',
    accentColor: '#475569',
  },

  // --- Realistic English Voices ---
  {
    id: 'andrew-english',
    nameAr: 'أندرو (Andrew — إنجليزي واقعي)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      { english: 'en-US-AndrewNeural', msa: 'en-US-AndrewNeural' },
      { male: true }
    ),
    basePitchHz: -1,
    gender: 'ذكر',
    ageGroup: 'إنجليزي أمريكي · دافئ',
    specialty: 'اللغة الإنجليزية (سرد وأعمال)',
    isStoryteller: true,
    languageTag: 'en',
    recommendedDialects: ['english'],
    description:
      'أحد أشهر الأصوات الإنجليزية الواقعية (Andrew US): نبرة بشرية دافئة وواضحة لليوتيوب والكتب الصوتية.',
    stylePrompt: 'Warm, confident, ultra-natural American English male narrator',
    sampleText:
      'Welcome to our free AI voice studio. Turn any English script into natural, studio-grade speech instantly.',
    accentColor: '#0F172A',
  },
  {
    id: 'brian-english',
    nameAr: 'براين الأصلي (Brian — إنجليزي)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      { english: 'en-US-BrianNeural', msa: 'en-US-BrianNeural' },
      { male: true }
    ),
    basePitchHz: -2,
    gender: 'ذكر',
    ageGroup: 'إنجليزي · عميق للسرد',
    specialty: 'اللغة الإنجليزية (قصص ووثائقي)',
    isStoryteller: true,
    languageTag: 'en',
    recommendedDialects: ['english'],
    description:
      'صوت Brian الإنجليزي الأصلي العميق والمقارب لأسلوب المذيعين وراوي القصص في المنصات العالمية.',
    stylePrompt: 'Deep, calm, authoritative American English storyteller',
    sampleText:
      'In the quiet hours before dawn, the greatest stories are waiting to be heard.',
    accentColor: '#0F172A',
  },
  {
    id: 'emma-english',
    nameAr: 'إيما (Emma — إنجليزية أمريكية)',
    geminiVoice: 'Kore',
    neuralVoices: buildDialectMap(
      { english: 'en-US-EmmaNeural', msa: 'en-US-EmmaNeural' },
      { male: false }
    ),
    basePitchHz: 0,
    gender: 'أنثى',
    ageGroup: 'إنجليزية · طبيعية جداً',
    specialty: 'اللغة الإنجليزية (تعليم ومحتوى)',
    isStoryteller: true,
    languageTag: 'en',
    recommendedDialects: ['english'],
    description:
      'صوت نسائي إنجليزي واقعي وودود (Emma US)، مثالي للشروحات والقصص والمقاطع التعريفية.',
    stylePrompt: 'Friendly, articulate, natural American English female narrator',
    sampleText:
      'Create realistic English voiceovers for your videos, courses, and audiobooks completely free.',
    accentColor: '#334155',
  },
  {
    id: 'ryan-british',
    nameAr: 'رايان (Ryan — إنجليزي بريطاني)',
    geminiVoice: 'Fenrir',
    neuralVoices: buildDialectMap(
      { english: 'en-GB-RyanNeural', msa: 'en-GB-RyanNeural' },
      { male: true }
    ),
    basePitchHz: -1,
    gender: 'ذكر',
    ageGroup: 'بريطاني · فخم وواضح',
    specialty: 'اللغة الإنجليزية (لهجة بريطانية)',
    isStoryteller: true,
    languageTag: 'en',
    recommendedDialects: ['english'],
    description:
      'صوت بريطاني أنيق ووقور (Ryan UK)، مناسب للأفلام الوثائقية والروايات الكلاسيكية.',
    stylePrompt: 'Crisp, distinguished British English male narrator',
    sampleText:
      'Good evening and welcome. Experience refined British narration crafted for documentaries and stories.',
    accentColor: '#1E293B',
  },
  {
    id: 'sonia-british',
    nameAr: 'صونيا (Sonia — بريطانية)',
    geminiVoice: 'Kore',
    neuralVoices: buildDialectMap(
      { english: 'en-GB-SoniaNeural', msa: 'en-GB-SoniaNeural' },
      { male: false }
    ),
    basePitchHz: 0,
    gender: 'أنثى',
    ageGroup: 'بريطانية · هادئة وراقية',
    specialty: 'اللغة الإنجليزية (لهجة بريطانية)',
    languageTag: 'en',
    recommendedDialects: ['english'],
    description:
      'صوت نسائي بريطاني ناعم ومريح (Sonia UK) لقراءة المقالات والكتب الصوتية بأناقة.',
    stylePrompt: 'Calm, poised British English female voice',
    sampleText:
      'Sit back and enjoy effortless British narration with clear pronunciation and natural rhythm.',
    accentColor: '#475569',
  },

  // --- Cartoon & Animated Character Voices (Arabic, French, English) ---
  {
    id: 'tom-cartoon',
    nameAr: 'توم المغامر (صوت كرتون)',
    geminiVoice: 'Puck',
    neuralVoices: buildDialectMap(
      {
        french: 'fr-FR-EloiseNeural',
        english: 'en-US-AnaNeural',
      },
      { male: true }
    ),
    basePitchHz: 32,
    gender: 'شخصية كرتون',
    ageGroup: 'كرتون · مرح وشقي',
    specialty: 'أصوات كرتون ومغامرات',
    isCartoon: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'moroccan', 'egyptian', 'french', 'english'],
    description:
      'شخصية كرتونية مرحة ومفعمة بالطاقة! مثالي لدبلجة أفلام الكرتون والرسوم المتحركة بالعربية والفرنسية والإنجليزية.',
    stylePrompt: 'Cheerful, playful animated cartoon kid hero voice',
    sampleText:
      'هيا بنا يا أصدقاء! تنتظرنا اليوم مغامرة كرتونية مذهلة في عالم الخيال والمرح!',
    accentColor: '#0F172A',
  },
  {
    id: 'lulu-cartoon',
    nameAr: 'لولو الكرتونية (صوت كرتون)',
    geminiVoice: 'Zephyr',
    neuralVoices: buildDialectMap(
      {
        french: 'fr-FR-EloiseNeural',
        english: 'en-GB-MaisieNeural',
      },
      { male: false }
    ),
    basePitchHz: 26,
    gender: 'شخصية كرتون',
    ageGroup: 'كرتون · طفولية لطيفة',
    specialty: 'أصوات كرتون وقصص أطفال',
    isCartoon: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'egyptian', 'moroccan', 'french', 'english'],
    description:
      'صوت كرتوني أنثوي طفولي ولطيف جداً، مصمم لحكايات الأطفال وقنوات الرسوم المتحركة والأنيميشن.',
    stylePrompt: 'Cute, bubbly, cheerful cartoon girl character voice',
    sampleText:
      'مرحباً يا أصدقائي الصغار! هل أنتم مستعدون لسماع حكاية اليوم السعيدة؟',
    accentColor: '#334155',
  },
  {
    id: 'bombo-giant',
    nameAr: 'بومبو العملاق (صوت كرتون)',
    geminiVoice: 'Fenrir',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-QA-MoazNeural',
        gulf: 'ar-QA-MoazNeural',
        french: 'fr-FR-HenriNeural',
        english: 'en-US-ChristopherNeural',
      },
      { male: true }
    ),
    basePitchHz: -22,
    gender: 'شخصية كرتون',
    ageGroup: 'كرتون · عملاق وكوميدي',
    specialty: 'أصوات كرتون عمالقة ووحوش',
    isCartoon: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'gulf', 'egyptian', 'french', 'english'],
    description:
      'صوت كرتوني ضخم وعميق بطابع كوميدي! مناسب لشخصيات الدببة والعمالقة والوحوش الطيبة أو الشريرة في الكرتون.',
    stylePrompt: 'Booming, comical, deep animated cartoon giant monster voice',
    sampleText:
      'هو هو هو! أنا بومبو العملاق اللطيف، صوتي ضخم لكن قلبي يحب المغامرات المضحكة!',
    accentColor: '#0F172A',
  },
  {
    id: 'ziko-chipmunk',
    nameAr: 'زيكو السنجاب (صوت كرتون)',
    geminiVoice: 'Puck',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-LB-RamiNeural',
        french: 'fr-FR-RemyMultilingualNeural',
        english: 'en-US-GuyNeural',
      },
      { male: true }
    ),
    basePitchHz: 44,
    gender: 'شخصية كرتون',
    ageGroup: 'كرتون · سريع ومضحك',
    specialty: 'أصوات كرتون سنجاب وكوميديا',
    isCartoon: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'levantine', 'egyptian', 'french', 'english'],
    description:
      'صوت كرتوني فائق الحيوية بنبرة حادة ومضحكة مثل شخصيات السناجب والروبوتات الصغيرة في الرسوم المتحركة.',
    stylePrompt: 'High-pitched, fast, goofy cartoon chipmunk sidekick voice',
    sampleText:
      'يا إلهي! انظروا إلى هذا، يجب أن نتحرك بسرعة قبل أن يسبقنا الجميع إلى الكنز!',
    accentColor: '#1E293B',
  },
  {
    id: 'hakim-anime',
    nameAr: 'الحكيم الكرتوني (أنمي وأساطير)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-OM-AbdullahNeural',
        french: 'fr-CA-AntoineNeural',
        english: 'en-GB-RyanNeural',
      },
      { male: true }
    ),
    basePitchHz: -16,
    gender: 'شخصية كرتون',
    ageGroup: 'أنمي · وقور وأسطوري',
    specialty: 'دبلجة أنمي وألعاب وكرتون',
    isCartoon: true,
    isAnime: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'gulf', 'french', 'english'],
    description:
      'نبرة درامية عميقة مخصصة لدبلجة شخصيات الأنمي الحكيمة، السحرة، وأبطال ألعاب الفيديو والرسوم المتحركة.',
    stylePrompt: 'Dramatic, deep animated wizard and anime mentor voice',
    sampleText:
      'تذكّر أيها البطل الصغير، القوة الحقيقية ليست في السيف، بل في شجاعة القلب والإرادة.',
    accentColor: '#0F172A',
  },

  // --- Anime Character Voices ---
  {
    id: 'shinobi-anime',
    nameAr: 'شينوبي المقاتل (بطل أنمي)',
    geminiVoice: 'Puck',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-LB-RamiNeural',
        levantine: 'ar-LB-RamiNeural',
        french: 'fr-FR-RemyMultilingualNeural',
        english: 'en-US-GuyNeural',
      },
      { male: true }
    ),
    basePitchHz: 14,
    baseRateOffsetPct: 10,
    gender: 'شخصية أنمي',
    ageGroup: 'أنمي شونين · شجاع ومتحمس',
    specialty: 'أبطال الأنمي والقتال',
    isCartoon: true,
    isAnime: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'levantine', 'egyptian', 'french', 'english'],
    description:
      'صوت بطل أنمي شاب مندفع وشجاع! مثالي لمشاهد القتال، التحدي، ودبلجة مسلسلات الأنمي الحماسية.',
    stylePrompt: 'Passionate, determined young shonen anime hero voice',
    sampleText:
      'لن أستسلم أبداً مهما اشتدت المعركة! سأحمي أصدقائي وأثبت للجميع قوة عزيمتي الآن!',
    accentColor: '#4F46E5',
  },
  {
    id: 'akio-anime',
    nameAr: 'أكيو الظل (شرير أنمي غامض)',
    geminiVoice: 'Charon',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-QA-MoazNeural',
        gulf: 'ar-QA-MoazNeural',
        french: 'fr-FR-HenriNeural',
        english: 'en-US-ChristopherNeural',
      },
      { male: true }
    ),
    basePitchHz: -20,
    baseRateOffsetPct: -8,
    gender: 'شخصية أنمي',
    ageGroup: 'أنمي · بارد ومهيب',
    specialty: 'أشرار الأنمي والغموض',
    isCartoon: true,
    isAnime: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'gulf', 'iraqi', 'french', 'english'],
    description:
      'صوت عميق وبارد لشخصيات الأنمي الغامضة والأعداء الأقوياء في مسلسلات الأنمي والمانجا.',
    stylePrompt: 'Cold, calculating, deep intimidating anime villain voice',
    sampleText:
      'هل ظننت حقاً أنك تستطيع هزيمتي بهذه البساطة؟ كل خطواتك كانت جزءاً من خطتي منذ البداية.',
    accentColor: '#1E1B4B',
  },
  {
    id: 'sakura-anime',
    nameAr: 'ساكورا النجمة (بطلة أنمي)',
    geminiVoice: 'Zephyr',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-LB-LaylaNeural',
        egyptian: 'ar-EG-SalmaNeural',
        french: 'fr-FR-EloiseNeural',
        english: 'en-US-AnaNeural',
      },
      { male: false }
    ),
    basePitchHz: 19,
    baseRateOffsetPct: 8,
    gender: 'شخصية أنمي',
    ageGroup: 'أنمي · مشرقة وعاطفية',
    specialty: 'شخصيات أنمي نسائية',
    isCartoon: true,
    isAnime: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'egyptian', 'levantine', 'french', 'english'],
    description:
      'صوت أنمي أنثوي نابض بالحيوية والمشاعر، مصمم لبطلات الأنمي والدبلجة التعبيرية الدقيقة.',
    stylePrompt: 'Bright, expressive, emotional female anime heroine voice',
    sampleText:
      'انظروا إلى السماء! لقد تحقق الحلم الذي انتظرناه طويلاً، لننطلق معاً نحو المغامرة الجديدة!',
    accentColor: '#7C3AED',
  },
  {
    id: 'kaito-anime',
    nameAr: 'كايتو المحقق (أنمي ذكي)',
    geminiVoice: 'Puck',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-SY-LaithNeural',
        levantine: 'ar-JO-TaimNeural',
        french: 'fr-FR-RemyMultilingualNeural',
        english: 'en-GB-RyanNeural',
      },
      { male: true }
    ),
    basePitchHz: 8,
    baseRateOffsetPct: 12,
    gender: 'شخصية أنمي',
    ageGroup: 'أنمي · حاد الذكاء وسريع',
    specialty: 'أنمي التحقيق والألغاز',
    isCartoon: true,
    isAnime: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'levantine', 'moroccan', 'french', 'english'],
    description:
      'نبرة ذكية وسريعة البديهة تناسب شخصيات المحققين والعباقرة في أعمال الأنمي البوليسية.',
    stylePrompt: 'Sharp, quick-witted, confident anime detective strategist voice',
    sampleText:
      'الحقيقة واضحة تماماً أمام أعينكم، لكن الخيط الحقيقي للقضية كان مخفياً في التفاصيل الصغيرة!',
    accentColor: '#2563EB',
  },
  {
    id: 'kenji-anime',
    nameAr: 'المعلم كينجي (ساموراي أنمي)',
    geminiVoice: 'Fenrir',
    neuralVoices: buildDialectMap(
      {
        msa: 'ar-AE-HamdanNeural',
        gulf: 'ar-SA-HamedNeural',
        french: 'fr-CA-AntoineNeural',
        english: 'en-US-AndrewNeural',
      },
      { male: true }
    ),
    basePitchHz: -15,
    baseRateOffsetPct: -10,
    gender: 'شخصية أنمي',
    ageGroup: 'أنمي · ساموراي وقور',
    specialty: 'أنمي الساموراي والأساطير',
    isCartoon: true,
    isAnime: true,
    languageTag: 'multi',
    recommendedDialects: ['msa', 'gulf', 'iraqi', 'french', 'english'],
    description:
      'صوت أسطوري وقور لشخصيات الساموراي والمدربين الحكماء في أنمي الفنون القتالية.',
    stylePrompt: 'Wise, stern, commanding anime samurai sensei voice',
    sampleText:
      'تنفّس بهدوء واستمع لصوت السيف، فمن يسيطر على غضبه يملك زمام المعركة بأكملها.',
    accentColor: '#0F172A',
  },
];

export const ARABIC_DIALECTS: ArabicDialect[] = [
  {
    id: 'msa',
    nameAr: 'العربية الفصحى',
    region: 'فصحى معاصرة',
    langCode: 'ar',
    promptDescription:
      'Modern Standard Arabic (Al-Fusha) with crisp, formal, accurate Arabic diacritics and articulation',
    sampleScript:
      'أهلاً بكم في صوت ستوديو، موقع توليد الصوت المجاني بالذكاء الاصطناعي. اكتب أي نص عربي أو أجنبي وحوّله إلى كلام واقعي في ثوانٍ.',
  },
  {
    id: 'moroccan',
    nameAr: 'الدارجة المغربية',
    region: 'المغرب',
    langCode: 'ar',
    promptDescription:
      'Authentic Moroccan Arabic (Darija), natural Maghrebi pronunciation, rhythm, and intonation',
    sampleScript:
      'مرحبا بكم معانا فصوت ستوديو! دابا تقدر تحول أي كتابة أو قصة لصوت طبيعي بزاف بالدارجة المغربية مجاناً وبلا حدود.',
  },
  {
    id: 'egyptian',
    nameAr: 'اللهجة المصرية',
    region: 'مصر',
    langCode: 'ar',
    promptDescription:
      'Authentic colloquial Egyptian Arabic (Masri / Cairo dialect), natural everyday Egyptian pronunciation and cadence',
    sampleScript:
      'أهلاً بيكم في صوت ستوديو! دلوقتي تقدر تحوّل أي كلام مكتوب أو قصة طويلة لصوت طبيعي جداً باللهجة المصرية مجاناً.',
  },
  {
    id: 'gulf',
    nameAr: 'اللهجة الخليجية',
    region: 'السعودية والخليج',
    langCode: 'ar',
    promptDescription:
      'Authentic Gulf / Saudi Najdi-Hijazi Arabic dialect (Khaleeji), warm natural Gulf pronunciation and rhythm',
    sampleScript:
      'يا هلا ومرحبا بكم جميعاً، اليوم نقدر نسمع النصوص والقصص العربية بلهجة خليجية أصيلة وواضحة وبجودة استوديو.',
  },
  {
    id: 'levantine',
    nameAr: 'اللهجة الشامية',
    region: 'سوريا ولبنان والأردن',
    langCode: 'ar',
    promptDescription:
      'Authentic Levantine Arabic dialect (Shami / Syrian-Lebanese), smooth melodic Levantine pronunciation',
    sampleScript:
      'يسعد أوقاتكم بكل خير! صار فينا نحول أي نص مكتوب لصوت دافي وطبيعي باللهجة الشامية وبأعلى جودة ممكنة.',
  },
  {
    id: 'iraqi',
    nameAr: 'اللهجة العراقية',
    region: 'العراق',
    langCode: 'ar',
    promptDescription:
      'Authentic Iraqi Arabic dialect (Baghdadi / Mesopotamian), warm expressive Iraqi cadence',
    sampleScript:
      'هلا بيكم حبايبي، اليوم صارت عملية تحويل الكتابة والقصص إلى صوت عراقي دافي وواضح كلش سهلة ومجانية.',
  },
  {
    id: 'tunisian',
    nameAr: 'اللهجة التونسية',
    region: 'تونس',
    langCode: 'ar',
    promptDescription:
      'Authentic Tunisian Arabic dialect with clear local rhythm and natural Tunisian pronunciation',
    sampleScript:
      'عسلامة الناس الكل! تنجم توّة تكتب أي نص وتسمعو بصوت تونسي طبيعي ومزيان مجاناً وبلا حتى قيود.',
  },
  {
    id: 'algerian',
    nameAr: 'اللهجة الجزائرية',
    region: 'الجزائر',
    langCode: 'ar',
    promptDescription:
      'Authentic Algerian Arabic dialect with clear Maghrebi rhythm and natural pronunciation',
    sampleScript:
      'سلام خاوتي ومرحبا بكم! دوكا تقدروا تحولو أي نص إلى صوت جزائري واضح وطبيعي مجاناً في ثواني.',
  },
  {
    id: 'libyan',
    nameAr: 'اللهجة الليبية',
    region: 'ليبيا',
    langCode: 'ar',
    promptDescription: 'Authentic Libyan Arabic dialect with natural cadence',
    sampleScript:
      'أهلاً وسهلاً بكم! اليوم تقدر تحول أي كتابة لصوت ليبي واضح وطبيعي مجاناً وبدون أي حدود للكلمات.',
  },
  {
    id: 'yemeni',
    nameAr: 'اللهجة اليمنية',
    region: 'اليمن',
    langCode: 'ar',
    promptDescription: 'Authentic Yemeni Arabic dialect with warm expressive cadence',
    sampleScript:
      'حياكم الله جميعاً! يمكنكم الآن تحويل النصوص والحكايات إلى صوت عربي أصيل بلهجة يمنية واضحة ومجانية.',
  },
  {
    id: 'french',
    nameAr: 'اللغة الفرنسية',
    region: 'Français',
    langCode: 'fr',
    promptDescription: 'Native realistic French language voice with Parisian pronunciation',
    sampleScript:
      'Bienvenue sur Sawt Studio ! Transformez gratuitement vos textes français en voix humaine réaliste et téléchargez le fichier audio MP3.',
  },
  {
    id: 'english',
    nameAr: 'اللغة الإنجليزية',
    region: 'English',
    langCode: 'en',
    promptDescription: 'Native realistic English language voice with natural studio inflection',
    sampleScript:
      'Welcome to Sawt Studio, your free unlimited AI voice generator. Convert any English text into natural speech and download MP3 instantly.',
  },
];

export const VOICE_TONES: VoiceTone[] = [
  {
    id: 'storyteller',
    nameAr: 'سرد قصص هادئ',
    shortDesc: 'عميق وبشري بدون استعجال (Adam)',
    promptDescription: 'Calm, unhurried, crystal-clear master audiobook storyteller like Adam',
    pitchOffsetHz: -2,
    rateOffsetPct: -5,
  },
  {
    id: 'warm_narrator',
    nameAr: 'سردي دافئ',
    shortDesc: 'مناسب للقصص والوثائقيات',
    promptDescription: 'Warm, engaging, empathetic storytelling tone',
    pitchOffsetHz: -1,
    rateOffsetPct: -2,
  },
  {
    id: 'news',
    nameAr: 'إخباري رسمي',
    shortDesc: 'رصين ومباشر للنشرات',
    promptDescription: 'Crisp, authoritative, neutral news broadcast tone',
    pitchOffsetHz: 0,
    rateOffsetPct: 0,
  },
  {
    id: 'conversational',
    nameAr: 'حواري طبيعي',
    shortDesc: 'عفوي ومقارب للحديث اليومي',
    promptDescription: 'Relaxed, authentic everyday conversational tone',
    pitchOffsetHz: 1,
    rateOffsetPct: 0,
  },
  {
    id: 'energetic',
    nameAr: 'حماسي إعلاني',
    shortDesc: 'حيوي ومقنع للتسويق والكرتون',
    promptDescription: 'Upbeat, enthusiastic, persuasive commercial or cartoon tone',
    pitchOffsetHz: 4,
    rateOffsetPct: 6,
  },
  {
    id: 'calm',
    nameAr: 'هادئ وتأملي',
    shortDesc: 'مريح وبطيء للتركيز',
    promptDescription: 'Soft, tranquil, calming meditative tone',
    pitchOffsetHz: -3,
    rateOffsetPct: -7,
  },
  {
    id: 'dramatic',
    nameAr: 'درامي مؤثر',
    shortDesc: 'عميق وحسي للمشاهد',
    promptDescription: 'Deeply expressive, cinematic, dramatic emotional tone',
    pitchOffsetHz: -4,
    rateOffsetPct: -4,
  },
];

import { useState } from 'react';
import {
  ChevronDown,
  Globe2,
  Headphones,
  Mic,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface FaqSeoSectionProps {
  onSelectVoiceCategory?: (
    voiceId: string,
    dialectId?: 'msa' | 'french' | 'english' | 'moroccan'
  ) => void;
  onOpenPrivacy?: () => void;
  compact?: boolean;
}

const FAQ_ITEMS = [
  {
    q: 'كيف أستخدم موقع تحويل نص إلى كلام مجاناً بدون حدود أو تسجيل؟',
    a: 'اكتب أو الصق النص بأي طول في المحرر (بدون حد أقصى للكلمات)، اختر الصوت واللهجة العربية أو الفرنسية أو الإنجليزية، واضغط على «توليد الصوت» للاستماع الفوري وتنزيل ملف MP3 مجاناً بدون تسجيل حساب أو اشتراك.',
  },
  {
    q: 'ما هي اللهجات العربية واللغات المدعومة في صوت ستوديو؟',
    a: 'يدعم الموقع العربية الفصحى وجميع اللهجات العربية الواقعية: الدارجة المغربية، اللهجة المصرية، الخليجية (السعودية والإمارات والكويت وقطر والبحرين وعُمان)، الشامية (سوريا ولبنان والأردن)، العراقية، التونسية، الجزائرية، الليبية، واليمنية — بالإضافة إلى اللغة الفرنسية واللغة الإنجليزية.',
  },
  {
    q: 'هل يدعم الموقع استنساخ الصوت مجاناً من الهاتف؟',
    a: 'نعم، يضم الموقع استوديو استنساخ الصوت مجاناً عبر التسجيل المباشر من ميكروفون الهاتف أو رفع ملف صوتي قصير، مع إمكانية التحدث بالصوت المستنسخ بجميع اللهجات العربية والفرنسية والإنجليزية.',
  },
  {
    q: 'هل يحتوي الموقع على أصوات كرتون وأنمي وأصوات سرد قصص مثل آدم وبريان؟',
    a: 'نعم، يوفر صوت ستوديو أصوات سرد قصص شهيرة مثل آدم وبريان وراشيل، إلى جانب قسم مخصص لأصوات الكرتون وشخصيات الأنمي مثل شينوبي وأكيو وساكورا وكايتو لدبلجة الفيديوهات والقصص والريلز.',
  },
  {
    q: 'هل يوجد حد يومي للكلمات أو علامة مائية على ملفات MP3؟',
    a: 'لا، الخدمة مجانية 100% ومفتوحة بدون حدود لعدد الكلمات أو الرصيد اليومي، ويتم تقسيم النصوص الطويلة والكتب والمقالات تلقائياً وتنزيلها بصيغة MP3 نظيفة تماماً.',
  },
  {
    q: 'هل يمكنني استخدام الصوتيات المولدة في يوتيوب وتيك توك والمشاريع؟',
    a: 'نعم، يمكنك تحميل جميع المقاطع الصوتية بصيغة MP3 عالية الجودة مجاناً واستخدامها في فيديوهات يوتيوب، الريلز، تيك توك، البودكاست، الدروس التعليمية، والمشاريع الرقمية.',
  },
];

const HOW_TO_STEPS = [
  {
    step: '01',
    title: 'أدخل النص بأي طول بدون قيود',
    desc: 'الصق مقالاً طويلاً، سيناريو يوتيوب، قصة، أو جملة قصيرة بالعربية أو الدارجة أو الفرنسية أو الإنجليزية دون أي حد يومي للكلمات.',
  },
  {
    step: '02',
    title: 'اختر المتحدث واللهجة أو استنسخ صوتك',
    desc: 'اختر من أصوات السرد (آدم، بريان، راشيل)، أصوات الأنمي والكرتون، أو استعمل بصمتك الصوتية المستنسخة عبر الميكروفون.',
  },
  {
    step: '03',
    title: 'حوّل النص إلى صوت وحمّل MP3 فوراً',
    desc: 'اضغط على توليد الصوت للحصول على تلاوة بشرية طبيعية مع تحكم بالسرعة والنبرة وتنزيل ملف MP3 مجاناً.',
  },
];

const SHOWCASE_CARDS = [
  {
    title: 'تحويل النص إلى كلام عربي واقعي (آدم وبريان)',
    desc: 'أصوات سرد قصص هادئة ووثائقية مثل آدم وبريان وراشيل لقراءة الكتب والمقالات واليوتيوب بدون أخطاء أو تقطيع.',
    image: '/src/assets/images/voice_studio_banner_1795446507417.jpg',
    alt: 'ميكروفون احترافي في صوت ستوديو لتحويل النص إلى كلام مجاناً بدون حدود',
    voiceId: 'adam-storyteller',
    dialectId: 'msa' as const,
    cta: 'جرب صوت آدم الفصيح',
  },
  {
    title: 'أصوات الأنمي والكرتون للدبلجة المجانية',
    desc: 'شخصيات أنمي وكرتون بنبرات حماسية وطفولية وكوميدية لدبلجة الرسوم المتحركة والأنيميشن بجميع اللهجات واللغات.',
    image: '/src/assets/images/cartoon_voices_art_1795446500230.jpg',
    alt: 'أصوات كرتون وأنمي بالذكاء الاصطناعي مجاناً للدبلجة',
    voiceId: 'tom-cartoon',
    dialectId: 'msa' as const,
    cta: 'جرب أصوات الكرتون والأنمي',
  },
  {
    title: 'جميع اللهجات العربية والفرنسية والإنجليزية',
    desc: 'ناطق عربي مجاني يدعم الدارجة المغربية، المصرية، الخليجية، التونسية، الجزائرية، العراقية، الشامية، الفرنسية والإنجليزية.',
    image: '/src/assets/images/podcast_dialogue_studio_1795446500438.jpg',
    alt: 'استوديو بودكاست وحوار متعدد اللغات واللهجات العربية',
    voiceId: 'henri-french',
    dialectId: 'french' as const,
    cta: 'جرب اللغة الفرنسية',
  },
];

export function FaqSeoSection({
  onSelectVoiceCategory,
  onOpenPrivacy,
  compact = false,
}: FaqSeoSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      aria-label="دليل تحويل النص إلى كلام مجاناً بدون حدود"
      className={compact ? 'mx-auto max-w-6xl space-y-6 pt-4' : 'mx-auto max-w-5xl space-y-8'}
    >
      {/* Visual Studio Showcase Cards */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/90 pb-4">
          <div className="space-y-2">
            <BrandLogo variant="hero" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              أفضل موقع تحويل نص إلى كلام مجاناً بدون حدود بالذكاء الاصطناعي
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              حوّل الكتابة إلى صوت بشري واقعي بجميع اللهجات العربية والفرنسية والإنجليزية، مع استنساخ الصوت وأصوات الأنمي والكرتون وتنزيل MP3 مباشر بدون تسجيل.
            </p>
          </div>
          {onOpenPrivacy && (
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>سياسة الخصوصية</span>
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {SHOWCASE_CARDS.map((card) => (
            <article
              key={card.title}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-[#0D1322]"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {!failedImages[card.image] ? (
                  <img
                    src={card.image}
                    alt={card.alt}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [card.image]: true }))
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-indigo-400">
                    <Headphones className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {card.desc}
                  </p>
                </div>
                {onSelectVoiceCategory && (
                  <button
                    type="button"
                    onClick={() => onSelectVoiceCategory(card.voiceId, card.dialectId)}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white whitespace-nowrap"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{card.cta}</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Capabilities & Semantic SEO Coverage Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Globe2 className="h-4 w-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              جميع اللهجات العربية والعالمية
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            تحويل النص إلى كلام بالفصحى، الدارجة المغربية، المصرية، الخليجية، الشامية، العراقية، التونسية، الجزائرية، الليبية، اليمنية، الفرنسية، والإنجليزية.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Mic className="h-4 w-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              استنساخ الصوت مجاناً
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            سجّل عينة صوتية قصيرة مباشرة من ميكروفون الهاتف أو ارفع ملفاً صوتياً لتوليد كلام بنفس نبرة صوتك بأي لهجة ولغة.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              أصوات أنمي وكرتون وسرد قصص
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            مكتبة مجانية تضم أصوات سرد قصص مثل آدم وبريان وراشيل مع شخصيات أنمي وكرتون لدبلجة اليوتيوب والريلز وتيك توك.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              تحويل بدون حدود وخصوصية تامة
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            تحويل نص إلى صوت مجاناً بدون حدود كلمات أو تسجيل دخول، مع تنزيل MP3 فوري وحفظ السجل محلياً على جهازك فقط.
          </p>
        </article>
      </div>

      {/* How-To Guide matching Schema.org HowTo */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5 sm:p-6">
        <div className="border-b border-slate-100 dark:border-slate-800/90 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            كيف تحوّل النص إلى كلام مجاناً بدون حدود في 3 خطوات
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            دليل سريع لاستخدام ناطق صوت ستوديو لتوليد تعليق صوتي احترافي MP3 في ثوانٍ.
          </p>
        </div>
        <ol className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOW_TO_STEPS.map((item) => (
            <li
              key={item.step}
              className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-[#0D1322]"
            >
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                خطوة {item.step}
              </span>
              <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {item.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Strong Google-Indexed FAQ Accordion matching Schema.org FAQPage */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-5 sm:p-6">
        <div className="border-b border-slate-100 dark:border-slate-800/90 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            الأسئلة الشائعة حول تحويل النص إلى كلام مجاناً بدون حدود
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            إجابات واضحة حول تحويل الكتابة إلى صوت عربي، الدارجة المغربية، الفرنسية والإنجليزية، استنساخ الصوت، وأصوات الأنمي والكرتون وتنزيل MP3.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.q} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 text-right text-sm font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

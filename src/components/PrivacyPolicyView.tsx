import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onGoToStudio: () => void;
}

export function PrivacyPolicyView({ onGoToStudio }: PrivacyPolicyViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/90 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                سياسة الخصوصية — صوت ستوديو (موقع توليد صوت مجاناً)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                آخر تحديث: نوفمبر 2026 · التزام كامل بحماية بيانات المستخدمين
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToStudio}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 whitespace-nowrap shrink-0"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>العودة إلى الاستوديو</span>
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1. نظرة عامة على الخصوصية
            </h3>
            <p className="mt-2">
              نحن في <strong>صوت ستوديو — موقع توليد صوت مجاناً</strong> نحترم خصوصيتك بالكامل. تتيح لك المنصة تحويل النصوص المكتوبة باللغة العربية وجميع لهجاتها، واللغة الفرنسية، واللغة الإنجليزية، وأصوات الكرتون إلى ملفات صوتية مجانية دون الحاجة لإنشاء حساب أو تقديم بيانات شخصية.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              2. معالجة النصوص والملفات الصوتية
            </h3>
            <ul className="mt-2 list-disc space-y-2 pr-5">
              <li>
                تُعالج النصوص المدخلة لحظياً فقط لغرض تحويلها إلى صوت وإرجاع الملف الصوتي لك بصيغة MP3 أو WAV.
              </li>
              <li>
                لا نقوم ببيع أو مشاركة أو تخزين نصوصك الخاصة أو تسجيلاتك الصوتية بشكل دائم في قواعد بيانات عامة.
              </li>
              <li>
                <strong>عينات استنساخ الصوت:</strong> عند تسجيل صوتك عبر الميكروفون أو رفع ملف صوتي لاستنساخ نبرة الصوت، يتم تحليل الخصائص الصوتية لحظياً ولا يتم الاحتفاظ بالتسجيلات الأصلية على خوادم خارجية.
              </li>
              <li>
                <strong>سجل التوليدات:</strong> يتم حفظ المقاطع الصوتية الأخيرة محلياً داخل متصفحك (عبر{' '}
                <code className="text-indigo-600 dark:text-indigo-400">localStorage</code> على جهازك أنت فقط)، ويمكنك حذف أي مقطع أو مسحه في أي وقت بضغطة زر.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              3. حقوق استخدام الصوتيات المولدة
            </h3>
            <p className="mt-2">
              يمكنك تنزيل الملفات الصوتية المولدة واستخدامها مجاناً في مقاطع الفيديو التعليمية، قنوات اليوتيوب، البودكاست، القصص، الرسوم المتحركة، والمشاريع الإبداعية مع الالتزام بعدم استخدام الخدمة في انتحال هوية أشخاص حقيقيين أو إنتاج محتوى يضر بالآخرين أو يخالف القوانين.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              4. ملفات تعريف الارتباط والأمان
            </h3>
            <p className="mt-2">
              لا يفرض الموقع تتبعاً إعلانياً متطفلاً، كما يتم تأمين جميع الاتصالات عبر بروتوكولات مشفرة لحماية النصوص المرسلة أثناء المعالجة الصوتية الفورية.
            </p>
          </section>

          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p>
              باستخدامك لموقع <strong>صوت ستوديو</strong> لتحويل النص إلى صوت مجاناً، فإنك توافق على هذه السياسة الواضحة والشفافة. يمكنك التوقف عن استخدام الخدمة أو مسح سجل المتصفح المحلي في أي وقت.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

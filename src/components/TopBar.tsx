import {
  AudioLines,
  HelpCircle,
  Menu,
  MessagesSquare,
  Mic,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import { WorkspaceTab } from '../types/tts';
import { BrandLogo } from './BrandLogo';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenMobileMenu: () => void;
  onNewProject: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const TAB_TITLES: Record<WorkspaceTab, string> = {
  studio: 'موقع توليد صوت مجاناً بالذكاء الاصطناعي',
  clone: 'استنساخ الصوت بالبصمة الصوتية مجاناً',
  dialogue: 'استوديو الحوار متعدد المتحدثين',
  voices: 'مكتبة الأصوات العربية والعالمية والكرتون',
  history: 'سجل التوليدات الصوتية',
  faq: 'الأسئلة الشائعة ودليل الاستخدام',
  privacy: 'سياسة الخصوصية',
};

export function TopBar({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onNewProject,
  theme,
  onToggleTheme,
}: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#0D1322] px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden shrink-0"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden shrink-0">
          <BrandLogo variant="compact" onClick={() => onSelectTab('studio')} />
        </div>

        <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
          <span className="text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap shrink-0">
            توليد كلام من نص مجاناً
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <h1 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900/90 dark:border dark:border-slate-800 p-1">
          <button
            type="button"
            onClick={() => onSelectTab('studio')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'studio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <AudioLines className="h-3.5 w-3.5" />
            <span>توليد صوت</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('clone')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'clone'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>استنساخ الصوت</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('voices')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'voices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">الأصوات والكرتون</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('dialogue')}
            className={`hidden md:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dialogue'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <MessagesSquare className="h-3.5 w-3.5" />
            <span>حوار</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('faq')}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'faq'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>أسئلة</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('privacy')}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>الخصوصية</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-amber-400 dark:hover:bg-slate-800 shrink-0"
          title={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي الاحترافي'}
          aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onNewProject}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>نص جديد</span>
        </button>
      </div>
    </header>
  );
}

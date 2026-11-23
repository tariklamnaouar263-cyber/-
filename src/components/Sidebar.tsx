import {
  AudioLines,
  HelpCircle,
  History,
  MessagesSquare,
  Mic,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { WorkspaceTab } from '../types/tts';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  historyCount: number;
  clonedVoicesCount?: number;
  totalCharsProcessed: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof AudioLines;
}> = [
  { id: 'studio', label: 'تحويل النص إلى صوت', icon: AudioLines },
  { id: 'clone', label: 'استنساخ الصوت', icon: Mic },
  { id: 'dialogue', label: 'استوديو الحوار', icon: MessagesSquare },
  { id: 'voices', label: 'مكتبة الأصوات والكرتون', icon: Users },
  { id: 'history', label: 'سجل التوليدات', icon: History },
  { id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
  { id: 'privacy', label: 'سياسة الخصوصية', icon: ShieldCheck },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  historyCount,
  clonedVoicesCount = 0,
  totalCharsProcessed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#0D1322] transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800/90 px-4">
          <BrandLogo
            variant="full"
            onClick={() => {
              onSelectTab('studio');
              onCloseMobile();
            }}
          />
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="التنقل الرئيسي">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const countVal =
              item.id === 'history'
                ? historyCount
                : item.id === 'clone'
                  ? clonedVoicesCount
                  : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 dark:bg-indigo-600 dark:text-white'
                    : 'text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-950 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? 'text-indigo-100'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {countVal > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {countVal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800/90 p-4">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            إحصائيات الجلسة
          </p>
          <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>المقاطع المولدة</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {historyCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>الأحرف المعالجة</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalCharsProcessed.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

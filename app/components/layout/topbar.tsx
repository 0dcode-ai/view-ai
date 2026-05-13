import { RefreshCcw } from "lucide-react";
import { navGroups, navItems, type TabKey } from "@/app/types";
import { cn } from "@/lib/utils";

interface TopbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onRefresh: () => void;
}

export function Topbar({ activeTab, onTabChange, onRefresh }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/78 shadow-[0_10px_30px_rgba(30,78,121,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <button
            type="button"
            onClick={() => onTabChange("home")}
            className="flex shrink-0 items-center gap-2 rounded-lg px-1 text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#2f80ed,#75d4ff)] text-sm font-black text-white shadow-[0_10px_22px_rgba(47,128,237,0.28)]">
              AI
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold text-slate-950">InterviewOS</span>
              <span className="block text-[11px] font-medium text-slate-500">本地优先面试训练台</span>
            </span>
          </button>
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-sky-100 bg-sky-50/70 p-1">
            {navGroups.map((group) => (
              <div key={group.key} className="flex items-center gap-1">
                {navItems
                  .filter((item) => item.group === group.key)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onTabChange(item.key)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                          activeTab === item.key
                            ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-100"
                            : "text-slate-500 hover:bg-white/72 hover:text-slate-900",
                        )}
                      >
                        <Icon size={15} />
                        {item.label}
                      </button>
                    );
                  })}
              </div>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="shrink-0 rounded-lg border border-sky-100 bg-white p-2 text-sky-700 shadow-sm transition-colors hover:bg-sky-50"
          aria-label="刷新数据"
        >
          <RefreshCcw size={16} />
        </button>
      </div>
    </header>
  );
}

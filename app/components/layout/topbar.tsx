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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Interview AI
          </span>
          <nav className="flex items-center gap-1">
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
                          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          activeTab === item.key
                            ? "bg-primary-soft text-primary hover:text-primary-hover"
                            : "text-muted hover:bg-slate-50 hover:text-foreground",
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
          className="rounded-lg p-2 text-muted transition-colors hover:bg-slate-50 hover:text-foreground"
        >
          <RefreshCcw size={16} />
        </button>
      </div>
    </header>
  );
}

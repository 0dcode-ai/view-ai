import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-lg border border-sky-100 bg-white/95 px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
export const textareaCls =
  "w-full rounded-lg border border-sky-100 bg-white/95 px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 min-h-[112px] resize-y leading-relaxed";
export const btnPrimary =
  "flex items-center justify-center gap-2 rounded-lg bg-[linear-gradient(110deg,#2f80ed_0%,#46a3ff_52%,#75d4ff_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,128,237,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(47,128,237,0.28)] disabled:translate-y-0 disabled:opacity-60";
export const btnSecondary =
  "flex items-center justify-center gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 disabled:opacity-60";
export const btnGhost =
  "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-60";
export const compactSelectCls = cn(inputCls, "!w-[170px] min-w-[170px]");
export const heroGradientCls = "bg-[linear-gradient(135deg,#eef7ff_0%,#f8fbff_48%,#e7f7ff_100%)] shadow-[0_24px_70px_rgba(47,128,237,0.16)]";
export const softGradientCls = "bg-[linear-gradient(135deg,#f8fbff_0%,#eef7ff_56%,#f5fbff_100%)]";
export const progressGradientCls = "bg-[linear-gradient(90deg,#2f80ed_0%,#46a3ff_58%,#8ee6d8_100%)]";
export const messageGradientCls = "bg-[linear-gradient(120deg,#2f80ed_0%,#38a1ff_62%,#67d5ff_100%)]";

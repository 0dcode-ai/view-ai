export function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      加载中...
    </div>
  );
}

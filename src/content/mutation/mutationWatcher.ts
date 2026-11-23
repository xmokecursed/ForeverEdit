export interface MutationWatcher {
  pause(): void;
  resume(): void;
  stop(): void;
}

export function watchForMutations(onSettled: () => void, debounceMs = 300): MutationWatcher {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((m) => {
      const target = m.target as Element;
      if (target.id === "fe-toolbar-root" || target.id === "fe-style-panel-root") return false;
      if (target.closest?.("#fe-toolbar-root, #fe-style-panel-root")) return false;
      return true;
    });
    if (!relevant) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(onSettled, debounceMs);
  });

  function resume() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  resume();

  return {
    pause: () => observer.disconnect(),
    resume,
    stop: () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    }
  };
}

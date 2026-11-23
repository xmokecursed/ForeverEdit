import type { Operation, RuntimeMessage, SiteEditSet } from "@shared/types";
import { bestPatternMatch, defaultPatternFor } from "@shared/urlPattern";
import { hasSeenOnboarding, markOnboardingSeen } from "@shared/storage";
import { buildFingerprint } from "@content/selectors/fingerprint";
import { replayOperations, revertToOriginal } from "@content/replay/replayEngine";
import { clearPristineRegistry } from "@content/replay/pristine";
import { watchForMutations, type MutationWatcher } from "@content/mutation/mutationWatcher";
import { Toolbar, type ToolbarAction, type ToolbarState } from "@content/toolbar/toolbar";
import { StylePanel } from "@content/style/stylePanel";
import { HistoryStack } from "./history";
import { startElementDrag } from "@content/drag/dragEngine";
import { PINNED_CLASS } from "./pin";

const IGNORE_SELECTOR = "#fe-toolbar-root, #fe-style-panel-root, #fe-drop-indicator";
const TEXT_ENTRY_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export class EditorController {
  private pattern: string;
  private history!: HistoryStack;
  private toolbar: Toolbar;
  private stylePanel: StylePanel;
  private editModeOn = false;
  private siteEnabled = true;
  private helpOpen = false;
  private dragging = false;
  private activeTool: ToolbarAction | null = null;
  private hovered: Element | null = null;
  private selectedElements: Element[] = [];
  private savedOperations: Operation[] = [];
  private mutationWatcher: MutationWatcher | null = null;
  private suppressInterception = false;

  constructor() {
    this.pattern = defaultPatternFor(location.href);
    this.toolbar = new Toolbar((action) => this.handleToolbarAction(action));
    this.stylePanel = new StylePanel(
      (css) => this.previewStyle(this.selectedElements as HTMLElement[], css),
      () => this.commitStyle(this.selectedElements as HTMLElement[])
    );

    document.addEventListener("pointerdown", this.onInterceptPointerDown, true);
    document.addEventListener("click", this.onInterceptClick, true);
    document.addEventListener("mouseover", this.onHoverOver, true);
    document.addEventListener("mouseout", this.onHoverOut, true);
    window.addEventListener("keydown", this.onKeyDown, true);

    chrome.runtime.onMessage.addListener((msg: RuntimeMessage) => {
      if (msg.kind === "TOGGLE_EDIT_MODE_REQUEST") this.toggleEditMode();
      if (msg.kind === "SET_SITE_ENABLED_LIVE") {
        this.siteEnabled = msg.enabled;
        if (msg.enabled) {
          this.runReplay();
        } else {
          this.mutationWatcher?.pause();
          revertToOriginal();
          this.mutationWatcher?.resume();
        }
      }
    });

    window.addEventListener("beforeunload", () => {
      if (this.isDirty()) this.saveNow();
    });
  }

  async init(): Promise<void> {
    const state = await this.getStateFromBackground();
    if (!state.globallyEnabled) return;

    const siteEditSet = state.siteEditSet;
    this.pattern = siteEditSet ? bestPatternMatch(location.href, [siteEditSet.pattern]) : this.pattern;
    this.siteEnabled = siteEditSet?.enabled ?? true;

    this.history = new HistoryStack(siteEditSet?.operations ?? [], () => this.onHistoryChange());
    this.savedOperations = [...this.history.operations];

    if (this.siteEnabled) this.runReplay();

    this.mutationWatcher = watchForMutations(() => {
      if (this.siteEnabled) this.runReplay();
    });
  }

  private runReplay(): void {
    this.mutationWatcher?.pause();
    replayOperations(this.history.operations);
    this.mutationWatcher?.resume();
    for (const el of this.selectedElements) el.classList.add("fe-selected");
    if (this.hovered) this.hovered.classList.add("fe-hover-highlight");
  }

  private onHistoryChange(): void {
    this.runReplay();
    this.refreshToolbar();
  }

  private async getStateFromBackground(): Promise<{ siteEditSet: SiteEditSet | null; globallyEnabled: boolean }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { kind: "GET_STATE", pattern: this.pattern } satisfies RuntimeMessage,
        (res: RuntimeMessage) => {
          if (chrome.runtime.lastError) {
            resolve({ siteEditSet: null, globallyEnabled: true });
            return;
          }
          if (res && res.kind === "STATE") resolve({ siteEditSet: res.siteEditSet, globallyEnabled: res.globallyEnabled });
          else resolve({ siteEditSet: null, globallyEnabled: true });
        }
      );
    });
  }

  private handleToolbarAction(action: ToolbarAction): void {
    switch (action) {
      case "toggle-edit":
        this.toggleEditMode();
        return;
      case "help":
        this.toggleHelp();
        return;
      case "hide":
        if (this.selectedElements.length) this.doHide([...this.selectedElements]);
        return;
      case "pin":
        if (this.selectedElements.length) this.doPinToggle([...this.selectedElements]);
        return;
      case "style":
        if (this.stylePanel.isOpen()) this.stylePanel.close();
        else if (this.selectedElements.length) this.stylePanel.open(this.selectedElements as HTMLElement[]);
        return;
      case "move": {
        this.activeTool = this.activeTool === "move" ? null : "move";
        const primary = this.primarySelected();
        if (this.activeTool === "move" && primary) this.beginDrag(primary);
        this.refreshToolbar();
        return;
      }
      case "multiselect":
        this.activeTool = this.activeTool === "multiselect" ? null : "multiselect";
        this.refreshToolbar();
        return;
      case "text": {
        this.activeTool = this.activeTool === "text" ? null : "text";
        const primary = this.primarySelected();
        if (this.activeTool === "text" && primary) this.beginTextEdit(primary);
        this.refreshToolbar();
        return;
      }
      case "undo":
        this.history.undo();
        return;
      case "redo":
        this.history.redo();
        return;
      case "save":
        this.saveNow();
        return;
      case "reset":
        this.doReset();
        return;
      case "settings":
        chrome.runtime.openOptionsPage();
        return;
    }
  }

  private toggleEditMode(): void {
    this.editModeOn = !this.editModeOn;
    if (this.editModeOn) {
      this.toolbar.mount();
      this.refreshToolbar();
      void this.maybeShowWelcome();
    } else {
      this.activeTool = null;
      this.helpOpen = false;
      this.clearSelection();
      this.stylePanel.close();
      this.toolbar.unmount();
    }
  }

  private async maybeShowWelcome(): Promise<void> {
    try {
      if (await hasSeenOnboarding()) return;
      await markOnboardingSeen();
      this.toolbar.showWelcome();
    } catch {
      return;
    }
  }

  private toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
    this.toolbar.setHelpOpen(this.helpOpen);
  }

  private handleEscape(): void {
    if (this.helpOpen) {
      this.toggleHelp();
    } else if (this.stylePanel.isOpen()) {
      this.stylePanel.close();
    } else if (this.activeTool) {
      this.activeTool = null;
      this.refreshToolbar();
    } else if (this.selectedElements.length) {
      this.clearSelection();
      this.refreshToolbar();
    } else {
      this.toggleEditMode();
    }
  }

  private refreshToolbar(): void {
    const state: ToolbarState = {
      activeTool: this.activeTool,
      selectionCount: this.selectedElements.length,
      allSelectedPinned:
        this.selectedElements.length > 0 && this.selectedElements.every((el) => el.classList.contains(PINNED_CLASS)),
      dragging: this.dragging,
      canUndo: this.history?.canUndo() ?? false,
      canRedo: this.history?.canRedo() ?? false,
      dirty: this.isDirty()
    };
    this.toolbar.setState(state);
  }

  private isDirty(): boolean {
    if (!this.history) return false;
    return JSON.stringify(this.history.operations) !== JSON.stringify(this.savedOperations);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.editModeOn || this.suppressInterception || !this.history) return;
    const origin = (e.composedPath()[0] ?? e.target) as HTMLElement | null;
    if (origin && (TEXT_ENTRY_TAGS.has(origin.tagName) || origin.isContentEditable)) return;

    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let handled = true;

    if (key === "Escape") this.handleEscape();
    else if (mod && !e.altKey && key === "z") (e.shiftKey ? this.history.redo() : this.history.undo());
    else if (mod && !e.altKey && key === "y") this.history.redo();
    else if (mod && !e.altKey && key === "s") this.saveNow();
    else if (mod || e.altKey) handled = false;
    else if (key === "?") this.toggleHelp();
    else if (key === "ArrowUp") this.selectParent();
    else if (key === "ArrowDown") this.selectFirstChild();
    else if (key === "Delete" || key === "Backspace" || key === "h") this.handleToolbarAction("hide");
    else if (key === "m") this.handleToolbarAction("move");
    else if (key === "x") this.handleToolbarAction("multiselect");
    else if (key === "p") this.handleToolbarAction("pin");
    else if (key === "t") this.handleToolbarAction("text");
    else if (key === "s") this.handleToolbarAction("style");
    else handled = false;

    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    } else if (e.key.length === 1 && e.key !== " " && !mod && !e.altKey) {
      e.stopImmediatePropagation();
    }
  };

  private onHoverOver = (e: MouseEvent) => {
    if (!this.editModeOn) return;
    const el = e.target as Element;
    if (el.closest(IGNORE_SELECTOR)) return;
    if (this.hovered && this.hovered !== el) this.hovered.classList.remove("fe-hover-highlight");
    this.hovered = el;
    el.classList.add("fe-hover-highlight");
  };

  private onHoverOut = (e: MouseEvent) => {
    (e.target as Element).classList?.remove("fe-hover-highlight");
  };

  private onInterceptPointerDown = (e: PointerEvent) => {
    if (!this.editModeOn || this.suppressInterception) return;
    const el = e.target as Element;
    if (el.closest(IGNORE_SELECTOR)) return;
    e.preventDefault();
  };

  private onInterceptClick = (e: MouseEvent) => {
    if (!this.editModeOn || this.suppressInterception) return;
    const el = e.target as Element;
    if (el.closest(IGNORE_SELECTOR)) return;
    e.preventDefault();
    e.stopPropagation();

    if (this.activeTool === "move") {
      this.beginDrag(el);
      return;
    }
    if (this.activeTool === "text") {
      this.beginTextEdit(el);
      return;
    }

    this.selectElement(el, this.activeTool === "multiselect" || e.shiftKey);
  };

  private selectElement(el: Element, additive: boolean): void {
    if (additive) {
      const idx = this.selectedElements.indexOf(el);
      if (idx !== -1) {
        this.selectedElements.splice(idx, 1);
        el.classList.remove("fe-selected");
      } else {
        this.selectedElements.push(el);
        el.classList.add("fe-selected");
      }
    } else {
      this.dropSelection();
      this.selectedElements = [el];
      el.classList.add("fe-selected");
    }
    this.syncStylePanel();
    this.refreshToolbar();
  }

  private selectParent(): void {
    const parent = this.primarySelected()?.parentElement;
    if (parent && parent !== document.body && parent !== document.documentElement) {
      this.selectElement(parent, false);
    }
  }

  private selectFirstChild(): void {
    const child = this.primarySelected()?.firstElementChild;
    if (child && !child.matches(IGNORE_SELECTOR)) this.selectElement(child, false);
  }

  private dropSelection(): void {
    for (const el of this.selectedElements) el.classList.remove("fe-selected");
    this.selectedElements = [];
  }

  private clearSelection(): void {
    this.dropSelection();
    this.syncStylePanel();
  }

  private syncStylePanel(): void {
    if (!this.stylePanel.isOpen()) return;
    if (this.selectedElements.length) this.stylePanel.open(this.selectedElements as HTMLElement[]);
    else this.stylePanel.close();
  }

  private primarySelected(): Element | null {
    return this.selectedElements[this.selectedElements.length - 1] ?? null;
  }

  private commitOps(ops: Operation[]): void {
    if (ops.length === 0) return;
    this.history.commit([...this.history.operations, ...ops]);
  }

  private newSeq(offset = 0): number {
    return this.history.nextSeq() + offset;
  }

  private doHide(elements: Element[]): void {
    const ops = elements.map(
      (el, i): Operation => ({
        id: crypto.randomUUID(),
        type: "hide",
        target: buildFingerprint(el),
        createdAt: Date.now(),
        seq: this.newSeq(i)
      })
    );
    this.commitOps(ops);
    this.clearSelection();
    this.refreshToolbar();
  }

  private doPinToggle(elements: Element[]): void {
    const ops = elements.map((el, i): Operation => {
      const isPinned = el.classList.contains(PINNED_CLASS);
      const base = { id: crypto.randomUUID(), target: buildFingerprint(el), createdAt: Date.now(), seq: this.newSeq(i) };
      return isPinned ? { ...base, type: "unpin" } : { ...base, type: "pin", dockPosition: "bottom" };
    });
    this.commitOps(ops);
  }

  private beginTextEdit(el: Element): void {
    const original = el.textContent ?? "";
    const htmlEl = el as HTMLElement;
    htmlEl.contentEditable = "true";
    htmlEl.classList.add("fe-editable-text");
    this.suppressInterception = true;
    htmlEl.focus();

    const finish = () => {
      htmlEl.contentEditable = "false";
      htmlEl.classList.remove("fe-editable-text");
      this.suppressInterception = false;
      htmlEl.removeEventListener("blur", finish);
      htmlEl.removeEventListener("keydown", onKeydown);
      const newText = htmlEl.textContent ?? "";
      if (newText !== original) {
        this.commitOps([
          {
            id: crypto.randomUUID(),
            type: "text",
            target: buildFingerprint(el),
            newText,
            originalText: original,
            createdAt: Date.now(),
            seq: this.newSeq()
          }
        ]);
      }
    };
    const onKeydown = (ke: KeyboardEvent) => {
      if (ke.key === "Enter" && !ke.shiftKey) {
        ke.preventDefault();
        htmlEl.blur();
      }
      if (ke.key === "Escape") {
        htmlEl.textContent = original;
        htmlEl.blur();
      }
    };
    htmlEl.addEventListener("blur", finish);
    htmlEl.addEventListener("keydown", onKeydown);
  }

  private beginDrag(el: Element): void {
    this.suppressInterception = true;
    this.dragging = true;
    this.refreshToolbar();

    startElementDrag(el, (target) => {
      this.suppressInterception = false;
      this.dragging = false;
      if (!target) {
        this.refreshToolbar();
        return;
      }
      const beforeElFingerprint =
        target.position === "before"
          ? buildFingerprint(target.element)
          : target.position === "after"
          ? target.element.nextElementSibling
            ? buildFingerprint(target.element.nextElementSibling)
            : undefined
          : undefined;

      const newParent =
        target.position === "inside" ? target.element : target.element.parentElement ?? document.body;

      this.commitOps([
        {
          id: crypto.randomUUID(),
          type: "move",
          target: buildFingerprint(el),
          newParent: buildFingerprint(newParent),
          beforeSibling: beforeElFingerprint,
          createdAt: Date.now(),
          seq: this.newSeq()
        }
      ]);
    });
  }

  private previewStyle(elements: HTMLElement[], css: Record<string, string>): void {
    for (const el of elements) {
      for (const [prop, value] of Object.entries(css)) {
        el.style.setProperty(camelToKebab(prop), value, "important");
      }
    }
  }

  private commitStyle(elements: HTMLElement[]): void {
    const ops = elements.map((el, i): Operation => {
      const css: Record<string, string> = {};
      for (const prop of el.style) {
        css[prop] = el.style.getPropertyValue(prop);
      }
      return {
        id: crypto.randomUUID(),
        type: "style",
        target: buildFingerprint(el),
        css,
        createdAt: Date.now(),
        seq: this.newSeq(i)
      };
    });
    this.commitOps(ops);
  }

  private doReset(): void {
    if (!confirm("Remove all ForeverEdit customizations on this site?")) return;
    chrome.runtime.sendMessage({ kind: "RESET_SITE", pattern: this.pattern } satisfies RuntimeMessage, () => {
      void chrome.runtime.lastError;
      clearPristineRegistry();
      location.reload();
    });
  }

  private saveNow(): void {
    chrome.runtime.sendMessage(
      { kind: "SAVE_OPERATIONS", pattern: this.pattern, operations: this.history.operations } satisfies RuntimeMessage,
      () => {
        void chrome.runtime.lastError;
        this.savedOperations = [...this.history.operations];
        this.refreshToolbar();
      }
    );
  }
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

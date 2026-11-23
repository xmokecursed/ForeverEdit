import type { Operation } from "@shared/types";

export class HistoryStack {
  private undoStack: Operation[][] = [];
  private redoStack: Operation[][] = [];
  private current: Operation[];
  private onChange: (ops: Operation[]) => void;

  constructor(initial: Operation[], onChange: (ops: Operation[]) => void) {
    this.current = [...initial];
    this.onChange = onChange;
  }

  get operations(): Operation[] {
    return this.current;
  }

  commit(next: Operation[]): void {
    this.undoStack.push(this.current);
    this.redoStack = [];
    this.current = next;
    this.onChange(this.current);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(this.current);
    this.current = prev;
    this.onChange(this.current);
  }

  redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(this.current);
    this.current = next;
    this.onChange(this.current);
  }

  nextSeq(): number {
    return this.current.length ? Math.max(...this.current.map((o) => o.seq)) + 1 : 1;
  }
}

import { EditorController } from "@content/editor/editorController";

const controller = new EditorController();

function boot(): void {
  controller.init().catch((err) => {
    console.error("[ForeverEdit] failed to initialize:", err);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}


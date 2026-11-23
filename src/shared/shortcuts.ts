export type ShortcutGroup = "General" | "Tools" | "Selection" | "History";

export interface ShortcutDef {
  group: ShortcutGroup;
  keys: string[];
  description: string;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent);

export const MOD_KEY = isMac ? "⌘" : "Ctrl";
export const ALT_KEY = isMac ? "Option" : "Alt";

export const GROUP_ORDER: ShortcutGroup[] = ["General", "Tools", "Selection", "History"];

export const SHORTCUTS: ShortcutDef[] = [
  { group: "General", keys: [ALT_KEY, "Shift", "E"], description: "Turn Edit Mode on or off" },
  { group: "General", keys: ["?"], description: "Show or hide this shortcut list" },
  { group: "General", keys: ["Esc"], description: "Cancel the tool, clear the selection, or exit Edit Mode" },
  { group: "Tools", keys: ["M"], description: "Move the selected element" },
  { group: "Tools", keys: ["X"], description: "Turn multi-select on or off" },
  { group: "Tools", keys: ["H"], description: "Hide the selected elements" },
  { group: "Tools", keys: ["Delete"], description: "Hide the selected elements" },
  { group: "Tools", keys: ["P"], description: "Pin or unpin the selected elements" },
  { group: "Tools", keys: ["T"], description: "Edit text on the page" },
  { group: "Tools", keys: ["S"], description: "Open or close the style panel" },
  { group: "Selection", keys: ["Click"], description: "Select an element" },
  { group: "Selection", keys: ["Shift", "Click"], description: "Add or remove an element from the selection" },
  { group: "Selection", keys: ["↑"], description: "Select the parent of the selected element" },
  { group: "Selection", keys: ["↓"], description: "Select the first child of the selected element" },
  { group: "History", keys: [MOD_KEY, "Z"], description: "Undo" },
  { group: "History", keys: [MOD_KEY, "Shift", "Z"], description: "Redo" },
  { group: "History", keys: [MOD_KEY, "S"], description: "Save your changes" }
];

export const TOGGLE_EDIT_SHORTCUT = SHORTCUTS[0].keys.join("+");

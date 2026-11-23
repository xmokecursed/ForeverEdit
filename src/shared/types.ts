export interface ElementFingerprint {
  feId?: string;
  id?: string;
  classes: string[];
  tag: string;
  cssSelector: string;
  xpath: string;
  domPath: { tag: string; index: number }[];
  nearbyText?: string;
  siblingText?: { prev?: string; next?: string };
  parentTagIndex?: number;
  attrs: Record<string, string>;
}

export type OperationType =
  | "move"
  | "hide"
  | "show"
  | "pin"
  | "unpin"
  | "text"
  | "style"
  | "attr";

export interface BaseOperation {
  id: string;
  type: OperationType;
  target: ElementFingerprint;
  createdAt: number;
  seq: number;
}

export interface MoveOperation extends BaseOperation {
  type: "move";
  newParent: ElementFingerprint;
  beforeSibling?: ElementFingerprint;
}

export interface HideOperation extends BaseOperation {
  type: "hide";
}

export interface ShowOperation extends BaseOperation {
  type: "show";
  reverses?: string;
}

export interface PinOperation extends BaseOperation {
  type: "pin";
  dockPosition: "top" | "bottom" | "left" | "right" | "custom";
  customXY?: { x: number; y: number };
}

export interface UnpinOperation extends BaseOperation {
  type: "unpin";
  reverses?: string;
}

export interface TextOperation extends BaseOperation {
  type: "text";
  newText: string;
  originalText?: string;
}

export interface StyleOperation extends BaseOperation {
  type: "style";
  css: Partial<CSSStyleDeclaration> | Record<string, string>;
}

export interface AttrOperation extends BaseOperation {
  type: "attr";
  attr: string;
  value: string | null;
}

export type Operation =
  | MoveOperation
  | HideOperation
  | ShowOperation
  | PinOperation
  | UnpinOperation
  | TextOperation
  | StyleOperation
  | AttrOperation;

export interface SiteEditSet {
  pattern: string;
  enabled: boolean;
  operations: Operation[];
  updatedAt: number;
  createdAt: number;
}

export interface ForeverEditStorage {
  version: 1;
  sites: Record<string, SiteEditSet>;
  settings: GlobalSettings;
}

export interface GlobalSettings {
  globallyEnabled: boolean;
  disabledDomains: string[];
  syncEnabled: boolean;
  toolbarPosition: { x: number; y: number } | null;
}

export const STORAGE_KEY = "foreveredit_store_v1";

export const DEFAULT_SETTINGS: GlobalSettings = {
  globallyEnabled: true,
  disabledDomains: [],
  syncEnabled: false,
  toolbarPosition: null
};

export function emptyStore(): ForeverEditStorage {
  return { version: 1, sites: {}, settings: { ...DEFAULT_SETTINGS } };
}

export type RuntimeMessage =
  | { kind: "GET_STATE"; pattern: string }
  | { kind: "STATE"; siteEditSet: SiteEditSet | null; globallyEnabled: boolean }
  | { kind: "SAVE_OPERATIONS"; pattern: string; operations: Operation[] }
  | { kind: "TOGGLE_SITE_ENABLED"; pattern: string; enabled: boolean }
  | { kind: "RESET_SITE"; pattern: string }
  | { kind: "EXPORT_ALL" }
  | { kind: "EXPORT_ALL_RESULT"; json: string }
  | { kind: "IMPORT_ALL"; json: string }
  | { kind: "TOGGLE_EDIT_MODE_REQUEST" }
  | { kind: "GET_ALL_SITES" }
  | { kind: "ALL_SITES_RESULT"; sites: SiteEditSet[] }
  | { kind: "SET_SITE_ENABLED_LIVE"; enabled: boolean };

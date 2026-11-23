import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  emptyStore,
  type ForeverEditStorage,
  type Operation,
  type SiteEditSet
} from "./types";

function area(useSync: boolean): chrome.storage.StorageArea {
  return useSync ? chrome.storage.sync : chrome.storage.local;
}

export async function loadStore(): Promise<ForeverEditStorage> {
  const local = await chrome.storage.local.get(STORAGE_KEY);
  const store: ForeverEditStorage = local[STORAGE_KEY] ?? emptyStore();
  store.settings = { ...DEFAULT_SETTINGS, ...store.settings };
  return store;
}

export async function saveStore(store: ForeverEditStorage): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: store });
  if (store.settings.syncEnabled) {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: store });
    } catch (e) {
      console.warn("[ForeverEdit] sync mirror failed (likely quota):", e);
    }
  }
}

export async function getSite(pattern: string): Promise<SiteEditSet | null> {
  const store = await loadStore();
  return store.sites[pattern] ?? null;
}

export async function upsertSiteOperations(pattern: string, operations: Operation[]): Promise<SiteEditSet> {
  const store = await loadStore();
  const existing = store.sites[pattern];
  const siteEditSet: SiteEditSet = {
    pattern,
    enabled: existing?.enabled ?? true,
    operations,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now()
  };
  store.sites[pattern] = siteEditSet;
  await saveStore(store);
  return siteEditSet;
}

export async function setSiteEnabled(pattern: string, enabled: boolean): Promise<void> {
  const store = await loadStore();
  if (store.sites[pattern]) {
    store.sites[pattern].enabled = enabled;
    store.sites[pattern].updatedAt = Date.now();
    await saveStore(store);
  }
}

export async function resetSite(pattern: string): Promise<void> {
  const store = await loadStore();
  delete store.sites[pattern];
  await saveStore(store);
}

export async function getAllSites(): Promise<SiteEditSet[]> {
  const store = await loadStore();
  return Object.values(store.sites).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function exportAll(): Promise<string> {
  const store = await loadStore();
  return JSON.stringify(store, null, 2);
}

const KNOWN_OP_TYPES = new Set(["move", "hide", "show", "pin", "unpin", "text", "style", "attr"]);

function sanitizeImportedStore(parsed: unknown): ForeverEditStorage {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Unrecognized ForeverEdit backup format.");
  }
  const raw = parsed as Partial<ForeverEditStorage>;
  if (raw.version !== 1 || typeof raw.sites !== "object" || raw.sites === null) {
    throw new Error("Unrecognized ForeverEdit backup format.");
  }

  const cleanSites: ForeverEditStorage["sites"] = {};
  for (const [pattern, site] of Object.entries(raw.sites)) {
    if (pattern === "__proto__" || pattern === "constructor" || pattern === "prototype") continue;
    if (!site || typeof site !== "object" || !Array.isArray(site.operations)) continue;

    const operations = site.operations.filter(
      (op): op is Operation => !!op && typeof op === "object" && KNOWN_OP_TYPES.has((op as { type?: string }).type ?? "")
    );

    cleanSites[pattern] = {
      pattern,
      enabled: site.enabled !== false,
      operations,
      createdAt: typeof site.createdAt === "number" ? site.createdAt : Date.now(),
      updatedAt: typeof site.updatedAt === "number" ? site.updatedAt : Date.now()
    };
  }

  return {
    version: 1,
    sites: cleanSites,
    settings: { ...DEFAULT_SETTINGS, ...(typeof raw.settings === "object" && raw.settings ? raw.settings : {}) }
  };
}

export async function importAll(json: string): Promise<void> {
  const parsed = JSON.parse(json);
  const clean = sanitizeImportedStore(parsed);
  await saveStore(clean);
}

export async function updateSettings(patch: Partial<ForeverEditStorage["settings"]>): Promise<void> {
  const store = await loadStore();
  store.settings = { ...store.settings, ...patch };
  await saveStore(store);
}

const ONBOARDING_KEY = "foreveredit_onboarded_v1";

export async function hasSeenOnboarding(): Promise<boolean> {
  const result = await chrome.storage.local.get(ONBOARDING_KEY);
  return result[ONBOARDING_KEY] === true;
}

export async function markOnboardingSeen(): Promise<void> {
  await chrome.storage.local.set({ [ONBOARDING_KEY]: true });
}

export async function resetOnboarding(): Promise<void> {
  await chrome.storage.local.remove(ONBOARDING_KEY);
}

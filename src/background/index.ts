import type { RuntimeMessage } from "@shared/types";
import {
  exportAll,
  getAllSites,
  getSite,
  importAll,
  loadStore,
  resetSite,
  setSiteEnabled,
  upsertSiteOperations
} from "@shared/storage";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "foreveredit-toggle-edit",
    title: "Toggle ForeverEdit mode",
    contexts: ["page", "editable", "image", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "foreveredit-toggle-edit" && tab?.id) {
    chrome.tabs
      .sendMessage(tab.id, { kind: "TOGGLE_EDIT_MODE_REQUEST" } satisfies RuntimeMessage)
      .catch(() => {
      });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { kind: "TOGGLE_EDIT_MODE_REQUEST" } satisfies RuntimeMessage).catch(() => {});
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "toggle-edit-mode") return;
  const send = (tabId?: number) => {
    if (tabId === undefined) return;
    chrome.tabs.sendMessage(tabId, { kind: "TOGGLE_EDIT_MODE_REQUEST" } satisfies RuntimeMessage).catch(() => {});
  };
  if (tab?.id !== undefined) {
    send(tab.id);
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }).then(([active]) => send(active?.id));
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  handle(message)
    .then(sendResponse)
    .catch((err) => {
      console.error("[ForeverEdit] background message handling failed:", err);
      sendResponse(undefined);
    });
  return true;
});

async function handle(message: RuntimeMessage): Promise<RuntimeMessage | void> {
  switch (message.kind) {
    case "GET_STATE": {
      const [siteEditSet, store] = await Promise.all([getSite(message.pattern), loadStore()]);
      return { kind: "STATE", siteEditSet, globallyEnabled: store.settings.globallyEnabled };
    }
    case "SAVE_OPERATIONS": {
      await upsertSiteOperations(message.pattern, message.operations);
      return;
    }
    case "TOGGLE_SITE_ENABLED": {
      await setSiteEnabled(message.pattern, message.enabled);
      return;
    }
    case "RESET_SITE": {
      await resetSite(message.pattern);
      return;
    }
    case "EXPORT_ALL": {
      const json = await exportAll();
      return { kind: "EXPORT_ALL_RESULT", json };
    }
    case "IMPORT_ALL": {
      await importAll(message.json);
      return;
    }
    case "GET_ALL_SITES": {
      const sites = await getAllSites();
      return { kind: "ALL_SITES_RESULT", sites };
    }
    default:
      return;
  }
}

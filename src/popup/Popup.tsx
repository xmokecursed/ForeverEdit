import { useEffect, useState } from "react";
import type { RuntimeMessage, SiteEditSet } from "@shared/types";
import { defaultPatternFor } from "@shared/urlPattern";
import { MainIcon } from "@shared/MainIcon";
import { TOGGLE_EDIT_SHORTCUT } from "@shared/shortcuts";

export function Popup() {
  const [pattern, setPattern] = useState<string>("");
  const [site, setSite] = useState<SiteEditSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url ?? "";
      const p = defaultPatternFor(url);
      setPattern(p);
      chrome.runtime.sendMessage({ kind: "GET_STATE", pattern: p } satisfies RuntimeMessage, (res: RuntimeMessage) => {
        if (res?.kind === "STATE") setSite(res.siteEditSet);
        setLoading(false);
      });
    })();
  }, []);

  async function toggleEditMode() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    try {
      await chrome.tabs.sendMessage(tab.id, { kind: "TOGGLE_EDIT_MODE_REQUEST" } satisfies RuntimeMessage);
      window.close();
    } catch {
      setError("This page can't be edited (browser and store pages are off-limits).");
    }
  }

  async function toggleSiteEnabled() {
    if (!site) return;
    const enabled = !site.enabled;
    chrome.runtime.sendMessage(
      { kind: "TOGGLE_SITE_ENABLED", pattern, enabled } satisfies RuntimeMessage,
      () => setSite({ ...site, enabled })
    );
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { kind: "SET_SITE_ENABLED_LIVE", enabled } satisfies RuntimeMessage).catch(() => {});
    }
  }

  function resetSite() {
    if (!confirm(`Remove all ForeverEdit customizations for ${pattern}?`)) return;
    chrome.runtime.sendMessage({ kind: "RESET_SITE", pattern } satisfies RuntimeMessage, () => setSite(null));
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  const editCount = site?.operations.length ?? 0;

  return (
    <div className="fe-popup">
      <header className="fe-popup__header">
        <div className="fe-popup__logo">
          <MainIcon size={16} />
        </div>
        <div>
          <div className="fe-popup__title">ForeverEdit</div>
          <div className="fe-popup__site">{pattern || "…"}</div>
        </div>
      </header>

      {loading ? (
        <div className="fe-popup__loading">Loading…</div>
      ) : (
        <>
          <div className="fe-popup__stat">
            <span>{editCount}</span> customization{editCount === 1 ? "" : "s"} on this site
          </div>

          <button className="fe-popup__primary" onClick={toggleEditMode}>
            Toggle Edit Mode
          </button>
          <p className="fe-popup__shortcut">
            Shortcut: <kbd>{TOGGLE_EDIT_SHORTCUT}</kbd>
          </p>
          {error && <p className="fe-popup__error">{error}</p>}

          <details className="fe-popup__guide" open={editCount === 0}>
            <summary>How to use</summary>
            <ol>
              <li>Press Toggle Edit Mode on the page you want to change.</li>
              <li>Click any element, then pick a tool: Move, Hide, Pin, Text or Style.</li>
              <li>Press Save. Your changes come back every time you visit.</li>
            </ol>
            <p>Press ? while editing to see every keyboard shortcut.</p>
          </details>

          <div className="fe-popup__row">
            <label className="fe-popup__switch">
              <input
                type="checkbox"
                checked={site?.enabled ?? true}
                onChange={toggleSiteEnabled}
                disabled={!site}
              />
              Apply edits on this site
            </label>
            <p className="fe-popup__hint">
              Off shows the original page. Your customizations stay saved - flip it back on any time.
            </p>
          </div>

          <div className="fe-popup__actions">
            <button onClick={resetSite} disabled={!site}>
              Reset site
            </button>
            <button onClick={openOptions}>Settings</button>
          </div>
        </>
      )}
    </div>
  );
}

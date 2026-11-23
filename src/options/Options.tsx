import { useEffect, useRef, useState } from "react";
import type { RuntimeMessage, SiteEditSet } from "@shared/types";
import { MainIcon } from "@shared/MainIcon";
import { GROUP_ORDER, SHORTCUTS } from "@shared/shortcuts";
import { resetOnboarding } from "@shared/storage";

export function Options() {
  const [sites, setSites] = useState<SiteEditSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    setLoading(true);
    chrome.runtime.sendMessage({ kind: "GET_ALL_SITES" } satisfies RuntimeMessage, (res: RuntimeMessage) => {
      if (res?.kind === "ALL_SITES_RESULT") setSites(res.sites);
      setLoading(false);
    });
  }

  useEffect(refresh, []);

  async function toggleEnabled(pattern: string, enabled: boolean) {
    chrome.runtime.sendMessage({ kind: "TOGGLE_SITE_ENABLED", pattern, enabled } satisfies RuntimeMessage, refresh);
    const tabs = await chrome.tabs.query({ url: [`*://${pattern.split("/")[0]}/*`] });
    for (const tab of tabs) {
      if (tab.id) chrome.tabs.sendMessage(tab.id, { kind: "SET_SITE_ENABLED_LIVE", enabled } satisfies RuntimeMessage).catch(() => {});
    }
  }

  function reset(pattern: string) {
    if (!confirm(`Remove all customizations for ${pattern}?`)) return;
    chrome.runtime.sendMessage({ kind: "RESET_SITE", pattern } satisfies RuntimeMessage, refresh);
  }

  function exportAll() {
    chrome.runtime.sendMessage({ kind: "EXPORT_ALL" } satisfies RuntimeMessage, (res: RuntimeMessage) => {
      if (res?.kind !== "EXPORT_ALL_RESULT") return;
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foreveredit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Exported backup.");
    });
  }

  function importFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result);
      chrome.runtime.sendMessage({ kind: "IMPORT_ALL", json } satisfies RuntimeMessage, () => {
        setStatus("Backup imported.");
        refresh();
      });
    };
    reader.readAsText(file);
  }

  async function replayWelcome() {
    await resetOnboarding();
    setStatus("The welcome tips will show the next time you turn on Edit Mode.");
  }

  return (
    <div className="fe-opts">
      <header className="fe-opts__header">
        <div className="fe-opts__logo">
          <MainIcon size={20} />
        </div>
        <div>
          <h1>ForeverEdit</h1>
          <p>Manage your website customizations</p>
        </div>
      </header>

      <section className="fe-opts__section">
        <h2>Getting started</h2>
        <ol className="fe-opts__steps">
          <li>Open any website and click the ForeverEdit icon, then choose Toggle Edit Mode.</li>
          <li>Click an element to select it, then pick a tool: Move, Hide, Pin, Text or Style.</li>
          <li>Press Save. Your edits are stored on this device and come back every time you visit.</li>
        </ol>
        <div className="fe-opts__row">
          <button onClick={replayWelcome}>Show the welcome tips again</button>
        </div>
      </section>

      <section className="fe-opts__section">
        <h2>Keyboard shortcuts</h2>
        <p className="fe-opts__muted" style={{ marginBottom: 12 }}>
          These work while Edit Mode is on. To change the Edit Mode shortcut, open your browser's extension
          shortcuts page (Chrome, Edge and Brave: Extensions, then Keyboard shortcuts. Firefox: Add-ons
          Manager, gear icon, then Manage Extension Shortcuts).
        </p>
        {GROUP_ORDER.map((group) => (
          <div key={group} className="fe-opts__shortcut-group">
            <h3>{group}</h3>
            {SHORTCUTS.filter((sc) => sc.group === group).map((sc) => (
              <div key={sc.keys.join("+") + sc.description} className="fe-opts__shortcut">
                <span>{sc.description}</span>
                <span className="fe-opts__keys">
                  {sc.keys.map((k, i) => (
                    <span key={k + i}>
                      {i > 0 && <span className="fe-opts__plus">+</span>}
                      <kbd>{k}</kbd>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="fe-opts__section">
        <h2>Backup</h2>
        <div className="fe-opts__row">
          <button onClick={exportAll}>Export all customizations</button>
          <button onClick={() => fileInputRef.current?.click()}>Import backup</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {status && <p className="fe-opts__status">{status}</p>}
      </section>

      <section className="fe-opts__section">
        <h2>Sites ({sites.length})</h2>
        <p className="fe-opts__muted" style={{ marginBottom: 10 }}>
          Turning a site off shows the original page again without deleting your edits - turn it back on any
          time to bring them back.
        </p>
        {loading ? (
          <p className="fe-opts__muted">Loading…</p>
        ) : sites.length === 0 ? (
          <p className="fe-opts__muted">No customizations yet. Open Edit Mode on any site to get started.</p>
        ) : (
          <table className="fe-opts__table">
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Edits</th>
                <th>Updated</th>
                <th>Enabled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.pattern}>
                  <td>{s.pattern}</td>
                  <td>{s.operations.length}</td>
                  <td>{new Date(s.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => toggleEnabled(s.pattern, e.target.checked)}
                    />
                  </td>
                  <td>
                    <button className="fe-opts__danger" onClick={() => reset(s.pattern)}>
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

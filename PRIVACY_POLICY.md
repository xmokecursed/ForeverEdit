<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ForeverEdit - Privacy Policy</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 680px;
    margin: 0 auto;
    padding: 48px 24px 80px;
    color: #1a1a1f;
    line-height: 1.6;
  }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .updated { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
  h2 { font-size: 17px; margin-top: 36px; }
  ul { padding-left: 20px; }
  code { background: #f4f4f5; padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
  .badge {
    display: inline-block; background: #000; color: #fff;
    padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
    margin-bottom: 20px;
  }
</style>
</head>
<body>

<span class="badge">TL;DR - nothing you do is ever sent anywhere</span>
<h1>ForeverEdit Privacy Policy</h1>
<p class="updated">Last updated: [FILL IN DATE BEFORE PUBLISHING]</p>

<p>
ForeverEdit is a browser extension that lets you visually customize the appearance of
websites you visit. This page explains exactly what data the extension touches, where
it goes, and what it doesn't do.
</p>

<h2>What ForeverEdit stores</h2>
<p>
When you edit a website with ForeverEdit, the changes you make (moved elements, hidden
elements, pinned elements, edited text, and style changes) are saved as a small log of
instructions, stored using your browser's built-in <code>storage</code> API
(<code>chrome.storage.local</code>). This data:
</p>
<ul>
  <li>Stays on your own device.</li>
  <li>Is never transmitted to ForeverEdit's developer, or to any third party, or to any server at all.</li>
  <li>Is only ever read back by the extension itself, to reapply your edits the next time you visit a site you customized.</li>
</ul>

<p>
If you turn on "sync" in the extension's settings, that data is mirrored using your
browser vendor's own built-in sync feature (Chrome Sync or Firefox Sync/Sync via your
Mozilla account) so your edits follow you across your own signed-in devices. This is
your browser's native sync infrastructure, governed by your browser vendor's own
privacy policy - ForeverEdit itself never sees or handles that data directly, and this
feature is off by default.
</p>

<h2>What ForeverEdit does not do</h2>
<ul>
  <li>It does not collect analytics, telemetry, or usage statistics.</li>
  <li>It does not track your browsing history.</li>
  <li>It does not read, log, or transmit the content of pages you visit, aside from the specific elements you choose to edit (which are stored locally as described above).</li>
  <li>It does not include ads, trackers, or any third-party scripts.</li>
  <li>It does not sell or share data with anyone, because it does not collect any data to begin with.</li>
</ul>

<h2>Why the extension asks for broad permissions</h2>
<p>
ForeverEdit requests access to all websites (<code>&lt;all_urls&gt;</code>) because its
entire purpose is letting you edit the visual appearance of any site you personally
choose to visit and customize. This permission is used exclusively to run the editor on
the page you're actively looking at - it is never used to access pages in the
background, monitor other tabs, or collect information you haven't explicitly asked the
extension to store as part of an edit you made.
</p>

<h2>Exporting and deleting your data</h2>
<p>
You can export everything ForeverEdit has stored as a plain JSON file at any time from
the extension's Settings page, and you can delete all stored customizations for any
site (or all sites) from the same page. Uninstalling the extension removes all of its
stored data from your browser.
</p>

<h2>Changes to this policy</h2>
<p>
If this policy changes, the "Last updated" date at the top of this page will change
accordingly. Material changes will also be reflected in the extension's store listing.
</p>

<h2>Contact</h2>
<p>
Questions about this policy: [FILL IN YOUR CONTACT EMAIL BEFORE PUBLISHING]
</p>

</body>
</html>

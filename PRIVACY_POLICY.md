# ForeverEdit Privacy Policy

_Last updated: 2026-07-25_

**TL;DR - nothing you do in ForeverEdit is ever sent anywhere.**

ForeverEdit is a browser extension that lets you visually customize the
appearance of websites you visit. This page explains exactly what data the
extension touches, where it goes, and what it doesn't do.

## What ForeverEdit stores

When you edit a website with ForeverEdit, the changes you make (moved
elements, hidden elements, pinned elements, edited text, and style changes)
are saved as a small log of instructions, stored using your browser's
built-in storage API (`chrome.storage.local`). This data:

- Stays on your own device.
- Is never transmitted to ForeverEdit's developer, or to any third party, or
  to any server at all.
- Is only ever read back by the extension itself, to reapply your edits the
  next time you visit a site you customized.

If you turn on "sync" in the extension's settings, that data is mirrored
using your browser vendor's own built-in sync feature (Chrome Sync, or
Firefox Sync via your Mozilla account) so your edits follow you across your
own signed-in devices. This is your browser's native sync infrastructure,
governed by your browser vendor's own privacy policy - ForeverEdit itself
never sees or handles that data directly, and this feature is off by
default.

## What ForeverEdit does not do

- It does not collect analytics, telemetry, or usage statistics.
- It does not track your browsing history.
- It does not read, log, or transmit the content of pages you visit, aside
  from the specific elements you choose to edit (stored locally as
  described above).
- It does not include ads, trackers, or any third-party scripts.
- It does not sell or share data with anyone, because it does not collect
  any data to begin with.

## Why the extension asks for broad permissions

ForeverEdit requests access to all websites (`<all_urls>`) because its
entire purpose is letting you edit the visual appearance of any site you
personally choose to visit and customize. This permission is used
exclusively to run the editor on the page you're actively looking at - it
is never used to access pages in the background, monitor other tabs, or
collect information you haven't explicitly asked the extension to store as
part of an edit you made.

## Exporting and deleting your data

You can export everything ForeverEdit has stored as a plain JSON file at
any time from the extension's Settings page, and you can delete all stored
customizations for any site (or all sites) from the same page. Uninstalling
the extension removes all of its stored data from your browser.

## Changes to this policy

If this policy changes, the "Last updated" date at the top of this page
will change accordingly. Material changes will also be reflected in the
extension's store listing.

## Contact

Questions about this policy: xmokecursed@proton.me

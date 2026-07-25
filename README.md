<div align="center">

# ✎ ForeverEdit

**Visually customize any website - no code, nothing sent anywhere.**

Move things around, hide what you don't want, restyle colors and fonts, edit text
inline - your changes save automatically and reapply every time you come back.
The real website is never touched; only your own local view changes.

[Install for Chrome / Brave / Edge](#chrome--brave--edge--opera) ·
[Install for Firefox](#firefox) ·
[Privacy Policy](./PRIVACY_POLICY.md)

</div>

---

## What it does

- **Drag-and-drop layout editing** - move any element anywhere on the page
- **Hide elements** you don't want to see (nothing is deleted - undo any time)
- **Pin elements** so they stay on screen while you scroll
- **Edit text inline**, right on the page, no code
- **Full visual style editor** - colors, fonts, spacing, layout, position - with
  color pickers, sliders, and dropdowns, not a CSS box
- **Multi-select** - select several elements at once and style/hide/pin them all together
- **Undo/redo** while you work, save when you're happy
- Edits **persist automatically** and reapply on every future visit, even on
  sites that constantly re-render their content
- Works per-site or per-URL-pattern (e.g. only on `example.com/dashboard/*`)
- **Export/import** a full backup of every customization as JSON

## Privacy, in one sentence

ForeverEdit doesn't collect analytics, doesn't track your browsing, and doesn't
have a server - everything you customize is stored locally in your own browser.
Full details: [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md).

## Screenshots
* Main
<img src="Screenshot 1.png" alt="xmoke" height="512" width="512" />
* Edit
<img src="Screenshot 2.png" alt="xmoke" height="512" width="512" />
* Style
<img src="Screenshot 3.png" alt="xmoke" height="512" width="512" />
* Save
<img src="Screenshot 4.png" alt="xmoke" height="512" width="512" />


## Install

### Chrome / Brave / Edge / Opera

**From the store** (recommended once published):
- [Chrome Web Store listing](#) <!-- add link once live -->

**Manual install:**
1. Download the latest release from the [Releases page](../../releases)
2. Unzip `foreveredit-chrome.zip`
3. Go to `chrome://extensions` (or `brave://extensions`, `edge://extensions`)
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder

### Firefox

**From the store** (recommended once published):
- [Firefox Add-ons listing](#) <!-- add link once live -->

**Manual install (temporary, for testing):**
1. Download the latest release from the [Releases page](../../releases)
2. Unzip `foreveredit-firefox.zip`
3. Go to `about:debugging#/runtime/this-firefox`
4. Click **Load Temporary Add-on...**
5. Select `manifest.json` inside the unzipped folder

> Firefox's temporary-add-on loading only lasts until you close the browser -
> that's a Firefox restriction on unsigned extensions, not something specific
> to this project. Install from the official Add-ons listing for a permanent
> install once available.

## Using it

1. Click the ForeverEdit icon and hit **Toggle Edit Mode** (or right-click any
   page and choose **Toggle ForeverEdit mode**)
2. Hover to preview an element, click to select it (or turn on **Multi** to
   select several)
3. Pick a tool: **Move**, **Hide**, **Pin**, **Text**, or **Style**
4. **Undo/Redo** as needed, then **Save**
5. Come back later - your edits are already there

Manage every site you've customized, export/import backups, or disable
editing on a specific site from the extension's Settings page.

## Support / Feedback

Found a bug or have a feature request? Open an issue on this repo.

## License

[MIT](./LICENSE)

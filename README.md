# backend.os — portfolio site

Static HTML/CSS/JS portfolio styled as a live ops dashboard. Edit content without
redeploying — content lives in `content.json` and is fetched at page load.

```
port-v2/
├── index.html      ← page structure + default content (SEO baseline)
├── styles.css      ← all styling
├── script.js       ← page interactions (tabs, clock, log tail, topology, …)
├── loader.js       ← fetches content.json and hydrates the DOM
├── content.json    ← EDIT THIS to change site content (no redeploy needed)
└── Aakash_Kumar_SDE2.pdf   ← drop your resume PDF here (filename must match)
```

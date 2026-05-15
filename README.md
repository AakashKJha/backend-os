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

---

## How it works

1. Browser loads `index.html` with full default content already in the markup
   (so the page renders even if the JS fetch fails — also good for SEO).
2. `loader.js` fires immediately, tries `CONFIG.contentUrl` (remote GitHub raw
   URL) first, then falls back to local `./content.json`.
3. On success, `hydrate(data)` replaces hero text, metrics, services, deploys,
   blogs, contact channels, log lines, etc.
4. A `content-ready` event tells `script.js` to re-run counter animations and
   refresh the log tail with whatever content just arrived.

Cache-busting: loader appends `?v=<minute-bucket>` to every fetch, so changes
go live within ~60s of pushing to GitHub.

---

## One-time setup

1. **Create a public GitHub repo** (any name — `portfolio`, `backend.os`, etc.).
2. Push the entire `port-v2/` contents to the repo root.
3. **Wire the loader to your repo** — open `loader.js` and edit one line:

   ```js
   // loader.js
   const CONFIG = {
     contentUrl: "https://raw.githubusercontent.com/<user>/<repo>/main/content.json",
     ...
   };
   ```

4. Commit and push. **Redeploy is needed only this one time.**

---

## Editing content thereafter — NO redeploy

Everything user-visible is in `content.json`. To edit:

1. Open `content.json` on github.com.
2. Click the pencil icon → edit → commit to `main`.
3. Refresh the live site after ~60s. Done.

### What's in `content.json`

| Key          | Purpose                                            |
|--------------|----------------------------------------------------|
| `meta`       | Name, title, resume PDF URL                        |
| `hero`       | H1 + lede paragraph                                |
| `links`      | Email, LinkedIn, Medium, LeetCode                  |
| `metrics`    | 4 metric cards on the overview tab                 |
| `bioBlock`   | "$ whoami" panel — list of bio lines               |
| `stack`      | Capabilities table on the overview tab             |
| `services`   | Project cards in STAR format (situation/task/action/result) |
| `deploys`    | Career commit log                                  |
| `blogs`      | Medium articles                                    |
| `contact`    | Contact channels                                   |
| `openTo`     | "$ open-to" panel on the contact tab               |
| `logTail`    | Rotating footer log lines                          |

### Adding a new project / blog / log line

Just append a new object to the relevant array in `content.json`. Schema is
self-describing — copy an existing entry as template.

### Swapping your resume

- **PDF**: replace `Aakash_Kumar_SDE2.pdf` in the repo (filename must match).
- **External link**: set `meta.resumeUrl` in `content.json` to a remote URL.

---

## Deployment

Pick one — all are free and serve `content.json` correctly:

### Option A — GitHub Pages (recommended, matches the CMS flow)

1. Repo Settings → Pages.
2. Source: `Deploy from a branch` → Branch: `main` → Folder: `/ (root)` → Save.
3. Live at `https://<user>.github.io/<repo>/` within ~30s.
4. **Custom domain** (optional): add it in the Pages settings, point a `CNAME`
   DNS record to `<user>.github.io`, enable "Enforce HTTPS". GitHub
   auto-provisions a Let's Encrypt cert.

### Option B — Cloudflare Pages

1. Connect repo at `dash.cloudflare.com/?to=/:account/pages`.
2. Build command: *(empty)*  ·  Output dir: `/`.
3. Best free CDN performance in India + automatic TLS.

### Option C — Netlify / Vercel

Connect the repo. Build command empty, publish dir is the project root. Same
deal — zero-config static hosting.

---

## SEO checklist

The default content in `index.html` is your SEO baseline — crawlers that don't
execute JS still see real, indexable content.

To go from "indexed" to "well-indexed", make sure `index.html` includes:

- `<title>` and `<meta name="description">` (already present — verify they're
  accurate to you).
- **Open Graph + Twitter cards** for clean LinkedIn/Slack/Twitter previews:

  ```html
  <meta property="og:title"       content="Aakash Kumar — backend.os" />
  <meta property="og:description" content="Backend & AI infra engineer." />
  <meta property="og:image"       content="https://<your-domain>/og-card.png" />
  <meta property="og:url"         content="https://<your-domain>/" />
  <meta property="og:type"        content="website" />
  <meta name="twitter:card"       content="summary_large_image" />
  ```

  Drop a 1200×630 PNG (a screenshot works) as `og-card.png` in the repo root.

- **Canonical URL** (prevents duplicate-content if both `github.io` and your
  custom domain are reachable):

  ```html
  <link rel="canonical" href="https://<your-domain>/" />
  ```

- **JSON-LD structured data** — opts you into Google's Person knowledge panel:

  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Aakash Kumar",
    "jobTitle": "Software Development Engineer",
    "url": "https://<your-domain>",
    "sameAs": [
      "https://linkedin.com/in/imaakashjha",
      "https://medium.com/@aakashkumar2001jha"
    ]
  }
  </script>
  ```

- **`robots.txt`** in repo root:

  ```
  User-agent: *
  Allow: /
  Sitemap: https://<your-domain>/sitemap.xml
  ```

- **`sitemap.xml`** in repo root:

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://<your-domain>/</loc></url>
  </urlset>
  ```

- **Submit to Google Search Console** once deployed → verify ownership →
  submit `sitemap.xml`. Crawl typically begins within hours.

### SEO caveat for content.json

Crawlers that *don't* execute JS only see what's baked into `index.html` at
deploy time. As long as you:

- keep the static defaults in `index.html` reasonably up to date, AND
- use `content.json` for incremental edits (not for content that exists *only*
  in JSON),

you're fine. If you ever add a full long-form blog post that lives only in
`content.json`, that post will NOT be reliably indexed — link out to Medium
instead (which is what the current `blogs` array does).

---

## Local testing

`fetch('./content.json')` fails under the `file://` protocol. Run a tiny HTTP
server inside `port-v2/`:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or with Node:

```bash
npx serve .
```

You should see in DevTools console:

```
[loader] hydrated from ./content.json
```

If the remote URL is set in `CONFIG.contentUrl`, you'll see that one fetched
first.

---

## Keyboard shortcuts on the site

| Key   | Action                |
|-------|-----------------------|
| `1`…`6` | switch tab          |
| `g`   | scroll to top         |
| `?`   | show shortcut toast   |

Deep links: `#overview`, `#services`, `#topology`, `#deploys`, `#writing`,
`#contact` all sync to the URL hash.

---

## Troubleshooting

| Symptom                                  | Cause / Fix                                              |
|------------------------------------------|----------------------------------------------------------|
| Edits to `content.json` not appearing    | Wait ~60s (cache bucket) or hard-refresh (Cmd-Shift-R). |
| Page renders defaults only               | Open DevTools console — look for `[loader] failed`. Likely a CORS/404 on the remote URL. Verify the raw GitHub URL is correct and the repo is public. |
| Log tail lines overlap / pile up         | Should not happen — re-entrancy guard prevents it. If you see it, hard-refresh to clear cached JS. |
| Resume link 404s                         | Confirm `Aakash_Kumar_SDE2.pdf` is committed and filename matches `meta.resumeUrl` (default `./Aakash_Kumar_SDE2.pdf`). |
| LinkedIn/Slack preview is blank          | Add OG meta tags (see SEO checklist) and regenerate the preview via LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/). |

// ─── Remote Content Loader ────────────────────────────────────────────────────
// Fetches content.json from GitHub (or any URL) and hydrates the DOM.
// HTML keeps full default content so the page renders fine if the fetch fails.
//
// EDIT THE TWO LINES BELOW once after pushing to GitHub:
//   CONFIG.contentUrl  → the raw GitHub URL to your content.json
//
// To edit content thereafter: open content.json on github.com, commit. Live ≤ 60s.
// ──────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  // 👇 EDIT ONCE: set to your raw GitHub content URL after pushing the repo.
  //    Example: "https://raw.githubusercontent.com/<user>/<repo>/main/content.json"
  //    Leave null to load the local file alongside the site (./content.json).
  contentUrl: null,

  // Minute-bucket cache-busting. Cuts effective CDN cache to ~60s.
  cacheBucketSeconds: 60,

  // If true, also tries ./content.json same-origin when remote fails.
  fallbackLocal: true,
};

function bucket() {
  return Math.floor(Date.now() / (CONFIG.cacheBucketSeconds * 1000));
}

async function fetchJson(url) {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}v=${bucket()}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function loadContent() {
  let data = null;
  const sources = [];
  if (CONFIG.contentUrl)   sources.push(CONFIG.contentUrl);
  if (CONFIG.fallbackLocal) sources.push("./content.json");

  for (const url of sources) {
    try {
      data = await fetchJson(url);
      console.info(`[loader] hydrated from ${url}`);
      break;
    } catch (e) {
      console.warn(`[loader] failed ${url}: ${e.message}`);
    }
  }

  if (data) {
    try { hydrate(data); }
    catch (e) { console.error("[loader] hydrate threw", e); }
  } else {
    console.warn("[loader] no remote content — keeping HTML defaults");
  }

  document.dispatchEvent(new CustomEvent("content-ready", { detail: { data } }));
}

// ─── Hydration ────────────────────────────────────────────────────────────────
function hydrate(d) {
  // meta + hero — simple text bindings
  if (d.hero?.h1)   setHTML("[data-bind='hero.h1']",   d.hero.h1);
  if (d.hero?.lede) setText("[data-bind='hero.lede']", d.hero.lede);

  // links (hero CTA + contact section share)
  if (d.links) applyLinks(d.links);

  // resume url
  if (d.meta?.resumeUrl) {
    document.querySelectorAll("[data-bind-resume]").forEach(a => a.href = d.meta.resumeUrl);
  }

  if (Array.isArray(d.metrics))    renderMetrics(d.metrics);
  if (Array.isArray(d.bioBlock))   renderBio(d.bioBlock);
  if (Array.isArray(d.stack))      renderStack(d.stack);
  if (Array.isArray(d.services))   renderServices(d.services);
  if (Array.isArray(d.deploys))    renderDeploys(d.deploys);
  if (Array.isArray(d.blogs))      renderBlogs(d.blogs);
  if (Array.isArray(d.contact))    renderContact(d.contact);
  if (Array.isArray(d.openTo))     renderOpenTo(d.openTo);
  if (Array.isArray(d.logTail))    setLogData(d.logTail);

  // sidebar nav badge for blogs/services should reflect counts
  if (Array.isArray(d.services))   setNavBadge("services", d.services.length);
  if (Array.isArray(d.blogs))      setNavBadge("writing",  d.blogs.length);
  if (Array.isArray(d.deploys))    setNavBadge("deploys",  d.deploys.length);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setText(sel, v) {
  const el = document.querySelector(sel);
  if (el != null && v != null) el.textContent = v;
}
function setHTML(sel, v) {
  const el = document.querySelector(sel);
  if (el != null && v != null) el.innerHTML = v;
}
function setNavBadge(tab, n) {
  const li = document.querySelector(`.nav li[data-tab="${tab}"] .badge`);
  if (li) li.textContent = String(n);
}
function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;").replace(/&/g, "&amp;");
}

function applyLinks(links) {
  const map = {
    email:    `mailto:${links.email || ""}`,
    linkedin: links.linkedin,
    medium:   links.medium,
    leetcode: links.leetcode,
  };
  document.querySelectorAll("[data-link]").forEach(a => {
    const k = a.dataset.link;
    if (map[k]) a.href = map[k];
  });
}

// ─── Renderers ────────────────────────────────────────────────────────────────
function renderMetrics(metrics) {
  const host = document.querySelector(".metrics");
  if (!host) return;
  host.innerHTML = metrics.map(m => {
    const bars = Array.from({ length: 12 }, () => "<i></i>").join("");
    return `
      <div class="metric-card">
        <div class="m-label">${m.label || ""}</div>
        <div class="m-value"><span data-count="${m.value ?? 0}">0</span><span class="suf">${m.suffix || ""}</span></div>
        <div class="m-spark${m.trend === "down" ? " down" : ""}">${bars}</div>
        <div class="m-sub">${m.sub || ""}</div>
      </div>`;
  }).join("");
}

function renderBio(lines) {
  const el = document.querySelector(".bio-block");
  if (!el) return;
  el.textContent = lines.join("\n");
}

function renderOpenTo(lines) {
  const el = document.querySelector(".open-to");
  if (!el) return;
  el.textContent = lines.join("\n");
}

function renderStack(rows) {
  const host = document.querySelector(".stack");
  if (!host) return;
  host.innerHTML = rows.map(r => `
    <div class="row"><b>${r.group}</b><span>${r.items}</span></div>
  `).join("");
}

function renderServices(services) {
  const host = document.querySelector(".svc-table");
  if (!host) return;
  // keep the header row, replace the rest
  const header = host.querySelector(".svc-head")?.outerHTML || "";
  host.innerHTML = header + services.map((s, i) => {
    const stClass = s.status === "running"   ? "g"
                  : s.status === "deploying" ? "a"
                  : "b";
    const tags = (s.tags || []).map(t => `<span>${t}</span>`).join("");
    const rpsDisplay = (s.rps && s.rps > 0) ? Number(s.rps).toLocaleString() : "—";
    return `
      <details class="svc"${i === 0 ? " open" : ""}>
        <summary>
          <span class="st"><i class="d ${stClass}"></i>${s.status || ""}</span>
          <span class="name"><b>${s.name || s.id || ""}</b><em>${s.code || ""}</em></span>
          <span class="ver">${s.version || ""}</span>
          <span class="rps" data-rps="${s.rps || 0}">${rpsDisplay}</span>
          <span class="up">${s.uptime || ""}</span>
          <span class="exp">▾</span>
        </summary>
        <div class="svc-body">
          <p>${s.summary || ""}</p>
          ${s.star?.situation ? `<div class="kv"><b>situation</b><span>${s.star.situation}</span></div>` : ""}
          ${s.star?.task      ? `<div class="kv"><b>task</b><span>${s.star.task}</span></div>` : ""}
          ${s.star?.action    ? `<div class="kv"><b>action</b><span>${s.star.action}</span></div>` : ""}
          ${s.star?.result    ? `<div class="kv"><b>result</b><span>${s.star.result}</span></div>` : ""}
          <div class="tags">${tags}</div>
        </div>
      </details>`;
  }).join("");
}

function renderDeploys(deploys) {
  const host = document.querySelector(".deploys");
  if (!host) return;
  host.innerHTML = deploys.map(d => {
    const isActive = d.status === "active";
    const chip = isActive
      ? `<span class="chip chip-ok"><span class="dot"></span>active</span>`
      : `<span class="chip"><span class="dot d-faint"></span>${d.status || "archived"}</span>`;
    const added   = (d.added   || []).map(x => `<span class="add">+ ${x}</span>`).join("");
    const removed = (d.removed || []).map(x => `<span class="rm">− ${x}</span>`).join("");
    return `
      <article class="deploy" style="${isActive ? "" : "border-left-color: var(--faint)"}">
        <div class="dp-meta">
          <span class="dp-sha">${d.sha || ""}</span>
          <span class="dp-date">${d.date || ""}</span>
          ${chip}
        </div>
        <h3>${d.role || ""}</h3>
        <p>${d.body || ""}</p>
        <div class="dp-changes">${added}${removed}</div>
      </article>`;
  }).join("");
}

function renderBlogs(blogs) {
  const host = document.querySelector(".blog-grid");
  if (!host) return;
  host.innerHTML = blogs.map(b => {
    const tags = (b.tags || []).map(t => `<span>${t}</span>`).join("");
    return `
      <a class="blog-card" href="${escapeAttr(b.url || "#")}" target="_blank" rel="noopener">
        <div class="bc-meta">
          <span class="bc-cat">${b.category || ""}</span>
          <span class="bc-rt">${b.readTime || ""}</span>
        </div>
        <h3>${b.title || ""}</h3>
        <p>${b.summary || ""}</p>
        <div class="bc-foot">
          <div class="bc-tags">${tags}</div>
          <span class="bc-link">read on Medium ↗</span>
        </div>
      </a>`;
  }).join("");
}

function renderContact(channels) {
  const host = document.querySelector(".ch");
  if (!host) return;
  host.innerHTML = channels.map(c => `
    <a href="${escapeAttr(c.href || "#")}"${c.href?.startsWith("http") ? ' target="_blank" rel="noopener"' : ""} class="ch-row">
      <b>${c.label || ""}</b>
      <code>${c.value || ""}</code>
      <span class="copy" data-copy="${escapeAttr(c.copy || c.value || "")}">copy</span>
    </a>`).join("");
}

function setLogData(lines) {
  const el = document.getElementById("log-data");
  if (el) el.textContent = JSON.stringify(lines);
}

// kick off
loadContent();

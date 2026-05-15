// ─── Uptime / Clock ───────────────────────────────────────────────────────────
const start = Date.now();
const uptimeEl = document.getElementById("uptime");
const clockEl  = document.getElementById("clock");

function pad(n) { return String(n).padStart(2, "0"); }

function tickClock() {
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  uptimeEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  const d = new Date();
  clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);


// ─── Tab Switching ────────────────────────────────────────────────────────────
const nav = document.getElementById("nav");
const views = document.querySelectorAll(".view");
const sbPath = document.getElementById("sb-path");

function switchTo(tab) {
  nav.querySelectorAll("li").forEach(li => li.classList.toggle("active", li.dataset.tab === tab));
  views.forEach(v => v.hidden = v.dataset.view !== tab);
  sbPath.textContent = `~/${tab}`;
  // re-run animations on entry
  if (tab === "overview") animateCounters();
  if (tab === "topology") buildTopology();
  if (tab === "services") animateRps();
}

nav.addEventListener("click", e => {
  const li = e.target.closest("li[data-tab]");
  if (!li) return;
  switchTo(li.dataset.tab);
});

// keyboard 1..6
document.addEventListener("keydown", e => {
  // skip when typing in inputs
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  const map = { "1":"overview","2":"services","3":"topology","4":"deploys","5":"writing","6":"contact" };
  if (map[e.key]) { switchTo(map[e.key]); return; }
  if (e.key === "g") window.scrollTo({ top: 0, behavior: "smooth" });
  if (e.key === "?") showToast("shortcuts: 1–6 switch tab · g top");
});


// ─── Counter Animation ────────────────────────────────────────────────────────
let countersAnimated = false;
function animateCounters() {
  if (countersAnimated) return;
  countersAnimated = true;
  document.querySelectorAll("[data-count]").forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const dur = 1200;
    const t0 = performance.now();
    function step(t) {
      const p = Math.min((t - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
animateCounters();


// ─── Service RPS jitter ───────────────────────────────────────────────────────
let rpsInterval = null;
function animateRps() {
  if (rpsInterval) return;
  rpsInterval = setInterval(() => {
    document.querySelectorAll(".rps[data-rps]").forEach(el => {
      const base = parseInt(el.dataset.rps, 10);
      if (!base) return;
      const jitter = Math.round(base + (Math.random() - 0.5) * Math.max(2, base * 0.06));
      el.textContent = jitter.toLocaleString();
    });
  }, 1400);
}


// ─── Cluster mini stats jitter ────────────────────────────────────────────────
const p99 = document.getElementById("ms-p99");
const err = document.getElementById("ms-err");
setInterval(() => {
  if (p99) p99.textContent = Math.round(38 + Math.random() * 9);
  if (err) err.textContent = (0.02 + Math.random() * 0.04).toFixed(2) + "%";
}, 2400);


// ─── Build SHA randomizer (cute touch on each load) ───────────────────────────
const shaEl = document.getElementById("build-sha");
if (shaEl) {
  const hex = "0123456789abcdef";
  let sha = "";
  for (let i = 0; i < 7; i++) sha += hex[Math.floor(Math.random() * 16)];
  shaEl.textContent = sha;
}


// ─── Topology (SVG service mesh) ──────────────────────────────────────────────
const topoSvg = document.getElementById("topo");
let topoBuilt = false;

function buildTopology() {
  if (topoBuilt || !topoSvg) return;
  topoBuilt = true;

  const W = 800, H = 460;
  const center = { x: W / 2, y: H / 2, label: "aakash", sub: "backend.os", kind: "center" };
  const nodes = [
    { x: 150, y: 110, label: "incident-agent",   sub: "INC-AGENT-01", kind: "ok" },
    { x: 650, y: 110, label: "mcp-proxy",        sub: "MCP-RAG-02",   kind: "ok" },
    { x: 110, y: 340, label: "journey-planner",  sub: "DIST-SYS-03",  kind: "ok" },
    { x: 690, y: 340, label: "json-mv-index",    sub: "DB-OPT-04",    kind: "ok" },
    { x: 400, y: 60,  label: "groundcover",      sub: "obs",          kind: "ok" },
    { x: 400, y: 410, label: "whatsapp-crm",     sub: "BUILD-05",     kind: "deploy" },
  ];

  // links — curved paths from center to each node
  nodes.forEach(n => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const cx = (center.x + n.x) / 2 + (Math.random() - 0.5) * 40;
    const cy = (center.y + n.y) / 2 + (Math.random() - 0.5) * 40;
    p.setAttribute("d", `M${center.x},${center.y} Q${cx},${cy} ${n.x},${n.y}`);
    p.setAttribute("class", "topo-link");
    p.style.animationDelay = (Math.random() * 1.5) + "s";
    topoSvg.appendChild(p);
  });

  // nodes
  [center, ...nodes].forEach(n => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "topo-node" + (n.kind === "center" ? " center" : "") + (n.kind === "deploy" ? " deploy" : ""));
    g.setAttribute("transform", `translate(${n.x}, ${n.y})`);

    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", n.kind === "center" ? 36 : 26);
    g.appendChild(c);

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("y", -2);
    t.textContent = n.label;
    g.appendChild(t);

    const s = document.createElementNS("http://www.w3.org/2000/svg", "text");
    s.setAttribute("y", 12);
    s.setAttribute("class", "sub");
    s.textContent = n.sub;
    g.appendChild(s);

    topoSvg.appendChild(g);
  });
}


// ─── Live Log Tail ────────────────────────────────────────────────────────────
// Log lines are loaded from the <script type="application/json" id="log-data"> block
// in index.html — edit them there, no need to touch this file.
const ltStream = document.getElementById("lt-stream");
const ltLvl    = document.getElementById("lt-lvl");
const ltTs     = document.getElementById("lt-ts");
let logLines = [];
try {
  const raw = document.getElementById("log-data")?.textContent || "[]";
  logLines = JSON.parse(raw);
} catch (e) {
  console.warn("log-data JSON parse failed — falling back to empty list", e);
  logLines = [];
}

let lineIdx = 0;
let emitting = false;       // re-entrancy guard
let nextTimer = null;       // dedupe scheduling

function lvlClassOf(lvl) {
  if (lvl === "INFO") return "info";
  if (lvl === "WARN") return "warn";
  if (lvl === "ERR")  return "err";
  return "debug";
}

function emitLine() {
  if (!logLines.length) return;
  // hard guard: if a span already exists in the stream, just wait for it
  if (ltStream.childElementCount > 0) return;
  if (emitting) return;
  emitting = true;

  const { lvl, msg } = logLines[lineIdx % logLines.length];
  lineIdx++;

  // update the FIXED left-side meta (level + timestamp) — does not scroll
  const cls = lvlClassOf(lvl);
  ltLvl.className = `lvl ${cls}`;
  ltLvl.textContent = lvl;
  ltTs.textContent = new Date().toISOString().split("T")[1].slice(0, 8);

  // only the message text scrolls
  const span = document.createElement("span");
  span.textContent = msg;
  ltStream.appendChild(span);

  const handleEnd = () => {
    span.removeEventListener("animationend", handleEnd);
    span.remove();
    emitting = false;
    clearTimeout(nextTimer);
    nextTimer = setTimeout(emitLine, 400);
  };
  span.addEventListener("animationend", handleEnd);
}

// pause when tab is hidden, kick a fresh line when it returns
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && ltStream.childElementCount === 0 && !emitting) {
    emitLine();
  }
});

emitLine();


// ─── Copy buttons ─────────────────────────────────────────────────────────────
document.addEventListener("click", e => {
  const c = e.target.closest(".copy");
  if (!c) return;
  e.preventDefault();
  const text = c.dataset.copy;
  navigator.clipboard?.writeText(text).then(() => showToast(`copied · ${text}`)).catch(() => {});
});


// ─── Toast ────────────────────────────────────────────────────────────────────
const toast = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}


// ─── Filter pills (services tab) ──────────────────────────────────────────────
document.querySelectorAll(".f-pill").forEach(p => {
  p.addEventListener("click", () => {
    p.parentElement.querySelectorAll(".f-pill").forEach(x => x.classList.remove("active"));
    p.classList.add("active");
  });
});


// ─── Hash sync (deep linking) ─────────────────────────────────────────────────
function syncHash() {
  const h = location.hash.replace("#", "");
  if (["overview","services","topology","deploys","writing","contact"].includes(h)) switchTo(h);
}
window.addEventListener("hashchange", syncHash);
syncHash();

// update hash when nav clicked
nav.addEventListener("click", e => {
  const li = e.target.closest("li[data-tab]");
  if (li) history.replaceState(null, "", `#${li.dataset.tab}`);
});


// kick off services-tab ticks if user lands there directly
if (location.hash === "#services") animateRps();
if (location.hash === "#topology") buildTopology();


// ─── Re-hydrate after remote content arrives ──────────────────────────────────
// loader.js dispatches "content-ready" once it has hydrated the DOM with the
// latest content.json. We need to re-run animations that bind to elements the
// loader just replaced (counters, log lines), and re-pick-up new RPS values.
document.addEventListener("content-ready", () => {
  // counters live inside [data-count] spans that renderMetrics rewrites
  countersAnimated = false;
  animateCounters();

  // log tail — loader replaced #log-data textContent, re-read it
  try {
    const raw = document.getElementById("log-data")?.textContent || "[]";
    const fresh = JSON.parse(raw);
    if (Array.isArray(fresh) && fresh.length) {
      logLines = fresh;
      lineIdx = 0;
      // if nothing is currently animating, kick the stream
      if (!emitting && ltStream.childElementCount === 0) emitLine();
    }
  } catch (e) {
    console.warn("[script] failed to refresh log-data after content-ready", e);
  }

  // services table was re-rendered → if we're on that tab, start RPS jitter
  // (animateRps is idempotent — guards on rpsInterval)
  const onServicesTab = document.querySelector(".view[data-view='services']:not([hidden])");
  if (onServicesTab) animateRps();
});

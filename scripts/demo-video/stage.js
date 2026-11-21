/* Behavior for stage.html. Every method returns "ok" or a short problem string that record.mjs reports. */
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = { desktop: $("dframe"), phone: $("pframe"), ctl: $("ctl") };
const scale = { desktop: 1, phone: 1, ctl: 1 };
const HIDE = "[data-demo-bar]{display:none!important}html{scrollbar-width:none}::-webkit-scrollbar{display:none}";

/** Boxes are stage pixels [x, y, w, h]; scale enlarges the app so its text reads on a laptop screen. */
const LAYOUT = {
  split: { desktop: { box: [100, 214, 1236, 724], scale: 1.1 }, phone: { box: [1384, 196, 436, 760], scale: 1.05 } },
  desktop: { desktop: { box: [100, 214, 1720, 724], scale: 1.2 } },
  phone: { phone: { box: [1180, 110, 540, 912], scale: 1.32 }, narrow: true },
  chat: { chat: { box: [100, 214, 1000, 680] }, phone: { box: [1180, 110, 540, 912], scale: 1.32 }, narrow: true },
};

function place(name, spec) {
  const el = $(name);
  if (!spec) { el.style.opacity = 0; return; }
  const [x, y, w, h] = spec.box;
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  if (name === "desktop" || name === "phone") {
    const s = spec.scale;
    scale[name] = s;
    const cw = name === "desktop" ? w : w - 26;
    const ch = name === "desktop" ? h - 44 : h - 26;
    const clip = el.querySelector(".clip");
    Object.assign(clip.style, { width: `${cw}px`, height: `${ch}px` });
    Object.assign(frames[name].style, { width: `${cw / s}px`, height: `${ch / s}px`, transform: `scale(${s})` });
  }
  el.style.opacity = 1;
}

function locationOf(f) {
  try { return f.contentDocument.readyState === "complete" ? f.contentWindow.location.href : ""; } catch { return ""; }
}

/** Navigate a frame. The app navigates itself too, so ask the frame where it is instead of remembering. */
function load(frame, url) {
  const f = frames[frame];
  const target = new URL(url, location.href).href;
  const now = locationOf(f);
  if (now === target) return Promise.resolve();
  if (now && now !== "about:blank" && now.split("#")[0] === target.split("#")[0]) {
    f.contentWindow.location.hash = new URL(target).hash;
    return sleep(900);
  }
  return new Promise((resolve) => {
    f.addEventListener("load", () => {
      try { const s = f.contentDocument.createElement("style"); s.textContent = HIDE; f.contentDocument.head.appendChild(s); } catch { /* cross-origin never happens here */ }
      setTimeout(resolve, 1000);
    }, { once: true });
    f.src = target;
  });
}

/** A control by its label or aria-label, then the deepest element containing the text, or a CSS selector ("css:"). */
function find(frame, query) {
  const doc = frames[frame].contentDocument;
  if (!doc) return null;
  if (query.startsWith("css:")) return doc.querySelector(query.slice(4));
  const controls = [...doc.querySelectorAll("button, a, [role=switch], [role=radio], textarea, input, select")].filter((e) => !e.disabled && e.getClientRects().length);
  const label = (e) => (e.textContent || "").trim() || e.getAttribute("aria-label") || "";
  const control = controls.find((e) => label(e).startsWith(query)) || controls.find((e) => (e.getAttribute("aria-label") || "").startsWith(query));
  if (control) return control;
  const matches = [...doc.body.querySelectorAll("*")].filter((e) => e.textContent.includes(query) && e.getClientRects().length);
  return matches.find((e) => ![...e.children].some((c) => c.textContent.includes(query))) || null;
}

function stageRect(frame, el) {
  const f = frames[frame].getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const s = scale[frame];
  return { x: f.left + r.left * s, y: f.top + r.top * s, w: r.width * s, h: r.height * s };
}

/** Scroll the element to the middle of its frame by scrolling the frame only, never the stage. */
async function reveal(frame, el, ms = 700) {
  const win = frames[frame].contentWindow;
  const r = el.getBoundingClientRect();
  const view = win.innerHeight;
  if (r.top > 60 && r.bottom < view - 40) return;
  win.scrollTo({ top: win.scrollY + r.top - view / 2 + Math.min(r.height, view / 2) / 2, behavior: "smooth" });
  await sleep(Math.min(ms, 400));
  // Smooth scrolls can outlast a fixed wait; measure only once the frame has stopped moving.
  let last = -1;
  for (let i = 0; i < 30 && win.scrollY !== last; i++) { last = win.scrollY; await sleep(80); }
}

function setText(id, text) { $(id).textContent = text || ""; }

window.stage = {
  async reset() {
    for (const n of ["desktop", "phone", "chat"]) $(n).style.opacity = 0;
    frames.desktop.src = "about:blank"; frames.phone.src = "about:blank";
    $("head").classList.add("hidden"); $("caption").classList.add("hidden");
    $("points").innerHTML = ""; $("chatbody").innerHTML = ""; $("progress").style.width = "0";
    await sleep(300);
    return "ok";
  },
  async controls(url, labels) {
    await load("ctl", url);
    for (const l of labels) { const el = find("ctl", l); if (!el) return `missing control: ${l}`; el.click(); await sleep(500); }
    return "ok";
  },
  async ctlFill(selector, value) {
    const el = frames.ctl.contentDocument.querySelector(selector);
    if (!el) return `missing: ${selector}`;
    Object.getOwnPropertyDescriptor(frames.ctl.contentWindow.HTMLInputElement.prototype, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(200);
    return "ok";
  },
  async scene({ layout, overline, title, step, caption, desktop, phone, dlabel, points }) {
    $("head").classList.add("hidden"); $("caption").classList.add("hidden");
    [...$("points").children].forEach((d) => d.classList.remove("on"));
    if (dlabel !== undefined) setText("dlabel", dlabel);
    await sleep(380);
    const spec = LAYOUT[layout];
    for (const n of ["desktop", "phone", "chat"]) if (!spec[n]) place(n, null);
    document.body.classList.toggle("narrow", Boolean(spec.narrow));
    await Promise.all([desktop && load("desktop", desktop), phone && load("phone", phone)].filter(Boolean));
    for (const n of ["desktop", "phone", "chat"]) if (spec[n]) place(n, spec[n]);
    $("points").innerHTML = (points || []).map((p) => `<div>${p}</div>`).join("");
    setText("overline", overline); setText("title", title); setText("caption", caption);
    setText("step", step ? `Step ${step[0]} of ${step[1]}` : "");
    $("progress").style.width = step ? `${(step[0] / step[1]) * 100}%` : "0";
    await sleep(120);
    $("head").classList.remove("hidden"); $("caption").classList.remove("hidden");
    await sleep(480);
    return "ok";
  },
  async caption(text) {
    $("caption").classList.add("hidden"); await sleep(400);
    setText("caption", text); $("caption").classList.remove("hidden"); await sleep(500);
    return "ok";
  },
  async reveal(i) { const d = $("points").children[i]; if (d) d.classList.add("on"); await sleep(700); return "ok"; },
  async go(frame, url, label) { if (label !== undefined) setText("dlabel", label); await load(frame, url); return "ok"; },
  async card({ kicker, big, sub, lines, meta }) {
    setText("ckicker", kicker); setText("cbig", big); setText("csub", sub); setText("cmeta", meta);
    $("clines").innerHTML = (lines || []).map((l) => `<div>${l}</div>`).join("");
    $("card").style.opacity = 1; await sleep(800);
    return "ok";
  },
  async uncard() { $("card").style.opacity = 0; await sleep(800); return "ok"; },
  async point(frame, query, { click = false, wait = 0, fast = false } = {}) {
    const el = find(frame, query);
    if (!el) return `missing: ${query}`;
    await reveal(frame, el, fast ? 450 : 700);
    const r = stageRect(frame, el);
    const c = $("cursor"); c.style.opacity = 1;
    c.style.transitionDuration = fast ? ".45s, .4s" : ".8s, .4s";
    c.style.transform = `translate(${r.x + r.w / 2 - 6}px, ${r.y + r.h / 2 - 4}px)`;
    await sleep(fast ? 520 : 950);
    if (click) {
      const rip = document.createElement("div"); rip.className = "ripple";
      rip.style.left = `${r.x + r.w / 2}px`; rip.style.top = `${r.y + r.h / 2}px`;
      document.body.appendChild(rip); setTimeout(() => rip.remove(), 700);
      await sleep(120); el.click();
    }
    await sleep(wait);
    return "ok";
  },
  hideCursor() { $("cursor").style.opacity = 0; return "ok"; },
  async spot(frame, query, ms = 1800, container = true) {
    const el = find(frame, query);
    if (!el) return `missing: ${query}`;
    await reveal(frame, el);
    const host = container ? el.closest("[class*='paper'], section, tr, li") || el : el;
    const r = stageRect(frame, host);
    Object.assign($("spot").style, { left: `${r.x - 8}px`, top: `${r.y - 8}px`, width: `${r.w + 16}px`, height: `${r.h + 16}px`, opacity: 1 });
    await sleep(ms); $("spot").style.opacity = 0; await sleep(350);
    return "ok";
  },
  async type(frame, query, text, cps = 22) {
    const el = query.startsWith("css:") ? frames[frame].contentDocument.querySelector(query.slice(4)) : find(frame, query);
    if (!el) return `missing: ${query}`;
    await reveal(frame, el, 500);
    const win = frames[frame].contentWindow;
    const proto = el.tagName === "TEXTAREA" ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(proto, "value").set;
    el.focus();
    for (let i = 1; i <= text.length; i++) { set.call(el, text.slice(0, i)); el.dispatchEvent(new Event("input", { bubbles: true })); await sleep(1000 / cps); }
    return "ok";
  },
  async choose(frame, selector, value) {
    const el = frames[frame].contentDocument.querySelector(selector);
    if (!el) return `missing: ${selector}`;
    await reveal(frame, el, 500);
    Object.getOwnPropertyDescriptor(frames[frame].contentWindow.HTMLSelectElement.prototype, "value").set.call(el, String(value));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(500);
    return "ok";
  },
  async scroll(frame, to, ms = 2400) {
    const win = frames[frame].contentWindow;
    const target = typeof to === "number" ? to : (() => { const el = find(frame, to); return el ? el.getBoundingClientRect().top + win.scrollY - 90 : win.scrollY; })();
    const from = win.scrollY; const t0 = performance.now();
    await new Promise((resolve) => { const tick = (t) => { const p = Math.min(1, (t - t0) / ms); const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; win.scrollTo(0, from + (target - from) * e); if (p < 1) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); });
    return "ok";
  },
  async waitFor(frame, text, ms = 12000) {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      try { if (frames[frame].contentDocument.body.textContent.includes(text)) return "ok"; } catch { /* still loading */ }
      await sleep(250);
    }
    return `timed out waiting for: ${text}`;
  },
  chatOpen(note) { $("chatbody").innerHTML = ""; setText("chatnote", note); const i = $("chatinput"); i.textContent = "Message your assistant…"; i.classList.add("empty"); return "ok"; },
  async chatUser(text, cps = 24) {
    const input = $("chatinput"); input.classList.remove("empty");
    for (let i = 1; i <= text.length; i++) { input.textContent = text.slice(0, i); await sleep(1000 / cps); }
    await sleep(350);
    input.textContent = "Message your assistant…"; input.classList.add("empty");
    const m = document.createElement("div"); m.className = "msg user"; m.textContent = text; $("chatbody").appendChild(m);
    await sleep(30); m.classList.add("on"); await sleep(500);
    return "ok";
  },
  async chatTool(name) {
    const t = document.createElement("div"); t.className = "tool"; t.innerHTML = `Using Attune · <b>${name}</b> …`; t.dataset.name = name;
    $("chatbody").appendChild(t); await sleep(30); t.classList.add("on"); await sleep(400);
    return "ok";
  },
  async chatToolDone(name, detail) {
    const t = [...$("chatbody").querySelectorAll(".tool")].reverse().find((x) => x.dataset.name === name);
    if (!t) return `missing tool row: ${name}`;
    t.innerHTML = `✓ Attune · <b>${name}</b>${detail ? ` · ${detail}` : ""}`; t.classList.add("done"); await sleep(450);
    return "ok";
  },
  async chatSay(text, wps = 9) {
    const m = document.createElement("div"); m.className = "msg ai"; $("chatbody").appendChild(m);
    await sleep(30); m.classList.add("on");
    const words = text.split(" ");
    for (let i = 1; i <= words.length; i++) { m.textContent = words.slice(0, i).join(" "); await sleep(1000 / wps); }
    await sleep(300);
    return "ok";
  },
  world() { return JSON.parse(localStorage.getItem("attune.world.v4")); },
};

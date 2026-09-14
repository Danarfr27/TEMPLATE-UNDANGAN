/* ============================================================
   LUXURY CINEMATIC WEDDING INVITATION — script.js
   ============================================================ */
"use strict";

/* ---------- 0. CONFIG (easy to replace) ---------- */
const CONFIG = {
  groomName: "Alexander",
  brideName: "Amelia",
  weddingDateISO: "2026-12-12T09:00:00+07:00",   // WEDDING_DATE
  venueName: "Grand Wedding Hall",
  mapsUrl: "https://maps.google.com/?q=Grand+Wedding+Hall+Jakarta",
};

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_TOUCH = window.matchMedia("(hover: none)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/* ============================================================
   1. OPENING SEQUENCE
   ============================================================ */
function initOpening() {
  const opening = document.getElementById("opening");
  const btn = document.getElementById("openInvitation");
  if (!opening || !btn) return;

  // staggered entrance of the overlay content
  requestAnimationFrame(() =>
    requestAnimationFrame(() => opening.classList.add("sequenced"))
  );

  btn.addEventListener("click", () => {
    if (opening.classList.contains("is-opening")) return;
    opening.classList.add("is-opening");
    opening.classList.add("is-done");

    // hero title animation starts right as panels part
    setTimeout(() => document.body.classList.add("is-opened"), 650);

    // start music with the invitation (user gesture — autoplay safe)
    playMusic();
    initScrollExperience(); // scroll effects unlock after opening
  });
}

/* ============================================================
   2. MUSIC
   ============================================================ */
const music = {
  el: document.getElementById("bgMusic"),
  toggle: document.getElementById("musicToggle"),
  playing: false,
};

function playMusic() {
  if (!music.el) return;
  music.el.volume = 0.55;
  const p = music.el.play();
  if (p !== undefined) {
    p.then(() => setMusicState(true)).catch(() => setMusicState(false));
  }
}
function setMusicState(on) {
  music.playing = on;
  music.toggle.classList.toggle("is-playing", on);
  music.toggle.setAttribute("aria-pressed", String(on));
}
function initMusic() {
  if (!music.el || !music.toggle) return;
  music.toggle.addEventListener("click", () => {
    if (music.playing) { music.el.pause(); setMusicState(false); }
    else { music.el.play().then(() => setMusicState(true)).catch(() => {}); }
  });
}

/* ============================================================
   3. COUNTDOWN
   ============================================================ */
function initCountdown() {
  const nums = {
    days: document.querySelector('[data-unit="days"]'),
    hours: document.querySelector('[data-unit="hours"]'),
    minutes: document.querySelector('[data-unit="minutes"]'),
    seconds: document.querySelector('[data-unit="seconds"]'),
  };
  if (!nums.days) return;
  const target = new Date(CONFIG.weddingDateISO).getTime();
  const prev = {};

  function setNum(el, key, value) {
    if (prev[key] === value) return;
    prev[key] = value;
    el.textContent = value;
    if (!REDUCED_MOTION) {
      el.classList.remove("tick");
      void el.offsetWidth; // restart animation
      el.classList.add("tick");
    }
  }

  function tick() {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    const pad = n => String(n).padStart(2, "0");
    setNum(nums.days, "d", pad(d));
    setNum(nums.hours, "h", pad(h));
    setNum(nums.minutes, "m", pad(m));
    setNum(nums.seconds, "s", pad(s));
  }
  tick();
  setInterval(tick, 1000);
}

/* ============================================================
   4. SCROLL EXPERIENCE — reveals, frames, depth, parallax
   Single rAF-driven loop for buttery performance.
   ============================================================ */
const scrollState = {
  started: false,
  frames: [],      // memory-frame entries
  parallax: [],    // [element, speed]
  viewportH: window.innerHeight,
};

function measureFrames() {
  scrollState.frames = [];
  document.querySelectorAll("[data-frame]").forEach(frame => {
    const hole = frame.querySelector(".frame-hole");
    const photo = frame.querySelector(".photo-depth");
    if (!hole || !photo) return;
    scrollState.frames.push({ frame, hole, photo });
  });
}

function measureParallax() {
  scrollState.parallax = [];
  document.querySelectorAll("[data-parallax]").forEach(el => {
    scrollState.parallax.push({ el, speed: parseFloat(el.dataset.parallax) || 0.1 });
  });
}

/* progress of element through viewport: 0 (below) → 1 (fully passed) */
function viewportProgress(rect) {
  const vh = scrollState.viewportH;
  return clamp((vh - rect.top) / (vh + rect.height), 0, 1);
}

function updateFrames() {
  const vh = scrollState.viewportH;
  for (const { frame, hole, photo } of scrollState.frames) {
    const rect = hole.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > vh + 200) continue;

    const p = viewportProgress(rect);
    const depth = parseFloat(photo.dataset.depth || "0.6");

    // ---- phase A: frame scale/opacity rises first ----
    const frameP = easeOutCubic(clamp(p / depth, 0, 1));
    hole.style.transform = `scale(${lerp(0.86, 1, frameP)})`;

    // ---- phase B: photo travels from deep inside the hole toward viewer ----
    // scale 0.55→1.08, translateZ -500px→0, blur 8px→0, opacity 0→1
    const photoStart = depth * 0.35;
    const photoP = easeOutCubic(clamp((p - photoStart) / (1 - photoStart), 0, 1));
    const scale = lerp(0.55, 1.08, photoP);
    const tz = lerp(-500, 0, photoP);
    const blur = lerp(8, 0, photoP);
    const opacity = lerp(0, 1, clamp(photoP * 1.6, 0, 1));

    photo.style.transform = `translateZ(${tz}px) scale(${scale})`;
    photo.style.filter = `blur(${blur.toFixed(2)}px)`;
    photo.style.opacity = opacity.toFixed(3);

    // subtle 3D camera tilt while approaching
    const tilt = (1 - photoP) * -6;
    hole.style.transform += ` rotateX(${tilt.toFixed(2)}deg)`;

    frame.classList.toggle("frame-in", p > 0.18);
  }
}

function updateParallax() {
  const scrollY = window.scrollY;
  for (const { el, speed } of scrollState.parallax) {
    el.style.transform = `translate3d(0, ${(scrollY * speed).toFixed(1)}px, 0)`;
  }
}

function rafLoop() {
  if (!REDUCED_MOTION) {
    updateFrames();
    updateParallax();
  }
  requestAnimationFrame(rafLoop);
}

/* ---------- IntersectionObserver reveals ---------- */
function initReveals() {
  const targets = document.querySelectorAll(
    ".reveal-fade, .reveal-text, .reveal-scale, .reveal-card, .closing-line"
  );
  if (REDUCED_MOTION) {
    targets.forEach(t => t.classList.add("in"));
    document.querySelectorAll("[data-frame]").forEach(f => f.classList.add("frame-in"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  targets.forEach(t => io.observe(t));
}

/* sequencing: stagger sibling reveals inside the same section */
function initSequencing() {
  document.querySelectorAll(".section, .event-cards, .gift-cards").forEach(scope => {
    const items = scope.querySelectorAll(".reveal-card, .gallery-item");
    items.forEach((item, i) => {
      item.style.transitionDelay = `${i * 0.12}s`;
    });
  });
}

function initScrollExperience() {
  if (scrollState.started) return;
  scrollState.started = true;
  measureFrames();
  measureParallax();
  initReveals();
  initSequencing();
  requestAnimationFrame(rafLoop);
}

window.addEventListener("resize", () => {
  scrollState.viewportH = window.innerHeight;
  if (scrollState.started) measureFrames();
}, { passive: true });

/* ============================================================
   5. GALLERY + LIGHTBOX
   ============================================================ */
function initGallery() {
  const items = Array.from(document.querySelectorAll("[data-gallery]"));
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbCap = document.getElementById("lightboxCaption");
  if (!items.length || !lb) return;

  let index = 0;
  let touchStartX = 0;

  function show(i) {
    index = (i + items.length) % items.length;
    const img = items[index].querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = items[index].querySelector("figcaption")?.textContent || "";
  }
  function open(i) {
    show(i);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add("is-visible"));
    document.body.style.overflow = "hidden";
    document.getElementById("lightboxClose").focus();
  }
  function close() {
    lb.classList.remove("is-visible");
    document.body.style.overflow = "";
    setTimeout(() => { lb.hidden = true; }, 500);
  }

  items.forEach((item, i) => {
    item.addEventListener("click", () => open(i));
    item.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
    });
  });

  document.getElementById("lightboxClose").addEventListener("click", close);
  document.getElementById("lightboxPrev").addEventListener("click", () => show(index - 1));
  document.getElementById("lightboxNext").addEventListener("click", () => show(index + 1));

  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  lb.addEventListener("click", e => { if (e.target === lb) close(); });

  /* swipe support */
  lb.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
}

/* ============================================================
   6. RSVP + WISHES (guestbook)
   ============================================================ */
const WISHES_KEY = "wa_wishes_v1";

function loadWishes() {
  try { return JSON.parse(localStorage.getItem(WISHES_KEY)) || []; }
  catch { return []; }
}
function saveWishes(list) {
  try { localStorage.setItem(WISHES_KEY, JSON.stringify(list)); } catch {}
}
function renderWishes() {
  const ul = document.getElementById("wishesList");
  if (!ul) return;
  const wishes = loadWishes();
  ul.innerHTML = "";
  wishes.forEach(w => ul.appendChild(buildWishNode(w)));
}
function buildWishNode(w) {
  const li = document.createElement("li");
  li.className = "wish";
  const head = document.createElement("div");
  head.className = "wish-head";
  const name = document.createElement("span");
  name.className = "wish-name";
  name.textContent = w.name;
  const badge = document.createElement("span");
  badge.className = "wish-badge";
  badge.textContent = w.attend;
  head.append(name, badge);
  const text = document.createElement("p");
  text.className = "wish-text";
  text.textContent = "“" + w.message + "”";
  li.append(head, text);
  return li;
}

function initRSVP() {
  const form = document.getElementById("rsvpForm");
  const status = document.getElementById("rsvpStatus");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const fields = form.elements;
    const name = fields["name"].value.trim();
    const guests = fields["guests"].value;
    const attend = fields["attend"].value;
    const message = fields["message"].value.trim() || "Thank you for inviting us.";

    if (!name || !guests) {
      status.textContent = "Please fill in your name and number of guests.";
      status.style.color = "#d98f8f";
      return;
    }

    const list = loadWishes();
    list.unshift({ name, guests, attend, message });
    saveWishes(list);

    // cinematic confirmation
    status.style.color = "";
    status.textContent = "Your response has been received — see you there.";
    if (!REDUCED_MOTION) {
      form.style.transition = "opacity .6s ease, transform .6s ease, filter .6s ease";
      form.style.opacity = "0";
      form.style.transform = "scale(.97)";
      form.style.filter = "blur(4px)";
      setTimeout(() => {
        form.reset();
        form.style.opacity = "1";
        form.style.transform = "";
        form.style.filter = "";
      }, 1400);
    } else form.reset();

    renderWishes();
    setTimeout(() => { status.textContent = ""; }, 5000);
  });
}

/* ============================================================
   7. GIFT — copy buttons
   ============================================================ */
function initGift() {
  document.querySelectorAll("[data-copy]").forEach(btn => {
    const original = btn.querySelector(".btn-label").textContent;
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try { await navigator.clipboard.writeText(text); }
      catch {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); ta.remove();
      }
      const label = btn.querySelector(".btn-label");
      label.textContent = "Copied";
      setTimeout(() => { label.textContent = original; }, 1800);
    });
  });
}

/* ============================================================
   8. CUSTOM CURSOR (desktop only)
   ============================================================ */
function initCursor() {
  if (IS_TOUCH || REDUCED_MOTION) return;
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  document.body.classList.add("cursor-on");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  document.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  }, { passive: true });

  (function follow() {
    rx = lerp(rx, mx, 0.16);
    ry = lerp(ry, my, 0.16);
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(follow);
  })();

  const hoverables = "a, button, [role='button'], input, select, textarea, .gallery-item";
  document.addEventListener("mouseover", e => {
    if (e.target.closest(hoverables)) ring.classList.add("is-hover");
  });
  document.addEventListener("mouseout", e => {
    if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
  });
}

/* ============================================================
   9. MAGNETIC BUTTONS (desktop only)
   ============================================================ */
function initMagnetic() {
  if (IS_TOUCH || REDUCED_MOTION) return;
  document.querySelectorAll(".btn-magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
      btn.style.transform = "";
      setTimeout(() => { btn.style.transition = ""; }, 600);
    });
  });
}

/* ============================================================
   10. DUST PARTICLES
   ============================================================ */
function initDust() {
  const canvas = document.getElementById("dust");
  if (!canvas || REDUCED_MOTION) return;
  const ctx = canvas.getContext("2d");
  let w, h, particles = [];
  const COUNT = Math.min(70, Math.floor(innerWidth / 22));

  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(Math.random() * 0.22 + 0.05),
      a: Math.random() * 0.35 + 0.08,
      ph: Math.random() * Math.PI * 2,
    });
  }

  (function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.ph += 0.008;
      p.x += p.vx + Math.sin(p.ph) * 0.12;
      p.y += p.vy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      const tw = p.a * (0.6 + 0.4 * Math.sin(p.ph * 2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 207, 154, ${tw.toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initOpening();
  initMusic();
  initCountdown();
  initGallery();
  initRSVP();
  renderWishes();
  initGift();
  initCursor();
  initMagnetic();
  initDust();
});

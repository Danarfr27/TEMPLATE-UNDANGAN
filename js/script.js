/* THE WEDDING OF ALEXANDER & AMELIA — script.js · Vanilla JS ES6+ */
'use strict';

/* 0. CONFIG — ganti data pengantin di sini */
const CONFIG = {
  groomName: 'Alexander James',
  brideName: 'Amelia Rose',
  weddingDateISO: '2026-12-12T09:00:00+07:00',
  rsvpDeadlineISO: '2026-12-01T23:59:59+07:00',
  mapsUrl: 'https://maps.google.com/?q=Kemang+Raya+Jakarta',
  musicSrc: 'audio/wedding-song.wav',
  storageKey: 'am_wishes_v1',
  rsvpKey: 'am_rsvp_v1',
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/* 1. OPENING — cinematic door transition */
function initOpening() {
  const opening = document.getElementById('opening');
  const btnOpen = document.getElementById('btnOpen');
  const site = document.getElementById('site');

  document.body.classList.add('is-locked');
  requestAnimationFrame(() => opening.classList.add('is-loaded'));

  btnOpen.addEventListener('click', () => {
    if (opening.classList.contains('is-opening')) return;
    opening.classList.add('is-opening');
    Music.start();

    const DOOR_MS = 1750;
    setTimeout(() => {
      document.body.classList.remove('is-locked');
      document.body.classList.add('is-opened');
      site.setAttribute('aria-hidden', 'false');
    }, DOOR_MS * 0.55);

    setTimeout(() => {
      opening.classList.add('is-done');
      ScrollFX.start();
    }, DOOR_MS);
  }, { passive: true });
}

/* 2. MUSIC — HTML Audio API */
const Music = (() => {
  const audio = document.getElementById('bgMusic');
  const toggle = document.getElementById('musicToggle');
  let playing = false;

  audio.volume = 0.55;

  async function start() {
    try {
      await audio.play();
      playing = true;
      sync();
    } catch (err) {
      playing = false;
      sync();
    }
  }
  function pause() { audio.pause(); playing = false; sync(); }
  function sync() {
    toggle.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
  }
  toggle.addEventListener('click', () => (playing ? pause() : start()));
  return { start, get playing() { return playing; } };
})();

/* 3. SCROLL FX ENGINE — one rAF loop: reveals, depth frames, parallax */
const ScrollFX = (() => {
  const scenes = [];
  const parallax = [];
  let ticking = false;
  let running = false;
  let vh = window.innerHeight;

  function collect() {
    document.querySelectorAll('[data-depth]').forEach(scene => {
      const win = scene.querySelector('.frame-window');
      const photo = scene.querySelector('.frame-photo');
      if (win && photo) scenes.push({ scene, win, photo });
    });
    document.querySelectorAll('[data-parallax]').forEach(el => {
      parallax.push([el, parseFloat(el.dataset.parallax) || 0.15]);
    });
  }

  function initReveals() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const el = en.target;
          const sibs = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [el];
          const idx = sibs.indexOf(el);
          el.style.setProperty('--rd', `${Math.min(idx, 5) * 0.09}s`);
          el.classList.add('in-view');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  function updateDepth() {
    const scrollY = window.scrollY;
    for (const [el, speed] of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
    for (const s of scenes) {
      const r = s.scene.getBoundingClientRect();
      if (r.bottom < -160 || r.top > vh + 160) continue;
      const raw = (vh - r.top) / (vh * 0.92);
      const p = easeOutCubic(clamp(raw, 0, 1));
      const tz = -460 * (1 - p);
      const sc = 0.58 + 0.45 * p;
      const bl = 9 * (1 - p);
      const op = clamp(p * 1.5, 0, 1);
      s.photo.style.transform = `translateZ(${tz.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      s.photo.style.filter = `blur(${bl.toFixed(2)}px) brightness(${(0.7 + 0.3 * p).toFixed(2)})`;
      s.photo.style.opacity = op.toFixed(2);
      const drift = (r.top + r.height / 2 - vh / 2) / vh;
      s.win.style.transform = `rotateX(${(-drift * 3).toFixed(2)}deg)`;
    }
    void scrollY;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { updateDepth(); ticking = false; });
    }
  }
  function onResize() { vh = window.innerHeight; updateDepth(); }

  function start() {
    if (running) return;
    running = true;
    if (!prefersReducedMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      updateDepth();
    } else {
      scenes.forEach(s => {
        s.photo.style.transform = 'none';
        s.photo.style.filter = 'none';
        s.photo.style.opacity = '1';
      });
    }
  }

  function init() { collect(); initReveals(); }
  return { init, start };
})();

/* 4. COUNTDOWN — animated number transitions */
function initCountdown() {
  const target = new Date(CONFIG.weddingDateISO).getTime();
  const els = {
    d: document.getElementById('cd-days'),
    h: document.getElementById('cd-hours'),
    m: document.getElementById('cd-mins'),
    s: document.getElementById('cd-secs'),
  };
  const pad = n => String(n).padStart(2, '0');
  const prev = {};

  function setNum(el, key, val) {
    if (prev[key] === val) return;
    prev[key] = val;
    el.textContent = pad(val);
    if (!prefersReducedMotion) {
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
    }
  }
  function tick() {
    const diff = Math.max(0, target - Date.now());
    setNum(els.d, 'd', Math.floor(diff / 864e5));
    setNum(els.h, 'h', Math.floor(diff / 36e5) % 24);
    setNum(els.m, 'm', Math.floor(diff / 6e4) % 60);
    setNum(els.s, 's', Math.floor(diff / 1e3) % 60);
  }
  tick();
  setInterval(tick, 1000);
}

/* 5. GALLERY + LIGHTBOX (keyboard + swipe) */
function initGallery() {
  const items = [...document.querySelectorAll('.g-item')];
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const data = items.map(f => ({
    src: f.querySelector('img').getAttribute('src'),
    alt: f.querySelector('img').alt,
    cap: f.querySelector('figcaption')?.textContent || '',
  }));
  let idx = 0;
  let lastFocus = null;
  let touchX = null;

  function open(i) {
    idx = (i + data.length) % data.length;
    lastFocus = document.activeElement;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    show();
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  }
  function show() {
    lbImg.src = data[idx].src;
    lbImg.alt = data[idx].alt;
    lbCap.textContent = data[idx].cap;
  }
  function close() {
    lb.classList.remove('is-open');
    setTimeout(() => { lb.hidden = true; }, 450);
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function nav(dir) { idx = (idx + dir + data.length) % data.length; show(); }

  items.forEach((f, i) => {
    f.setAttribute('tabindex', '0');
    f.setAttribute('role', 'button');
    f.setAttribute('aria-label', `Perbesar foto: ${data[i].cap}`);
    f.addEventListener('click', () => open(i));
    f.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', () => nav(-1));
  document.getElementById('lbNext').addEventListener('click', () => nav(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 48) nav(dx > 0 ? -1 : 1);
    touchX = null;
  }, { passive: true });
}

/* 6. RSVP + WISHES */
function initRsvp() {
  const form = document.getElementById('rsvpForm');
  const err = document.getElementById('formError');
  const overlay = document.getElementById('confirmOverlay');
  const confirmText = document.getElementById('confirmText');

  form.addEventListener('submit', e => {
    e.preventDefault();
    err.textContent = '';
    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const guests = fd.get('guests');
    const attend = fd.get('attend');
    const message = (fd.get('message') || '').toString().trim();

    if (!name) { err.textContent = 'Mohon isi nama Anda.'; return; }
    if (!guests) { err.textContent = 'Mohon pilih jumlah tamu.'; return; }
    if (!attend) { err.textContent = 'Mohon konfirmasi kehadiran Anda.'; return; }

    const rsvp = { name, guests, attend, message, ts: Date.now() };
    try {
      const all = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
      all.unshift(rsvp);
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(all.slice(0, 60)));
      localStorage.setItem(CONFIG.rsvpKey, JSON.stringify(rsvp));
    } catch (errStorage) { /* private mode — continue gracefully */ }

    confirmText.textContent = `Terima kasih, ${name}. Konfirmasi "${attend}" untuk ${guests} tamu telah kami terima.`;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    renderWishes();
    form.reset();
  });

  document.getElementById('confirmClose').addEventListener('click', () => {
    overlay.classList.remove('is-open');
    setTimeout(() => { overlay.hidden = true; }, 450);
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('is-open');
      setTimeout(() => { overlay.hidden = true; }, 450);
    }
  });
}

function renderWishes() {
  const list = document.getElementById('wishList');
  let wishes = [];
  try { wishes = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]'); }
  catch (e) { wishes = []; }

  const seed = [
    { name: 'Rangga & Dita', attend: 'Hadir', message: 'Selamat menempuh hidup baru! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.' },
    { name: 'Keluarga Wijaya', attend: 'Hadir', message: 'Bahagia selalu untuk Alex dan Amelia. Semoga lancar sampai hari-H!' },
    { name: 'Sarah', attend: 'Masih Ragu', message: 'Turut berbahagia untuk kalian berdua. Semoga Allah memberkahi pernikahan ini.' },
  ];
  const all = [...wishes, ...seed].slice(0, 8);

  list.innerHTML = all.length
    ? all.map(w => `
      <article class="wish-item">
        <div class="wish-head">
          <span class="wish-name">${escapeHtml(w.name)}</span>
          <span class="wish-badge">${escapeHtml(w.attend)}</span>
        </div>
        <p class="wish-msg">${escapeHtml(w.message || '—')}</p>
      </article>`).join('')
    : '<p class="wish-empty">Belum ada ucapan. Jadilah yang pertama memberikan doa.</p>';
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* 7. GIFT — copy to clipboard */
function initGift() {
  document.querySelectorAll('[data-copy], [data-copy-text]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copyText ||
        (document.getElementById(btn.dataset.copy)?.textContent || '').trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); ta.remove();
      }
      const label = btn.querySelector('span');
      const old = label.textContent;
      btn.classList.add('is-copied');
      label.textContent = 'COPIED ✓';
      setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = old; }, 1800);
    });
  });
}

/* 8. CUSTOM CURSOR */
function initCursor() {
  if (!isFinePointer || prefersReducedMotion) return;
  document.body.classList.add('has-cursor');
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  }, { passive: true });

  (function loop() {
    rx = lerp(rx, mx, 0.16);
    ry = lerp(ry, my, 0.16);
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();

  const hoverSel = 'a, button, select, input, textarea, label, .g-item';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverSel)) ring.classList.add('is-hover');
  }, { passive: true });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverSel)) ring.classList.remove('is-hover');
  }, { passive: true });
  document.addEventListener('mousedown', () => ring.classList.add('is-down'));
  document.addEventListener('mouseup', () => ring.classList.remove('is-down'));
}

/* 9. MAGNETIC BUTTONS */
function initMagnetic() {
  if (!isFinePointer || prefersReducedMotion) return;
  document.querySelectorAll('.magnetic').forEach(el => {
    const strength = 22;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      el.style.transform = `translate(${x * strength * 0.4}px, ${y * strength * 0.5}px)`;
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 600);
    }, { passive: true });
  });
}

/* 10. DUST PARTICLES */
function initDust() {
  if (prefersReducedMotion) return;
  const canvas = document.getElementById('dust');
  const ctx = canvas.getContext('2d');
  let W, H, parts = [];
  const COUNT = innerWidth < 640 ? 28 : 55;

  function resize() {
    W = canvas.width = innerWidth * devicePixelRatio;
    H = canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  function spawn() {
    parts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (Math.random() * 1.6 + 0.4) * devicePixelRatio,
      vy: -(Math.random() * 0.14 + 0.04) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.1 * devicePixelRatio,
      a: Math.random() * 0.35 + 0.08,
      ph: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.015 + 0.006,
    }));
  }
  let visible = true;
  function loop() {
    if (visible) {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.ph += p.sp;
        p.x += p.vx + Math.sin(p.ph) * 0.12 * devicePixelRatio;
        p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        const tw = 0.55 + 0.45 * Math.sin(p.ph * 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214, 178, 110, ${(p.a * tw).toFixed(3)})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  window.addEventListener('resize', () => { resize(); spawn(); }, { passive: true });
  resize(); spawn(); loop();
}

/* BOOT */
document.addEventListener('DOMContentLoaded', () => {
  ScrollFX.init();
  initOpening();
  initCountdown();
  initGallery();
  initRsvp();
  renderWishes();
  initGift();
  initCursor();
  initMagnetic();
  initDust();
});

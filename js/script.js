(() => {
  "use strict";

  const CONFIG = {
    weddingDate: "2026-12-12T09:00:00+07:00",
    gallery: [
      { src: "images/gallery-1.svg", caption: "01 / STILLNESS" },
      { src: "images/gallery-2.svg", caption: "02 / LAUGHTER" },
      { src: "images/gallery-3.svg", caption: "03 / SUNSET" },
      { src: "images/gallery-4.svg", caption: "04 / TOGETHER" },
      { src: "images/gallery-5.svg", caption: "05 / HOME" }
    ]
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function initOpening() {
    const opening = $("#opening");
    const button = $("#openInvitation");
    const music = $("#bgMusic");

    if (!opening || !button) return;

    button.addEventListener("click", () => {
      opening.classList.add("is-open", "is-leaving");
      document.body.classList.remove("is-locked");

      if (music) {
        music.volume = 0.34;
        music.play().then(() => setMusicState(true)).catch(() => setMusicState(false));
      }

      window.setTimeout(() => {
        opening.style.display = "none";
      }, 1900);
    });
  }

  function setMusicState(isPlaying) {
    const toggle = $("#musicToggle");
    const bars = $(".music-bars");
    if (!toggle || !bars) return;
    toggle.setAttribute("aria-pressed", String(isPlaying));
    bars.classList.toggle("is-playing", isPlaying);
  }

  function initMusic() {
    const music = $("#bgMusic");
    const toggle = $("#musicToggle");
    if (!music || !toggle) return;

    toggle.addEventListener("click", async () => {
      try {
        if (music.paused) {
          await music.play();
          setMusicState(true);
        } else {
          music.pause();
          setMusicState(false);
        }
      } catch {
        showToast("Audio lokal belum tersedia. Tambahkan lagu sendiri di audio/ambient-pulse.wav atau ganti source di index.html.");
      }
    });

    music.addEventListener("play", () => setMusicState(true));
    music.addEventListener("pause", () => setMusicState(false));
    music.addEventListener("error", () => setMusicState(false));
  }

  function initCountdown() {
    const nodes = {
      days: $('[data-count="days"]'),
      hours: $('[data-count="hours"]'),
      minutes: $('[data-count="minutes"]'),
      seconds: $('[data-count="seconds"]')
    };
    const target = new Date(CONFIG.weddingDate).getTime();

    const pad = value => String(value).padStart(2, "0");

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      nodes.days.textContent = String(days).padStart(2, "0");
      nodes.hours.textContent = pad(hours);
      nodes.minutes.textContent = pad(minutes);
      nodes.seconds.textContent = pad(seconds);
    }

    tick();
    window.setInterval(tick, 1000);
  }

  function initReveal() {
    const reveal = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveal.forEach(el => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    reveal.forEach(el => observer.observe(el));
  }

  function initFrameAnimations() {
    const scenes = $$("[data-frame-scene]");
    if (!scenes.length) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const viewportCenter = window.innerHeight * 0.5;

      scenes.forEach(scene => {
        const rect = scene.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (viewportCenter - rect.top) / Math.max(rect.height, 1)));
        const distance = Math.min(1.25, Math.max(-0.35, progress));

        const photo = $(".depth-photo", scene);
        const shadow = $(".media-frame__shadow, .story-scene__depth", scene);
        if (!photo) return;

        const z = -420 + distance * 440;
        const scale = 0.58 + distance * 0.48;
        const rotateX = (0.12 - distance * 0.14) * 25;
        const rotateY = (0.5 - distance) * 5;
        const x = Math.sin(distance * Math.PI) * (scene.matches(".story-scene--reverse") ? 12 : -12);
        const y = (0.5 - distance) * 26;
        const blur = Math.max(0, (1 - distance) * 8);

        photo.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        photo.style.filter = `blur(${blur}px)`;
        photo.style.opacity = String(Math.min(1, Math.max(0, distance * 1.5)));

        if (shadow) {
          shadow.style.transform = `translate3d(${x * .45}px, ${Math.max(0, y) + 18}px, ${z * .1}px) scale(${0.86 + distance * .16})`;
          shadow.style.opacity = String(0.25 + distance * 0.55);
        }

        scene.style.setProperty("--scene-progress", distance.toFixed(4));
      });
    };

    const request = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    request();
  }

  function initParallax() {
    const hero = $(".hero");
    if (!hero) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      hero.style.setProperty("--hero-y", `${y * 0.1}px`);
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
  }

  function initScrollIndex() {
    const sections = $$("[data-section]");
    const index = $("#scrollIndex");
    if (!index) return;

    let active = 1;
    const total = 11;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = sections.indexOf(entry.target);
          if (section >= 0) active = Math.min(total, section + 1);
          index.textContent = `${String(active).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
        }
      });
    }, { threshold: 0.42 });

    sections.forEach(section => observer.observe(section));
  }

  function initGallery() {
    const lightbox = $("#lightbox");
    const image = $("#lightboxImage");
    const caption = $("#lightboxCaption");
    const cards = $$(".gallery-card");
    const close = $(".lightbox__close", lightbox);
    const prev = $(".lightbox__nav--prev", lightbox);
    const next = $(".lightbox__nav--next", lightbox);
    let current = 0;

    if (!lightbox || !cards.length) return;

    const render = () => {
      const item = CONFIG.gallery[current];
      image.src = item.src;
      image.alt = item.caption;
      caption.textContent = item.caption;
    };

    const open = index => {
      current = index;
      render();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
      close.focus();
    };

    const hide = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
    };

    cards.forEach(card => card.addEventListener("click", () => open(Number(card.dataset.gallery))));
    close.addEventListener("click", hide);
    prev.addEventListener("click", () => { current = (current - 1 + CONFIG.gallery.length) % CONFIG.gallery.length; render(); });
    next.addEventListener("click", () => { current = (current + 1) % CONFIG.gallery.length; render(); });

    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) hide();
    });

    window.addEventListener("keydown", event => {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") hide();
      if (event.key === "ArrowLeft") prev.click();
      if (event.key === "ArrowRight") next.click();
    });

    let touchX = 0;
    lightbox.addEventListener("touchstart", event => { touchX = event.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", event => {
      const delta = event.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) < 40) return;
      if (delta > 0) prev.click(); else next.click();
    }, { passive: true });
  }

  function initRSVP() {
    const form = $("#rsvpForm");
    if (!form) return;

    form.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      const name = data.get("name");
      showToast(`Terima kasih, ${name}. RSVP kamu sudah tercatat di browser ini.`);
      form.reset();
    });
  }

  function initWishes() {
    const form = $("#wishesForm");
    if (!form) return;

    form.addEventListener("submit", event => {
      event.preventDefault();
      const name = new FormData(form).get("name");
      showToast(`Terima kasih, ${name}. Doa baikmu sudah kami terima.`);
      form.reset();
    });
  }

  function initGiftCopy() {
    const button = $("#copyGift");
    if (!button || !navigator.clipboard) return;

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("1234567890");
        showToast("Nomor rekening berhasil disalin.");
      } catch {
        showToast("Nomor rekening belum dapat disalin. Silakan salin manual.");
      }
    });
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3400);
  }

  function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = $(".cursor--dot");
    const ring = $(".cursor--ring");
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    document.body.classList.add("cursor-ready");

    window.addEventListener("mousemove", event => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    }, { passive: true });

    const animate = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      requestAnimationFrame(animate);
    };
    animate();

    $$("a, button, input, select, textarea").forEach(el => {
      el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  }

  function initMagnetic() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    $$(".magnetic").forEach(el => {
      el.addEventListener("mousemove", event => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${dx * .1}px, ${dy * .1}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  function initParticles() {
    const canvas = $("#particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let width = 0, height = 0, dpr = 1;
    let particles = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(70, Math.max(26, Math.floor(width / 22)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + .25,
        a: Math.random() * .45 + .12,
        vx: (Math.random() - .5) * .06,
        vy: -(Math.random() * .15 + .03)
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,217,193,${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    draw();
  }

  function initSwipeFallback() {
    // Gives mobile users a native-feeling close affordance for focusable dialogs.
    document.addEventListener("click", event => {
      const target = event.target.closest("[data-dismiss]");
      if (target) target.closest("[role=dialog]")?.remove();
    });
  }

  function init() {
    document.body.classList.add("is-locked");
    initOpening();
    initMusic();
    initCountdown();
    initReveal();
    initFrameAnimations();
    initParallax();
    initScrollIndex();
    initGallery();
    initRSVP();
    initWishes();
    initGiftCopy();
    initCursor();
    initMagnetic();
    initParticles();
    initSwipeFallback();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

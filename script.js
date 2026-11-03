/* ==========================================================
   Wedding Invitation · Interactions
   Edit CONFIG to personalise the invitation.
   ========================================================== */
(() => {
  "use strict";

  const CONFIG = {
    weddingDate: "2027-06-14T16:00:00+02:00", // ISO date with timezone
    whatsappNumber: "390000000000",           // Host WhatsApp number, country code, no "+"
    coupleNames: "Amelia & Daniel",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Opening screen ---------- */
  const intro = $("#intro");
  const openBtn = $("#open-btn");
  const closeIntro = () => {
    intro.classList.add("hide");
    document.body.classList.remove("locked");
    setTimeout(() => intro.remove(), 900);
    $("#hero").querySelectorAll(".reveal").forEach((el, i) => {
      setTimeout(() => el.classList.add("visible"), prefersReducedMotion ? 0 : i * 150);
    });
  };
  openBtn.addEventListener("click", closeIntro);
  openBtn.focus();
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && intro.isConnected && !intro.classList.contains("hide")) closeIntro();
  });

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const navToggle = $("#nav-toggle");
  const navLinks = $("#nav-links");

  const setMenu = (open) => {
    navLinks.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  };
  navToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  $$("a", navLinks).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 40), { passive: true });

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$(".reveal").filter((el) => !$("#hero").contains(el) || el.closest("#hero") === null);
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Countdown ---------- */
  const target = new Date(CONFIG.weddingDate).getTime();
  const els = {
    days: $("#cd-days"), hours: $("#cd-hours"), mins: $("#cd-mins"), secs: $("#cd-secs"),
  };
  const pad = (n) => String(n).padStart(2, "0");
  let lastSecs = null;

  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      $("#countdown").innerHTML = '<p class="script" style="font-size:2rem">Today is the day!</p>';
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    els.days.textContent = pad(d);
    els.hours.textContent = pad(h);
    els.mins.textContent = pad(m);
    els.secs.textContent = pad(s);
    if (s !== lastSecs && !prefersReducedMotion) {
      els.secs.parentElement.classList.remove("tick");
      void els.secs.parentElement.offsetWidth; // restart animation
      els.secs.parentElement.classList.add("tick");
    }
    lastSecs = s;
  };
  const timer = setInterval(tick, 1000);
  tick();

  /* ---------- Background music (user-controlled) ---------- */
  const music = $("#bg-music");
  const musicBtn = $("#music-btn");
  const musicLabel = $(".music-label", musicBtn);
  let musicAvailable = true;

  music.addEventListener("error", () => {
    musicAvailable = false;
    musicBtn.disabled = true;
    musicLabel.textContent = "No track";
    musicBtn.title = "Add assets/music.mp3 to enable music";
  });

  musicBtn.addEventListener("click", async () => {
    if (!musicAvailable) return;
    if (music.paused) {
      try {
        await music.play();
        musicBtn.classList.add("playing");
        musicBtn.setAttribute("aria-pressed", "true");
        musicBtn.setAttribute("aria-label", "Pause background music");
        musicLabel.textContent = "Music on";
      } catch {
        musicLabel.textContent = "Tap again";
      }
    } else {
      music.pause();
      musicBtn.classList.remove("playing");
      musicBtn.setAttribute("aria-pressed", "false");
      musicBtn.setAttribute("aria-label", "Play background music");
      musicLabel.textContent = "Music off";
    }
  });

  /* ---------- Gallery lightbox ---------- */
  const photos = $$(".gallery-item img");
  const lightbox = $("#lightbox");
  const lbImg = $("#lb-img");
  let current = 0;
  let lastFocus = null;

  const showPhoto = (i) => {
    current = (i + photos.length) % photos.length;
    lbImg.src = photos[current].src;
    lbImg.alt = photos[current].alt;
  };
  const openLightbox = (i) => {
    lastFocus = document.activeElement;
    showPhoto(i);
    lightbox.hidden = false;
    document.body.classList.add("locked");
    $(".lb-close", lightbox).focus();
  };
  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("locked");
    if (lastFocus) lastFocus.focus();
  };

  $$(".gallery-item").forEach((btn) => btn.addEventListener("click", () => openLightbox(Number(btn.dataset.index))));
  $(".lb-close", lightbox).addEventListener("click", closeLightbox);
  $(".lb-prev", lightbox).addEventListener("click", () => showPhoto(current - 1));
  $(".lb-next", lightbox).addEventListener("click", () => showPhoto(current + 1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPhoto(current - 1);
    if (e.key === "ArrowRight") showPhoto(current + 1);
  });

  // Simple swipe support on mobile
  let touchX = null;
  lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- RSVP ---------- */
  const form = $("#rsvp-form");
  const result = $("#rsvp-result");
  const resultText = $("#result-text");
  const waBtn = $("#wa-btn");
  const guestsField = $("#guests-field");
  let lastData = null;

  const setError = (name, msg) => {
    const input = form.elements[name];
    const err = $(`.error[data-for="${name}"]`, form);
    err.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  };

  const validate = (data) => {
    let valid = true;
    const rules = {
      name: [data.name.trim().length >= 2, "Please enter your full name."],
      email: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email), "Please enter a valid email."],
      phone: [/^\+?[0-9\s-]{8,20}$/.test(data.phone), "Include a valid number with country code."],
    };
    Object.entries(rules).forEach(([name, [ok, msg]]) => {
      setError(name, ok ? "" : msg);
      if (!ok) valid = false;
    });
    return valid;
  };

  const toggleGuests = () => {
    const attending = form.elements.attending.value === "yes";
    guestsField.style.display = attending ? "" : "none";
  };
  $$('input[name="attending"]', form).forEach((r) => r.addEventListener("change", toggleGuests));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (!validate(data)) {
      const firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }
    lastData = data;
    const yes = data.attending === "yes";
    resultText.textContent = yes
      ? `${data.name.split(" ")[0]}, we are delighted you will join us for ${data.guests} ${Number(data.guests) > 1 ? "guests" : "guest"}. A confirmation will be sent to ${data.email}.`
      : `${data.name.split(" ")[0]}, we are sorry you cannot make it. Thank you for letting us know.`;
    waBtn.href = buildWhatsAppUrl(data);
    form.hidden = true;
    result.hidden = false;
    result.focus();
  });

  $("#reset-btn").addEventListener("click", () => {
    result.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });

  function buildWhatsAppUrl(d) {
    const lines = [
      `RSVP for ${CONFIG.coupleNames}`,
      `Name: ${d.name}`,
      `Attending: ${d.attending === "yes" ? "Yes" : "No"}`,
      d.attending === "yes" ? `Guests: ${d.guests}` : null,
      d.diet ? `Dietary: ${d.diet}` : null,
      d.message ? `Message: ${d.message}` : null,
    ].filter(Boolean);
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  toggleGuests();
})();

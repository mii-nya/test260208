const btn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const floatLayer = document.querySelector(".float-layer");

function setOpen(open){
  if (!btn || !nav) return;
  nav.classList.toggle("is-open", open);
  btn.classList.toggle("is-open", open);
  btn.setAttribute("aria-expanded", String(open));
}

btn?.addEventListener("click", () => {
  const open = btn.getAttribute("aria-expanded") !== "true";
  setOpen(open);
});

// Close on link tap (mobile)
document.querySelectorAll(".nav__link").forEach(a => {
  a.addEventListener("click", () => setOpen(false));
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (!btn || !nav) return;
  const isOpen = btn.getAttribute("aria-expanded") === "true";
  if (!isOpen) return;
  const t = e.target;
  if (!btn.contains(t) && !nav.contains(t)) setOpen(false);
});

// Close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setOpen(false);
});

// Dummy contact form (only exists on index)
const form = document.getElementById("contactForm");
const note = document.querySelector(".form__note");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  note.textContent = "送信しました！（※ダミー）";
  form.reset();
});

// Footer year (exists on all pages)
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Floating music notes =====
const symbols = ["♪","♫","♬","𝄞","𝄢","♩","♭","♯"];
function rand(min, max){ return Math.random() * (max - min) + min; }

function addFloatNote(){
  if (!floatLayer) return;
  const el = document.createElement("div");
  el.className = "float-note";
  el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

  el.style.setProperty("--x", rand(0, 100) + "vw");
  el.style.setProperty("--y", rand(65, 110) + "vh");
  el.style.setProperty("--size", rand(14, 28) + "px");
  el.style.setProperty("--op", rand(0.18, 0.45).toFixed(2));
  const dur = rand(10, 18);
  el.style.setProperty("--dur", dur + "s");
  el.style.animationDelay = (-rand(0, dur)) + "s";

  floatLayer.appendChild(el);
  setTimeout(() => el.remove(), (dur + 2) * 1000);
}

const targetCount = 14;
for (let i=0; i<targetCount; i++) addFloatNote();

setInterval(() => {
  if (!floatLayer) return;
  const count = floatLayer.querySelectorAll(".float-note").length;
  if (count < targetCount) addFloatNote();
}, 900);


// ===== v5 Works modal =====
(function(){
  const modal = document.getElementById("worksModal");
  if (!modal) return;

  const panel = modal.querySelector(".works-modal__panel");
  const media = document.getElementById("modalMedia");
  const badge = document.getElementById("modalBadge");
  const muted = document.getElementById("modalMuted");
  const title = document.getElementById("modalTitle");
  const desc = document.getElementById("modalDesc");
  const points = document.getElementById("modalPoints");
  const actions = document.getElementById("modalActions");

  // v38 carousel
  const modalImg = document.getElementById("modalImg");
  const modalImgNext = document.getElementById("modalImgNext");
  const navPrev = modal.querySelector(".works-modal__nav--prev");
  const navNext = modal.querySelector(".works-modal__nav--next");
  const viewport = modal.querySelector(".works-modal__viewport");
  // v104: portrait fit mode (no blurred side background)
  const setPortraitState = () => {
    // Clear any legacy background-image that may have been set elsewhere
    try { if (viewport) viewport.style.backgroundImage = "none"; } catch(e) {}
    // Decide portrait/landscape based on current image natural size
    if (!modalImg) { modal.classList.remove("is-portrait"); return; }
    const w = modalImg.naturalWidth || 0;
    const h = modalImg.naturalHeight || 0;
    const isPortrait = (w > 0 && h > 0) ? (h / w > 1.12) : false; // a bit tolerant
    modal.classList.toggle("is-portrait", isPortrait);
  };


  // v102: self-hosted video (preview) support
  const modalVideoWrap = document.getElementById("modalVideoWrap");
  const modalVideo = document.getElementById("modalVideo");
  let clickUrl = "";

  function setVideo(src){
    if (!modalVideo || !modalVideoWrap) return;
    modalVideoWrap.hidden = false;
    // Ensure we replace any existing sources
    modalVideo.innerHTML = "";
    modalVideo.src = src || "";
    try { modalVideo.load(); } catch(e){}
    // Autoplay may still be blocked in some cases; muted helps.
    try { const p = modalVideo.play(); if (p && typeof p.catch === "function") p.catch(()=>{}); } catch(e){}
  }

  function clearVideo(){
    if (!modalVideo || !modalVideoWrap) return;
    try { modalVideo.pause(); } catch(e){}
    modalVideo.removeAttribute("src");
    modalVideo.innerHTML = "";
    try { modalVideo.load(); } catch(e){}
    modalVideoWrap.hidden = true;
  }

  // Click on viewport when video -> open external link
  if (viewport){

    // v109: mobile tap support for lightbox (some mobile browsers may not dispatch click reliably inside fixed modals)
    let __tapStartX = 0;
    let __tapStartY = 0;
    let __tapMoved = false;

    viewport.addEventListener("touchstart", (e) => {
      if (!e.touches || !e.touches[0]) return;
      __tapMoved = false;
      __tapStartX = e.touches[0].clientX;
      __tapStartY = e.touches[0].clientY;
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
      if (!e.touches || !e.touches[0]) return;
      const dx = Math.abs(e.touches[0].clientX - __tapStartX);
      const dy = Math.abs(e.touches[0].clientY - __tapStartY);
      if (dx > 8 || dy > 8) __tapMoved = true; // treat as scroll/swipe
    }, { passive: true });

    const __openLightboxFromViewport = () => {
      const modal = document.getElementById("worksModal");
      if (!modal || (!modal.classList.contains("is-open") && !document.body.classList.contains("modal-open"))) return;

      // video -> external link
      if (viewport.classList.contains("is-video")) {
        if (!clickUrl) return;
        window.open(clickUrl, "_blank", "noopener");
        return;
      }

      const api = window.__imgLightbox;
      const src = (modalImg && modalImg.getAttribute("src")) ? modalImg.getAttribute("src") : "";
      if (api && typeof api.open === "function" && src) api.open(src);
    };

    viewport.addEventListener("touchend", (e) => {
      if (__tapMoved) return;
      __openLightboxFromViewport();
    });
    viewport.addEventListener("click", (e) => {
      __openLightboxFromViewport();
    });
  }


  // v110: also bind click on image layers (some overlays may intercept the viewport click)
  if (modalImg){
    modalImg.addEventListener("click", (e) => { __openLightboxFromViewport(); });
  }
  if (modalImgNext){
    modalImgNext.addEventListener("click", (e) => { __openLightboxFromViewport(); });
  }


  let images = [];
  // v60: expose carousel state for lightbox
  window.__worksCarousel = window.__worksCarousel || {};
  window.__worksCarousel.getImages = () => images.slice();
  window.__worksCarousel.getIndex = () => imgIndex;
  window.__worksCarousel.setIndex = (i) => { imgIndex = i; renderImage(); };
  let imgIndex = 0;
  let animating = false;

  function normalizeList(s){
    return (s || "").split(",").map(x=>x.trim()).filter(Boolean);
  }
  function updateNav(){
    const many = images.length > 1;
    if (navPrev) navPrev.disabled = !many;
    if (navNext) navNext.disabled = !many;
  }
  function renderImage(){
    if (!modalImg) return;
    modalImg.onload = () => { try{ setPortraitState(); }catch(e){} };
    modalImg.src = images[imgIndex] || "";
    if (modalImgNext) modalImgNext.src = "";
    updateNav();
  }
  function slideTo(nextIndex, dir){
    if (!viewport || !modalImg || !modalImgNext) { imgIndex = nextIndex; renderImage(); return; }
    if (animating) return;
    if (images.length === 0) return;
    if (nextIndex < 0) nextIndex = images.length - 1;
    if (nextIndex >= images.length) nextIndex = 0;
    if (nextIndex === imgIndex) return;

    animating = true;
    viewport.classList.add("is-sliding");

    modalImgNext.src = images[nextIndex];

    // update portrait state after next image preloads
    modalImgNext.onload = () => { try{ setPortraitState(); }catch(e){} };

    const nextStart = (dir === "next") ? 100 : -100;
    const outTo = (dir === "next") ? -18 : 18;

    modalImg.style.transform = "translateX(0%)";
    modalImg.style.opacity = "1";
    modalImgNext.style.transform = `translateX(${nextStart}%)`;
    modalImgNext.style.opacity = "1";

    void modalImgNext.offsetWidth;

    modalImg.style.transform = `translateX(${outTo}%)`;
    modalImg.style.opacity = "0";
    modalImgNext.style.transform = "translateX(0%)";
    modalImgNext.style.opacity = "1";

    window.setTimeout(() => {
      imgIndex = nextIndex;
      modalImg.src = images[imgIndex] || "";
      modalImg.style.transform = "";
      modalImg.style.opacity = "";
      modalImgNext.style.transform = "translateX(100%)";
      modalImgNext.style.opacity = "0";
      viewport.classList.remove("is-sliding");
      updateNav();
      animating = false;
    }, 290);
  }

  if (navPrev) navPrev.addEventListener("click", () => slideTo(imgIndex - 1, "prev"));
  if (navNext) navNext.addEventListener("click", () => slideTo(imgIndex + 1, "next"));

  function openFrom(card){
    const data = card.dataset;
    badge.textContent = data.badge || "Work";
    if (muted) muted.textContent = data.muted || "";
    title.textContent = data.title || "";
    desc.textContent = data.desc || "";

    // v102: if card has self-hosted preview video, show it instead of image carousel
    const videoSrc = data.video || "";
    clickUrl = (data.url || "").trim();
    if (videoSrc){
      // Hide carousel images + nav
      if (modalImg) modalImg.style.display = "none";
      if (modalImgNext) modalImgNext.style.display = "none";
      if (navPrev) navPrev.style.display = "none";
      if (navNext) navNext.style.display = "none";
      if (viewport) viewport.classList.add("is-video");
      modal.classList.remove("is-portrait");
      // Stop any lightbox usage by clearing images
      images = [];
      imgIndex = 0;
      updateNav();
      setVideo(videoSrc);
    } else {
      // Restore image mode
      clearVideo();
      if (modalImg) modalImg.style.display = "";
      if (modalImgNext) modalImgNext.style.display = "";
      if (navPrev) navPrev.style.display = "";
      if (navNext) navNext.style.display = "";
      if (viewport) viewport.classList.remove("is-video");
    }

    // v38: set carousel images (skip when video preview)
    if (!videoSrc){
      images = normalizeList(data.images);
      if (images.length === 0 && data.img) images = [data.img];
      imgIndex = 0;
      renderImage();
    }

    points.innerHTML = "";
    const list = (data.points || "").split(" | ").filter(Boolean);
    for (const p of list){
      const li = document.createElement("li");
      li.textContent = p;
      points.appendChild(li);
    }

    actions.innerHTML = "";
    if (data.url && data.url.trim()){
      const a = document.createElement("a");
      a.href = data.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = "リンクを見る";
      actions.appendChild(a);
    }

    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => panel?.focus?.(), 0);
  }

  function close(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.body.classList.remove("modal-open")
    // v38 reset carousel
    images = [];
    imgIndex = 0;
    if (modalImgNext) modalImgNext.src = "";
    updateNav();;
  }

  document.querySelectorAll(".work-card").forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      openFrom(card);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFrom(card);
      }
    });
  });

  modal.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", () => close());
  });

  
  const closeBtn = document.getElementById("worksModalClose");
  if (closeBtn){
    closeBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); close(); });
  }
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
})();

// ===== v57 Image lightbox for Works modal =====
(function(){
  const box = document.getElementById("imgLightbox");
  if (!box) return;

  const backdrop = box.querySelector(".img-lightbox__backdrop");
  const viewport = box.querySelector(".img-lightbox__viewport");
  const img = document.getElementById("imgLightboxImg");
  const imgNext = document.getElementById("imgLightboxImgNext");
  const prevBtn = box.querySelector(".img-lightbox__nav--prev");
  const nextBtn = box.querySelector(".img-lightbox__nav--next");

  let images = [];
  let index = 0;
  let animating = false;

  function updateNav(){
    const many = images.length > 1;
    if (prevBtn) prevBtn.disabled = !many;
    if (nextBtn) nextBtn.disabled = !many;
  }

  function render(){
    if (!img) return;
    img.src = images[index] || "";
    if (imgNext) imgNext.src = "";
    updateNav();
  }

  function slideTo(nextIndex, dir){
    if (!viewport || !img || !imgNext){ index = nextIndex; render(); return; }
    if (animating) return;
    if (images.length === 0) return;
    if (nextIndex < 0) nextIndex = images.length - 1;
    if (nextIndex >= images.length) nextIndex = 0;
    if (nextIndex === index) return;

    animating = true;
    viewport.classList.add("is-sliding");
    imgNext.src = images[nextIndex];

    const nextStart = (dir === "next") ? 100 : -100;
    const outTo = (dir === "next") ? -18 : 18;

    img.style.transform = "translateX(0%)";
    img.style.opacity = "1";
    imgNext.style.transform = `translateX(${nextStart}%)`;
    imgNext.style.opacity = "1";

    void imgNext.offsetWidth;

    img.style.transform = `translateX(${outTo}%)`;
    img.style.opacity = "0";
    imgNext.style.transform = "translateX(0%)";
    imgNext.style.opacity = "1";

    window.setTimeout(() => {
      index = nextIndex;
      img.src = images[index] || "";
      img.style.transform = "";
      img.style.opacity = "";
      imgNext.style.transform = "translateX(100%)";
      imgNext.style.opacity = "0";
      viewport.classList.remove("is-sliding");
      updateNav();
      animating = false;
    }, 290);
  }

  function openAt(i){
    // pull current carousel state from Works modal (if present)
    const c = window.__worksCarousel;
    const list = (c && typeof c.getImages === "function") ? c.getImages() : [];
    images = Array.isArray(list) ? list : [];
    if (!images.length) return;

    index = Math.max(0, Math.min(images.length - 1, i || 0));
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    render();
    setTimeout(() => viewport?.focus?.(), 0);
  }

  function close(){
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    images = [];
    index = 0;
    if (img) img.src = "";
    if (imgNext) imgNext.src = "";
  }

  // Trigger: click on the image inside Works modal
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (!t.matches("#modalImg")) return;
    const c = window.__worksCarousel;
    const i = (c && typeof c.getIndex === "function") ? c.getIndex() : 0;
    openAt(i);
  });

  // Close triggers
  backdrop?.addEventListener("click", close);
  box.addEventListener("click", (e) => {
    // click outside image -> close
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t === backdrop) return; // already handled
    if (t.closest(".img-lightbox__nav")) return;
    if (t.closest(".img-lightbox__viewport")) return;
    close();
  });

  prevBtn?.addEventListener("click", () => slideTo(index - 1, "prev"));
  nextBtn?.addEventListener("click", () => slideTo(index + 1, "next"));

  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") slideTo(index - 1, "prev");
    if (e.key === "ArrowRight") slideTo(index + 1, "next");
  });
})();

// ===== v9 Butterfly cursor (swallowtail-like) =====
(function(){
  const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (isCoarse) return;

  const b = document.createElement("div");
  b.className = "bfly";
  b.innerHTML = `
    <svg class="bfly__svg" viewBox="0 0 120 120" aria-hidden="true">
      <g fill="rgba(230,199,122,.10)" stroke="rgba(230,199,122,.95)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        <!-- body -->
        <path d="M58 50 C60 44, 62 44, 64 50 C66 56, 66 64, 62 74 C58 64, 56 56, 58 50 Z" fill="rgba(230,199,122,.18)"/>
        <path d="M60 42 C54 34, 52 28, 60 24 C68 28, 66 34, 60 42 Z" fill="rgba(230,199,122,.14)"/>
        <path d="M56 22 C54 16, 48 14, 44 18" fill="none"/>
        <path d="M64 22 C66 16, 72 14, 76 18" fill="none"/>

        <!-- left wing (swallowtail-ish) -->
        <g class="bfly__wingL">
          <path d="M60 52
                   C46 34, 26 24, 14 34
                   C10 56, 24 74, 44 72
                   C52 72, 56 66, 60 60 Z"/>
          <path d="M44 72
                   C30 78, 24 92, 30 104
                   C40 112, 52 104, 52 90
                   C52 82, 48 76, 44 72 Z"/>
          <path d="M38 98 C30 112, 24 116, 20 118" fill="none"/>
        </g>

        <!-- right wing -->
        <g class="bfly__wingR">
          <path d="M60 52
                   C74 34, 94 24, 106 34
                   C110 56, 96 74, 76 72
                   C68 72, 64 66, 60 60 Z"/>
          <path d="M76 72
                   C90 78, 96 92, 90 104
                   C80 112, 68 104, 68 90
                   C68 82, 72 76, 76 72 Z"/>
          <path d="M82 98 C90 112, 96 116, 100 118" fill="none"/>
        </g>

        <!-- inner cutouts -->
        <path d="M60 58 C50 46, 36 40, 26 46 C22 58, 32 66, 44 64 C50 64, 56 62, 60 58 Z" fill="rgba(15,26,43,.55)" stroke="rgba(230,199,122,.55)"/>
        <path d="M60 58 C70 46, 84 40, 94 46 C98 58, 88 66, 76 64 C70 64, 64 62, 60 58 Z" fill="rgba(15,26,43,.55)" stroke="rgba(230,199,122,.55)"/>
      </g>
    </svg>
  `;
  document.body.appendChild(b);

  let x = window.innerWidth * 0.5;
  let y = window.innerHeight * 0.5;
  let tx = x, ty = y;
  let lastSpark = 0;

  function spark(){
    const s = document.createElement("i");
    s.className = "bfly__spark";
    s.style.left = (x + (Math.random()*18-9)) + "px";
    s.style.top  = (y + (Math.random()*18-9)) + "px";
    s.style.transform = `rotate(${Math.random()*360}deg)`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    const now = performance.now();
    // increase glitter frequency a bit
    if (now - lastSpark > 18){
      lastSpark = now;
      spark();
      if (Math.random() < 0.45) spark();
    }
  }, {passive:true});

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function tick(){
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    b.style.left = x + "px";
    b.style.top = y + "px";

    // keep head from pointing downward: limit angle around horizontal
    const dx = tx - x;
    const dy = ty - y;
    const ang = clamp(Math.atan2(dy, dx) * 180 / Math.PI, -18, 18);
    b.style.transform = `translate(-50%, -50%) rotate(${ang}deg)`;

    requestAnimationFrame(tick);
  }
  tick();
})();


// ===== Teacup meter (raster swap) =====
(function(){
  const meters = document.querySelectorAll(".teacup-meter");
  if (!meters.length) return;

  // preload images (prevents "pop" on first reveal)
  const srcs = new Set();
  meters.forEach(m => {
    m.querySelectorAll("img").forEach(img => srcs.add(img.getAttribute("src")));
  });
  srcs.forEach(src => { const im = new Image(); im.src = src; });

  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      const el = e.target;
      if (e.isIntersecting){
        if (el.classList.contains("is-visible")) continue;
        // delay a tick so transitions reliably apply
        requestAnimationFrame(() => setTimeout(() => el.classList.add("is-visible"), 60));
      } else {
        el.classList.remove("is-visible"); // demo: replay on re-scroll
      }
    }
  }, {
    threshold: 0,
    rootMargin: "0px 0px -15% 0px",
  });

  meters.forEach(m => io.observe(m));
})();


// ===== Back to top button =====
(function(){
  function init(){
    const btn = document.getElementById("toTopBtn");
    if (!btn) return;

    function onScroll(){
      const showAfter = window.innerHeight * 0.9; // show after ~1 screen
      const y = window.scrollY || window.pageYOffset;
      btn.classList.toggle("is-show", y > showAfter);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();


// ===== About background swap (fixed v85) =====
(function(){
  const bg = document.querySelector(".about-bg");
  if (!bg) return;

  const layerA = bg.querySelector(".about-bg__layer--a");
  const layerB = bg.querySelector(".about-bg__layer--b");
  let useA = true;
  let current = "";

  const clearBg = () => {
    current = "";
    if (layerA) layerA.classList.remove("is-on");
    if (layerB) layerB.classList.remove("is-on");
  };

  const setBg = (url) => {
    if (!url || url === current) return;
    current = url;

    const show = useA ? layerA : layerB;
    const hide = useA ? layerB : layerA;
    if (show) show.style.backgroundImage = `url('${url}')`;
    if (show) show.classList.add("is-on");
    if (hide) hide.classList.remove("is-on");
    useA = !useA;
  };

  const targets = [...document.querySelectorAll(".about-timeline__card, .about-long__p[data-bg]")];
  if (!targets.length) return;

  // Initial state: background hidden. It will appear when the first card becomes visible.
  clearBg();

  // Track visible targets; when none are visible (scrolled above the first card), clear background.
  const visible = new Map(); // target -> intersectionRatio

  const pickBest = () => {
    if (visible.size === 0) {
      clearBg();
      return;
    }
    let best = null;
    let bestRatio = -1;
    visible.forEach((ratio, t) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = t;
      }
    });
    if (!best) return;
    const host = best.closest(".about-timeline__item") || best;
    setBg(host.getAttribute("data-bg"));
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.set(e.target, e.intersectionRatio || 0);
      else visible.delete(e.target);
    });
    pickBest();
  }, { threshold: [0, 0.15, 0.3, 0.5, 0.75], rootMargin: "0px 0px -15% 0px" });

  targets.forEach(t => io.observe(t));
})();



/* Works filter (detail page) */
(function(){
  const filterBar = document.querySelector('.works-filter');
  if(!filterBar) return;

  const buttons = Array.from(filterBar.querySelectorAll('[data-filter]'));
  const cards = Array.from(document.querySelectorAll('.work-card[data-category]'));
  let active = 'all';

  const setActiveBtn = (val) => {
	  buttons.forEach(b => {
	    const isOn = b.dataset.filter === val;
	    b.classList.toggle('is-active', isOn);
	    // keep pressed state in sync (for accessibility)
	    b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
	  });
  };

  const apply = (val) => {
    active = val;
    setActiveBtn(val);

    cards.forEach(card => {
      const match = (val === 'all') || (card.dataset.category === val);
      if(match){
        // show
        if(card.hasAttribute('hidden')){
          card.removeAttribute('hidden');
          // allow layout, then animate in
          requestAnimationFrame(() => {
            card.classList.remove('is-filtering-out');
          });
        }else{
          card.classList.remove('is-filtering-out');
        }
      }else{
        // hide with fade then remove
        card.classList.add('is-filtering-out');
        window.setTimeout(() => {
          if(active !== val) return; // cancelled
          card.setAttribute('hidden','');
        }, 350);
      }
    });
  };

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if(!btn) return;
    const val = btn.dataset.filter;
    if(val === active) return;
    apply(val);
  });

  // initial
  apply('all');
})();


/* ===== Scroll-to-top button (show/hide by scroll position) ===== */
(() => {
  // Some pages place the button after the <script> tag, so initialize after DOM is ready.
  const init = () => {
    const btn = document.querySelector('.to-top');
    if (!btn) return;

    // Single threshold only (no hide near footer)
    const showAfter = () => 420; // px

    const getScrollY = () => {
      return (
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      );
    };

    const update = () => {
      const y = getScrollY();
      if (y > showAfter()) btn.classList.add('is-show');
      else btn.classList.remove('is-show');
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();



/* v40 deep link open: open modal for a specific work from query string */
/* v41 blur focus: prevent focus highlight after auto-open */
(function(){
  if (!/works\.html(?:\?|$)/.test(location.pathname)) return;
  const params = new URLSearchParams(location.search);
  const openId = params.get("open");
  if (!openId) return;

  // Wait a tick to ensure existing listeners are ready
  window.requestAnimationFrame(() => {
    const card = document.querySelector(`.work-card[data-id="${CSS.escape(openId)}"]`);
    if (!card) return;

    // Scroll to the card (nice for context) then trigger existing click handler
    card.scrollIntoView({ block: "center", behavior: "instant" });
    card.click();
    // v41 blur focus: prevent focus glow after programmatic open
    try{ card.blur(); }catch(e){}
    try{ if(document.activeElement) document.activeElement.blur(); }catch(e){}

    // Clean URL (optional) – keep works.html without param so refresh doesn't always reopen
    try {
      const clean = location.pathname + location.hash;
      history.replaceState(null, "", clean);
    } catch(e) {}
  });
})();


/* v43 About timeline: dot glow + alternating reveal */
(function(){
  const root = document.getElementById("aboutTimeline");
  if(!root) return;

  document.documentElement.classList.add("js-enabled");

  const items = Array.from(root.querySelectorAll(".about-timeline__item"));
  const cards = items.map(it => it.querySelector(".about-timeline__card")).filter(Boolean);

  if(items.length === 0) return;

  // Reveal cards as they enter
  if(!("IntersectionObserver" in window)){
    items.forEach(it => it.classList.add("is-visible"));
    items[0].classList.add("is-active");
    return;
  }

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) e.target.classList.add("is-visible");
    });
  }, { threshold: 0, rootMargin: "0px 0px -15% 0px" });

  cards.forEach(card => revealIO.observe(card));

  // Set the active dot (closest section)
  let active = null;
  const activeIO = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    if(visible.length === 0) return;

    visible.sort((a,b) => b.intersectionRatio - a.intersectionRatio);
    const next = visible[0].target.closest(".about-timeline__item");

    if(active === next) return;
    if(active) active.classList.remove("is-active");
    active = next;
    active.classList.add("is-active");
  }, { threshold: 0, rootMargin: "0px 0px -15% 0px" });

  cards.forEach(card => activeIO.observe(card));
})();

/* v45: sync dot vertical position to card center */
(function(){
  const items = document.querySelectorAll('.about-timeline__item');
  const update = () => {
    items.forEach(item => {
      const card = item.querySelector('.about-timeline__card');
      const dot = item.querySelector('.about-timeline__dot');
      if(!card || !dot) return;
      const cardRect = card.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const centerY = cardRect.top + cardRect.height / 2;
      const offset = centerY - itemRect.top;
      dot.style.top = offset + 'px';
    });
  };
  window.addEventListener('load', update);
  window.addEventListener('resize', update);
})();



/* v60: works modal image lightbox + carousel */
(function(){
  const lb = document.getElementById("imgLightbox");
  const lbImg = document.getElementById("imgLightboxImg");
  const lbImgNext = document.getElementById("imgLightboxImgNext");
  const viewport = document.querySelector(".img-lightbox__viewport");
  const btnPrev = document.querySelector(".img-lightbox__nav--prev");
  const btnNext = document.querySelector(".img-lightbox__nav--next");
  if(!lb || !lbImg) return;

  let imgs = [];
  let idx = 0;

  const syncFromModal = () => {
    const api = window.__worksCarousel;
    imgs = (api && typeof api.getImages === "function") ? api.getImages() : [];
    idx = (api && typeof api.getIndex === "function") ? api.getIndex() : 0;
    if (idx < 0) idx = 0;
    if (idx >= imgs.length) idx = 0;
  };

  const render = () => {
    lbImg.src = imgs[idx] || lbImg.src || "";
  };

  const open = (src) => {
    syncFromModal();
    // if src is provided and exists in list, align index
    if(src && imgs.length){
      const found = imgs.indexOf(src);
      if(found >= 0) idx = found;
    }else if(src){
      // fallback: single image
      imgs = [src];
      idx = 0;
    }
    render();
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden","false");
    document.body.classList.add("lightbox-open");
    if(btnPrev) btnPrev.style.display = (imgs.length > 1) ? "" : "none";
    if(btnNext) btnNext.style.display = (imgs.length > 1) ? "" : "none";
  };

  
  // v105: expose lightbox open for other modules
  window.__imgLightbox = window.__imgLightbox || {};
  window.__imgLightbox.open = open;
const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden","true");
    document.body.classList.remove("lightbox-open");
    lbImg.src = "";
    if(lbImgNext) lbImgNext.src = "";
  };

  // v105: expose lightbox close for other modules
  window.__imgLightbox.close = close;


  const step = (dir) => {
    if(!imgs.length) return;
    const nextIndex = (idx + dir + imgs.length) % imgs.length;

    if(!lbImgNext || !viewport){
      idx = nextIndex;
      render();
      return;
    }

    viewport.classList.add("is-sliding");
    const dirName = (dir > 0) ? "next" : "prev";
    lbImgNext.src = imgs[nextIndex];

    const nextStart = (dirName === "next") ? 100 : -100;
    const outTo = (dirName === "next") ? -18 : 18;

    lbImg.style.transform = "translateX(0%)";
    lbImg.style.opacity = "1";
    lbImgNext.style.transform = `translateX(${nextStart}%)`;
    lbImgNext.style.opacity = "1";

    void lbImgNext.offsetWidth;

    lbImg.style.transform = `translateX(${outTo}%)`;
    lbImg.style.opacity = "0";
    lbImgNext.style.transform = "translateX(0%)";
    lbImgNext.style.opacity = "1";

    window.setTimeout(() => {
      idx = nextIndex;
      lbImg.src = imgs[idx] || "";
      lbImg.style.transform = "";
      lbImg.style.opacity = "";
      lbImgNext.style.transform = "translateX(100%)";
      lbImgNext.style.opacity = "0";
      viewport.classList.remove("is-sliding");
    }, 290);
  };

  if(btnPrev) btnPrev.addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
  if(btnNext) btnNext.addEventListener("click", (e) => { e.stopPropagation(); step(1); });

  lb.addEventListener("click", (e) => {
    if(e.target === lb || e.target.classList.contains("img-lightbox__backdrop")){
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if(!lb.classList.contains("is-open")) return;
    if(e.key === "Escape") close();
    if(e.key === "ArrowLeft") step(-1);
    if(e.key === "ArrowRight") step(1);
  });

  // Click on modal images to open
  const bind = (imgEl) => {
    if(!imgEl) return;
    imgEl.style.cursor = "zoom-in";
    imgEl.addEventListener("click", (e) => {
      const modal = document.getElementById("worksModal");
      if(!modal || !modal.classList.contains("is-open")) return;
      const src = imgEl.getAttribute("src");
      open(src);
      e.preventDefault();
      e.stopPropagation();
    });
  };
  bind(document.getElementById("modalImg"));
  bind(document.getElementById("modalImgNext"));

  // Fallback delegation
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".works-modal__viewport img");
    if(!img) return;
    const modal = document.getElementById("worksModal");
    if(!modal || !modal.classList.contains("is-open")) return;
    open(img.getAttribute("src"));
  });
})();


/* v72: set about timeline line start to the first dot and keep in sync */
(function(){
  /* v73 disable line-top helper: line start stays fixed */
  return;
  const timeline = document.querySelector('.about-timeline');
  if(!timeline) return;

  const update = () => {
    const firstItem = timeline.querySelector('.about-timeline__item');
    const dot = firstItem ? firstItem.querySelector('.about-timeline__dot') : null;
    if(!firstItem || !dot) return;

    // Prefer the inline top set by existing dot-sync logic
    let topPx = parseFloat((dot.style.top || "").replace("px",""));
    if(!isFinite(topPx)){
      const card = firstItem.querySelector('.about-timeline__card');
      if(card){
        const cardRect = card.getBoundingClientRect();
        const tlRect = timeline.getBoundingClientRect();
        topPx = (cardRect.top + cardRect.height/2) - tlRect.top;
      }else{
        const dotRect = dot.getBoundingClientRect();
        const tlRect = timeline.getBoundingClientRect();
        topPx = (dotRect.top + dotRect.height/2) - tlRect.top;
      }
    }
    timeline.style.setProperty('--line-top', `${topPx}px`);
  };

  window.addEventListener('load', () => requestAnimationFrame(update));
  window.addEventListener('resize', () => requestAnimationFrame(update));
})();



/* v74: set timeline line start to first dot (no line above the first dot) */
(function(){
  const timeline = document.querySelector('.about-timeline');
  if(!timeline) return;

  const update = () => {
    const firstItem = timeline.querySelector('.about-timeline__item');
    const dot = firstItem ? firstItem.querySelector('.about-timeline__dot') : null;
    if(!dot) return;

    // dot may be absolutely positioned with inline top set by v45 logic; use it if available
    let topPx = parseFloat((dot.style.top || "").replace("px",""));
    if(!isFinite(topPx)){
      const dotRect = dot.getBoundingClientRect();
      const tlRect = timeline.getBoundingClientRect();
      topPx = (dotRect.top + dotRect.height/2) - tlRect.top;
    }
    timeline.style.setProperty('--line-top', `${topPx}px`);
  };

  window.addEventListener('load', () => requestAnimationFrame(update));
  window.addEventListener('resize', () => requestAnimationFrame(update));
})();



/* v75: recompute timeline dot positions to card centers, and start line at top of first dot (no bleed) */
(function(){
  const timeline = document.querySelector('.about-timeline');
  if(!timeline) return;

  const compute = () => {
    const items = Array.from(timeline.querySelectorAll('.about-timeline__item'));
    if(!items.length) return;

    items.forEach(item => {
      const card = item.querySelector('.about-timeline__card');
      const dot = item.querySelector('.about-timeline__dot');
      if(!card || !dot) return;

      const cardRect = card.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const centerY = cardRect.top + cardRect.height / 2;
      const offset = centerY - itemRect.top;

      dot.style.top = offset + 'px';
    });

    // line start: just below the first dot's top edge (so no line above the dot)
    const firstDot = items[0].querySelector('.about-timeline__dot');
    if(firstDot){
      const dotTop = parseFloat((firstDot.style.top || '0').replace('px','')) || 0;
      const r = firstDot.getBoundingClientRect().height / 2;
      timeline.style.setProperty('--line-top', `${dotTop + r}px`);
    }
  };

  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(compute));
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  // run once in case already loaded
  schedule();
})();




/* v86: sync timeline line to first/last dot so it doesn't extend past ends */
(function(){
  const timeline = document.querySelector('.about-timeline');
  if(!timeline) return;

  const update = () => {
    const dots = Array.from(timeline.querySelectorAll('.about-timeline__dot'));
    if(dots.length === 0) return;
    const tlRect = timeline.getBoundingClientRect();

    const firstRect = dots[0].getBoundingClientRect();
    const lastRect = dots[dots.length - 1].getBoundingClientRect();

    const firstCenter = (firstRect.top + firstRect.height/2) - tlRect.top;
    const lastCenter = (lastRect.top + lastRect.height/2) - tlRect.top;

    timeline.style.setProperty('--line-top', `${firstCenter}px`);
    timeline.style.setProperty('--line-bottom', `${lastCenter}px`);
  };

  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(update));
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  schedule();
})();



// ===== Teacup pour animation (Skill - 60% demo) =====
(() => {
  const meters = Array.from(document.querySelectorAll(".teacup-meter--pour"));
  if (!meters.length) return;

  // Tunables (matching the smooth demo)
  const STEP_MS = 440;
  const OVERLAP_MS = 240;

  // Base image (cup01) is always visible.
  // frames[] starts at cup02, so:
  // cup05 == frames index 3, cup08 == frames index 6.
  const HOLD_FINAL_FROM_INDEX = 3;
  const FINAL_FRAME_INDEX = 6;

  meters.forEach((meter) => {
    const imgs = Array.from(meter.querySelectorAll("img"));
    if (!imgs.length) return;

    // base (cup01) should always be visible
    const base = imgs.find((img) => img.classList.contains("tea-base")) || imgs[0];
    const frames = imgs.filter((img) => img !== base);

    // initial state
    base.style.opacity = "1";
    frames.forEach((img) => (img.style.opacity = "0"));

    let started = false;
    let token = 0; // cancels an in-progress run when incremented
    let timers = [];

    const clearTimers = () => {
      timers.forEach((id) => clearTimeout(id));
      timers = [];
    };

    const reset = () => {
      started = false;
      token++;
      clearTimers();
      frames.forEach((img) => (img.style.opacity = "0"));
    };

    const run = () => {
      if (started) return;
      started = true;

      const myToken = ++token;

      const showAt = (idx) => {
        if (myToken !== token) return; // canceled/reset
        if (idx >= frames.length) return;

        // Once we reach cup05 (frames index 3), show cup08 and keep it.
        if (idx >= HOLD_FINAL_FROM_INDEX) {
          const finalImg = frames[FINAL_FRAME_INDEX] || frames[frames.length - 1];
          frames.forEach((img) => (img.style.opacity = "0"));
          if (finalImg) finalImg.style.opacity = "1";
          return;
        }

        const prev = idx > 0 ? frames[idx - 1] : null;
        const cur = frames[idx];

        // Fade current in
        cur.style.opacity = "1";

        // Fade previous out after overlap
        if (prev) {
          timers.push(
            setTimeout(() => {
              if (myToken !== token) return;
              prev.style.opacity = "0";
            }, OVERLAP_MS)
          );
        }

        // Next step
        timers.push(
          setTimeout(() => {
            showAt(idx + 1);
          }, STEP_MS)
        );
      };

      showAt(0);
    };

    // Replayable trigger: start on enter, reset on leave
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
          } else {
            reset();
          }
        });
      },
      { threshold: 0.35 }
    );

    io.observe(meter);
  });
})();







/* Contact form: mailto with confirm (mobile/desktop) — v112c */
(function(){
  const form = document.getElementById("contactForm");
  if(!form) return;

  const sendBtn = document.getElementById("contactSendBtn");
  const statusEl = form.querySelector(".form__note");
  const nameEl = form.querySelector('input[type="text"]');
  const emailEl = form.querySelector('input[type="email"]');
  const msgEl = form.querySelector("textarea");

  // Prefer the mailto link already present in the page (so you can change recipient in HTML)
  const mailtoLink = document.querySelector('a[href^="mailto:"]');
  const recipient = mailtoLink ? mailtoLink.getAttribute("href").replace(/^mailto:/, "") : "";

  const buildMailto = () => {
    const name = (nameEl?.value || "").trim();
    const email = (emailEl?.value || "").trim();
    const msg = (msgEl?.value || "").trim();

    const subject = `【ポートフォリオ】お問い合わせ：${name || "（お名前なし）"}`;
    const bodyLines = [
      "以下の内容でお問い合わせが届いています。",
      "",
      `お名前：${name || "（未入力）"}`,
      `メール：${email || "（未入力）"}`,
      "",
      "メッセージ：",
      msg || "（未入力）",
      "",
      "—",
      "（このメールはポートフォリオサイトのお問い合わせフォームから作成されました）"
    ];
    const body = bodyLines.join("\n");

    const to = recipient || "mail@example.com";
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const trySend = () => {
    // Native validation first (DON'T reset the form!)
    if(typeof form.reportValidity === "function" && !form.reportValidity()){
      return;
    }

    const ok = window.confirm("メールを送信しますか？");
    if(!ok){
      if(statusEl) statusEl.textContent = "送信をキャンセルしました。";
      return;
    }

    const href = buildMailto();

    // Trigger mail client
    window.location.href = href;

    if(statusEl) statusEl.textContent = "メールアプリを開きました。送信を完了してください。";
  };

  // Block any other submit handlers that may exist (capture phase)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    trySend();
  }, true);

  // Primary button click (no native submit)
  if(sendBtn){
    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      trySend();
    }, true);
  }
})();



/* v113: mobile to-top avoids footer overlap (stop above footer) */
(function(){
  const btn = document.querySelector('.to-top');
  const footer = document.querySelector('footer.footer, .footer, footer');
  if(!btn || !footer) return;

  const mqMobile = window.matchMedia('(max-width: 600px)');
  const mqCoarse = window.matchMedia('(pointer: coarse)');
  const isMobile = () => (mqMobile.matches || mqCoarse.matches);

  const px = (v) => {
    const n = parseFloat(String(v || '').replace('px',''));
    return Number.isFinite(n) ? n : 0;
  };

  const getVarPx = (name, fallback) => {
    const cs = getComputedStyle(document.documentElement);
    const val = cs.getPropertyValue(name).trim();
    if(!val) return fallback;
    if(val.endsWith('px')) return px(val);
    // allow rem
    if(val.endsWith('rem')){
      const rem = parseFloat(val);
      const base = px(getComputedStyle(document.documentElement).fontSize) || 16;
      return rem * base;
    }
    return px(val) || fallback;
  };

  const update = () => {
    if(!isMobile()){
      btn.style.bottom = '';
      return;
    }

    const safeBottom = getVarPx('--floating-safe-bottom', 18);
    const gap = getVarPx('--floating-footer-gap', 12);

    const rect = footer.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // distance from viewport bottom to footer top
    const footerVisibleHeight = Math.max(0, vh - rect.top);
    // When footer is visible, push the button up so it stays above footer + gap
    const desiredBottom = Math.max(safeBottom, footerVisibleHeight + gap);

    btn.style.bottom = desiredBottom + 'px';
  };

  const rafUpdate = () => requestAnimationFrame(update);

  window.addEventListener('scroll', rafUpdate, { passive: true });
  window.addEventListener('resize', rafUpdate);

  // React to media query change
  if(mqMobile.addEventListener){
    mqMobile.addEventListener('change', rafUpdate);
    mqCoarse.addEventListener('change', rafUpdate);
  }else{
    mqMobile.addListener(rafUpdate);
    mqCoarse.addListener(rafUpdate);
  }

  // initial
  rafUpdate();
})();

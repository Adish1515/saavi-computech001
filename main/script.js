const WHATSAPP_NUMBER = "919529940087";
const MENU_MS = 240;
const PAGE_MS = 320;
const TRANSITION_KEY = "ue-page-transition";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("js");

function pageFile(pathname) {
  const parts = pathname.replace(/\\/g, "/").split("/");
  return (parts.pop() || "index.html").toLowerCase() || "index.html";
}

function isInternalPageLink(anchor) {
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("tel:") || raw.startsWith("mailto:") || raw.startsWith("javascript:")) {
    return false;
  }
  if (/^https?:\/\//i.test(raw) && !raw.includes(location.host) && location.protocol !== "file:") {
    return false;
  }

  try {
    const url = new URL(anchor.href, location.href);
    if (url.protocol !== location.protocol && location.protocol !== "file:") return false;
    const current = pageFile(location.pathname);
    const next = pageFile(url.pathname);
    if (next === current) return false;
    return /\.html?$/i.test(next) || next === "index.html";
  } catch {
    return false;
  }
}

function finishPageEnter() {
  document.documentElement.classList.add("is-page-ready");
  document.documentElement.classList.remove("is-page-entering");
}

function setupPageTransitions() {
  if (reduceMotion) {
    document.documentElement.classList.add("is-page-ready");
    return;
  }

  const arriving = sessionStorage.getItem(TRANSITION_KEY) === "1";
  if (arriving) sessionStorage.removeItem(TRANSITION_KEY);

  document.documentElement.classList.add("is-page-entering");
  requestAnimationFrame(() => {
    requestAnimationFrame(finishPageEnter);
  });

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchor = event.target.closest("a[href]");
    if (!isInternalPageLink(anchor)) return;

    event.preventDefault();
    if (document.documentElement.classList.contains("is-page-leaving")) return;

    sessionStorage.setItem(TRANSITION_KEY, "1");
    document.documentElement.classList.add("is-page-leaving");
    document.documentElement.classList.remove("is-page-ready");

    window.setTimeout(() => {
      location.href = anchor.href;
    }, PAGE_MS);
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    document.documentElement.classList.remove("is-page-leaving", "is-page-entering");
    document.documentElement.classList.add("is-page-ready");
  });
}

setupPageTransitions();

const form = document.querySelector("#enquiry-form");
const status = document.querySelector("#form-status");

function buildMessage({ name, phone, interest, message }) {
  const lines = ["New enquiry — Universal Enterprises"];
  if (name) lines.push(`Name: ${name}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (interest) lines.push(`Interest: ${interest}`);
  if (message) lines.push(`Message: ${message}`);
  return lines.join("\n");
}

function whatsAppUrl(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function openWhatsApp(text) {
  const link = document.createElement("a");
  link.href = whatsAppUrl(text);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function validPhone(value) {
  const digits = value.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return digits;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(2);
  return "";
}

function setError(id, message) {
  const field = document.querySelector(`#${id}`).closest(".field");
  const error = document.querySelector(`#${id}-error`);
  const input = document.querySelector(`#${id}`);
  if (message) {
    field.classList.add("is-invalid");
    error.hidden = false;
    error.textContent = message;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", `${id}-error`);
    requestAnimationFrame(() => error.classList.add("is-visible"));
  } else {
    field.classList.remove("is-invalid");
    error.classList.remove("is-visible");
    error.hidden = true;
    error.textContent = "";
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-interest], [data-wa='general']");
  if (!button || button.type === "submit") return;

  if (button.dataset.wa === "general") {
    openWhatsApp(buildMessage({
      message: "Hello, I would like to enquire.",
    }));
    return;
  }

  openWhatsApp(buildMessage({ interest: button.dataset.interest }));
});

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (status) {
      status.textContent = "";
      status.classList.remove("is-visible");
    }

    const name = form.name.value.trim();
    const phoneRaw = form.phone.value.trim();
    const phone = validPhone(phoneRaw);
    const interest = form.interest.value;
    const message = form.message.value.trim();

    const nameError = name.length < 2 ? "Enter your name." : "";
    const phoneError = phone ? "" : "Enter a 10-digit mobile number.";
    const interestError = interest ? "" : "Choose a service or product.";

    setError("name", nameError);
    setError("phone", phoneError);
    setError("interest", interestError);

    if (nameError || phoneError || interestError) {
      const firstInvalid = form.querySelector("[aria-invalid='true']");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    openWhatsApp(buildMessage({ name, phone, interest, message }));
    if (status) {
      status.textContent = "WhatsApp should open with your enquiry ready to send.";
      requestAnimationFrame(() => status.classList.add("is-visible"));
    }
  });
}

const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const exploreTrigger = document.querySelector(".nav-trigger");
const exploreMenu = document.querySelector("#explore-menu");
const exploreItem = document.querySelector(".nav-item.has-menu");

function openPanel(panel) {
  if (!panel) return;
  panel.hidden = false;
  requestAnimationFrame(() => {
    panel.classList.add("is-open");
  });
}

function closePanel(panel) {
  if (!panel || panel.hidden) return;
  panel.classList.remove("is-open");
  if (reduceMotion) {
    panel.hidden = true;
    return;
  }
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    panel.hidden = true;
    panel.removeEventListener("transitionend", onEnd);
  };
  const onEnd = (event) => {
    if (event.target === panel && event.propertyName === "opacity") finish();
  };
  panel.addEventListener("transitionend", onEnd);
  window.setTimeout(finish, MENU_MS);
}

function closeExplore() {
  if (!exploreTrigger || !exploreMenu || !exploreItem) return;
  exploreTrigger.setAttribute("aria-expanded", "false");
  exploreItem.classList.remove("is-open");
  closePanel(exploreMenu);
}

function closeMobile() {
  if (!navToggle || !mobileNav) return;
  navToggle.setAttribute("aria-expanded", "false");
  closePanel(mobileNav);
}

if (navToggle && mobileNav) {
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    if (open) {
      closePanel(mobileNav);
    } else {
      openPanel(mobileNav);
      closeExplore();
    }
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobile);
  });
}

if (exploreTrigger && exploreMenu && exploreItem) {
  exploreTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = exploreTrigger.getAttribute("aria-expanded") === "true";
    exploreTrigger.setAttribute("aria-expanded", String(!open));
    exploreItem.classList.toggle("is-open", !open);
    if (open) closePanel(exploreMenu);
    else openPanel(exploreMenu);
  });

  exploreMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeExplore);
  });
}

document.addEventListener("click", (event) => {
  if (exploreItem && !exploreItem.contains(event.target)) closeExplore();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeExplore();
    closeMobile();
  }
});

function setupReveal() {
  const targets = [
    ...document.querySelectorAll(".block, .enquiry-form, .products, .about-list, .meta-grid, .gallery, .hero-frame, .about-hero-frame"),
    ...document.querySelectorAll(".card, .meta-card, .about-list li, .facts div, .gallery-item"),
  ];

  if (!targets.length) return;

  const unique = [...new Set(targets)];
  unique.forEach((el, index) => {
    el.classList.add("reveal");
    if (el.matches(".card, .meta-card, .about-list li, .facts div, .gallery-item")) {
      el.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 40}ms`);
    }
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    unique.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  unique.forEach((el) => observer.observe(el));
}

setupReveal();

/* Our work mosaic — cycle images in place (layout unchanged).
   4s is a common portfolio / case-study slideshow interval. */
function setupWorkSlideshow() {
  const gallery = document.querySelector("#work .gallery");
  if (!gallery || reduceMotion) return;

  const slides = [
    { src: "img/img14.jpg", alt: "Desktop PC repair on the workbench" },
    { src: "img/img15.jpg", alt: "Technician assembling a desktop computer" },
    { src: "img/img17.jpg", alt: "Cable work inside a PC tower" },
    { src: "img/img2.jpg", alt: "Network technician working on a rack" },
    { src: "img/img3.jpg", alt: "Structured cabling in a server room" },
    { src: "img/img6.jpg", alt: "Patch panel and network switches" },
    { src: "img/9.jpg", alt: "Computer training lab with workstations" },
    { src: "img/imh10.jpg", alt: "Modern computer lab desks and monitors" },
    { src: "img/img11.jpg", alt: "Rows of desktop computers in a lab" },
    { src: "img/img12.jpg", alt: "IT training session in a classroom" },
    { src: "img/img18.jpg", alt: "IT consultation with network diagrams" },
    { src: "img/img40.png", alt: "CCTV security camera" },
    { src: "img/img26.jpg", alt: "CCTV accessories and camera kit" },
    { src: "img/img27.jpg", alt: "CCTV camera mount and install kit" },
    { src: "img/img28.jpg", alt: "Technician refilling a printer ink cartridge" },
    { src: "img/img30.jpg", alt: "Technician refilling a toner cartridge" },
    { src: "img/img39.jpg", alt: "Laser toner cartridge being refilled" },
    { src: "img/img13.jpg", alt: "Laptop repair on the workbench" },
    { src: "img/img16.jpg", alt: "Board-level motherboard repair" },
    { src: "img/img4.jpg", alt: "Desktop computer workstation setup" },
    { src: "img/img5.jpg", alt: "Laptop and desktop systems on a desk" },
    { src: "img/img8.jpg", alt: "Technician installing network equipment" },
  ];

  const images = [...gallery.querySelectorAll(".gallery-item img")];
  if (!images.length) return;

  slides.forEach((slide) => {
    const preload = new Image();
    preload.src = slide.src;
  });

  const INTERVAL_MS = 4000;
  const FADE_MS = 420;
  let tick = 0;
  let timer = 0;

  function advance() {
    tick += 1;
    images.forEach((img, slot) => {
      const next = slides[(tick + slot) % slides.length];
      window.setTimeout(() => {
        img.classList.add("is-fading");
        window.setTimeout(() => {
          img.src = next.src;
          img.alt = next.alt;
          img.classList.remove("is-fading");
        }, FADE_MS);
      }, slot * 90);
    });
  }

  function start() {
    if (timer) return;
    timer = window.setInterval(advance, INTERVAL_MS);
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = 0;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) start();
          else stop();
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(gallery);
  } else {
    start();
  }
}

setupWorkSlideshow();

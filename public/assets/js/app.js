"use strict";

const pages = {
  "index.html": {
    href: "./index.html",
    label: "Home",
    icon: "home"
  },
  "quote.html": {
    href: "./quote.html",
    label: "Quote",
    icon: "quote"
  },
  "docs.html": {
    href: "./docs.html",
    label: "Docs",
    icon: "docs"
  },
  "updates.html": {
    href: "./updates.html",
    label: "Updates",
    icon: "updates"
  },
  "support.html": {
    href: "./support.html",
    label: "Support",
    icon: "support"
  },
  "login.html": {
    href: "./login.html",
    label: "Login",
    icon: "login"
  }
};

const icons = {
  home: '<path d="M3 10.5 12 3l9 7.5v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  quote: '<path d="M6 5h12M6 9h8M6 13h12M6 17h7"/>',
  docs: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  updates: '<path d="M12 3v18M3 12h18"/>',
  support: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
  login: '<circle cx="12" cy="8" r="3"/><path d="M6 20c.8-3.5 3-5 6-5s5.2 1.5 6 5"/>'
};

function currentPage() {
  const file = location.pathname.split("/").pop();
  return file || "index.html";
}

function buildDock() {
  const target = document.getElementById("dock");
  if (!target) return;

  const current = currentPage();

  const nav = document.createElement("nav");
  nav.className = "bottom-dock glass";
  nav.setAttribute("aria-label", "Main navigation");

  Object.entries(pages).forEach(([file, page]) => {
    const link = document.createElement("a");

    link.href = page.href;
    link.className = "dock-item";

    if (file === current) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    link.innerHTML = `
      <span class="dock-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          ${icons[page.icon]}
        </svg>
      </span>
      <span class="dock-label">${page.label}</span>
    `;

    nav.appendChild(link);
  });

  target.replaceWith(nav);
}

function initReveal() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  elements.forEach((element) => observer.observe(element));
}

async function initQuote() {
  const quoteText = document.getElementById("quoteText");
  const newQuote = document.getElementById("newQuote");

  if (!quoteText) return;

  let quotes = [];
  let lastIndex = -1;

  try {
    const response = await fetch("./api/quote/all.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Quote dataset unavailable");
    }

    const payload = await response.json();

    if (!Array.isArray(payload.data) || !payload.data.length) {
      throw new Error("Quote dataset empty");
    }

    quotes = payload.data;
  } catch (error) {
    quoteText.textContent = "Quote dataset belum dapat dimuat.";
    console.error(error);
    return;
  }

  function render() {
    let index;

    do {
      index = Math.floor(Math.random() * quotes.length);
    } while (quotes.length > 1 && index === lastIndex);

    lastIndex = index;

    quoteText.style.opacity = "0";

    setTimeout(() => {
      quoteText.textContent = quotes[index];
      quoteText.style.opacity = "1";
    }, 120);
  }

  newQuote?.addEventListener("click", render);
  render();
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      const original = button.innerHTML;

      try {
        await navigator.clipboard.writeText(value);
        button.innerHTML = "<span>Copied</span><span>✓</span>";
      } catch {
        button.innerHTML = "<span>Copy failed</span><span>!</span>";
      }

      setTimeout(() => {
        button.innerHTML = original;
      }, 1500);
    });
  });
}

function initCursor() {
  const glow = document.querySelector(".cursor-glow");

  if (!glow || !window.matchMedia("(pointer:fine)").matches) {
    return;
  }

  window.addEventListener("pointermove", (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
    glow.style.opacity = "1";
  });

  document.addEventListener("mouseleave", () => {
    glow.style.opacity = "0";
  });
}

buildDock();
initReveal();
initQuote();
initCopyButtons();
initCursor();

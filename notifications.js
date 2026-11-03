const TOAST_ID = "dw-toast";
let hideTimer = null;


function ensureToastStyles() {
  if (document.getElementById("dw-toast-global-style")) return;
  const style = document.createElement("style");
  style.id = "dw-toast-global-style";
  style.textContent = `
    .dw-toast { position:fixed !important; z-index:2147483647 !important; top:50dvh !important; left:50vw !important; right:auto !important; bottom:auto !important;
      display:flex; align-items:center; gap:13px; width:min(430px, calc(100vw - 32px)); padding:18px 19px;
      border:1px solid rgba(244,183,82,.72); border-radius:18px; color:#fff8ef; background:linear-gradient(145deg,#3b261f,#211613);
      box-shadow:0 18px 55px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.07); font-family:Quicksand,sans-serif;
      opacity:0; visibility:hidden; transform:translate(-50%,-42%) scale(.96); transition:opacity .25s ease,transform .25s ease,visibility .25s; backdrop-filter:blur(12px); }
    .dw-toast.is-visible { opacity:1 !important; visibility:visible !important; transform:translate(-50%,-50%) scale(1) !important; }
    .dw-toast-icon { flex:0 0 40px; width:40px; height:40px; display:grid; place-items:center; border-radius:13px; background:rgba(245,166,35,.16); color:#ffc66d; font:700 22px Fredoka,sans-serif; }
    .dw-toast-copy { display:grid; gap:4px; min-width:0; flex:1; }
    .dw-toast-title { color:#ffd18a; font:600 17px Fredoka,sans-serif; }
    .dw-toast-message { color:#f5e9df; font-size:14px; line-height:1.55; overflow-wrap:anywhere; }
    .dw-toast-close { border:0; background:transparent; color:#d9c5b8; font-size:24px; cursor:pointer; padding:3px 5px; }
    .dw-toast-error { border-color:rgba(236,120,105,.8); } .dw-toast-error .dw-toast-icon { background:rgba(214,85,72,.18); color:#ff9d91; }
    .dw-toast-error .dw-toast-title { color:#ffb0a5; } .dw-toast-info .dw-toast-icon { background:rgba(130,166,210,.18); color:#a9cafa; }
    .dw-toast-info .dw-toast-title { color:#c4dcff; }
  `;
  document.head.appendChild(style);
}

function ensureToast() {
  ensureToastStyles();
  let toast = document.getElementById(TOAST_ID);
  if (toast) return toast;
  toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.className = "dw-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML = `
    <span class="dw-toast-icon" aria-hidden="true"></span>
    <span class="dw-toast-copy"><strong class="dw-toast-title"></strong><span class="dw-toast-message"></span></span>
    <button class="dw-toast-close" type="button" aria-label="Close notification">&times;</button>`;
  // Keep the toast outside the page body so transformed/scrolling page containers
  // cannot turn its fixed position into a document-relative position.
  document.documentElement.appendChild(toast);
  toast.querySelector(".dw-toast-close").addEventListener("click", () => dismissToast(toast));
  return toast;
}

function dismissToast(toast) {
  toast.classList.remove("is-visible");
  window.clearTimeout(hideTimer);
}

export function showToast(message, type = "success", options = {}) {
  const toast = ensureToast();
  const config = {
    success: { title: "All set!", icon: "✓" },
    error: { title: "Something went wrong", icon: "!" },
    warning: { title: "A quick note", icon: "⚠" },
    info: { title: "Just so you know", icon: "✦" }
  };
  const selected = config[type] || config.info;
  toast.className = `dw-toast dw-toast-${type}`;
  toast.querySelector(".dw-toast-icon").textContent = selected.icon;
  toast.querySelector(".dw-toast-title").textContent = options.title || selected.title;
  toast.querySelector(".dw-toast-message").textContent = String(message);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.clearTimeout(hideTimer);
  if (options.duration !== 0) {
    hideTimer = window.setTimeout(() => dismissToast(toast), options.duration ?? (type === "success" ? 2200 : 3200));
  }
}

export function queueToast(message, type = "success", title = "") {
  try {
    sessionStorage.setItem("dw:pending-toast", JSON.stringify({ message, type, title }));
  } catch (_) {}
}

window.dwToast = showToast;

try {
  const pending = sessionStorage.getItem("dw:pending-toast");
  if (pending) {
    sessionStorage.removeItem("dw:pending-toast");
    const item = JSON.parse(pending);
    window.setTimeout(() => showToast(item.message, item.type, { title: item.title || undefined }), 180);
  }
} catch (_) {}

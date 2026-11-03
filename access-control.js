
import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const authReady = new Promise(resolve => {
  onAuthStateChanged(auth, user => resolve(user || null));
});

function askLogin() {
  if (document.getElementById("dw-login-prompt")) return;

  const overlay = document.createElement("div");
  overlay.id = "dw-login-prompt";

  overlay.innerHTML = `
    <div class="dw-login-card" role="dialog" aria-modal="true" aria-labelledby="dw-login-title">
      <div class="dw-login-icon">✦</div>
      <h2 id="dw-login-title">Your next adventure awaits!</h2>
      <p>
        Create a free DreamWings account or sign in to explore this collection,
        save favorite stories, and keep your reading journey together.
      </p>
      <div class="dw-login-actions">
        <a href="login.html" class="dw-login-primary">Sign in</a>
        <a href="signup.html" class="dw-login-secondary">Create account</a>
      </div>
      <button type="button" class="dw-login-close">Maybe later</button>
    </div>
  `;

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100vh",
    height: "100dvh",
    zIndex: "2147483647",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    boxSizing: "border-box",
    background: "rgba(12,8,7,.78)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    overflowY: "auto",
    margin: "0",
    transform: "none"
  });

  const style = document.createElement("style");

  style.textContent = `
    .dw-login-card {
      max-width: 440px;
      width: 100%;
      box-sizing: border-box;
      padding: 30px;
      border-radius: 24px;
      text-align: center;
      background: linear-gradient(145deg,#30201c,#1d1412);
      border: 1px solid #e5a13c;
      color: #fff;
      box-shadow: 0 25px 80px #0009;
      font-family: Quicksand, sans-serif;
      margin: auto;
    }

    .dw-login-icon {
      margin: auto auto 14px;
      width: 56px;
      height: 56px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: #563323;
      color: #ffc05a;
      font-size: 30px;
    }

    .dw-login-card h2 {
      font: 700 26px Fredoka, sans-serif;
      color: #ffc05a;
      margin-bottom: 12px;
    }

    .dw-login-card p {
      line-height: 1.7;
      color: #eadbd3;
    }

    .dw-login-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin: 22px 0 12px;
    }

    .dw-login-actions a {
      padding: 11px 20px;
      border-radius: 24px;
      text-decoration: none;
      font-weight: 700;
    }

    .dw-login-primary {
      background: linear-gradient(90deg,#c94b31,#f2a52c);
      color: #fff;
    }

    .dw-login-secondary {
      border: 1px solid #e5a13c;
      color: #ffd18a;
    }

    .dw-login-close {
      background: none;
      border: 0;
      color: #d8c4ba;
      text-decoration: underline;
      cursor: pointer;
      padding: 8px;
    }

    @media (max-width: 480px) {
      .dw-login-card {
        padding: 24px 18px;
      }

      .dw-login-card h2 {
        font-size: 23px;
      }
    }
  `;

  document.head.appendChild(style);

  // Place the overlay outside the page body
  document.documentElement.appendChild(overlay);

  overlay.querySelector(".dw-login-close").onclick = () => {
    overlay.remove();
    style.remove();
  };
}

document.addEventListener("click", async event => {
  const target = event.target instanceof Element
    ? event.target.closest("[data-requires-auth]")
    : null;

  if (!target) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const user = await authReady;

  if (!user) {
    askLogin();
    return;
  }

  const href = target.getAttribute("href");

  if (href) {
    location.href = href;
  } else if (typeof target.onclick === "function") {
    target.onclick();
  }
}, true);

if (document.body?.dataset.requiresAuthPage === "true") {
  const user = await authReady;

  if (!user) askLogin();
}

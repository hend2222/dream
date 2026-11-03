import { showToast } from "./notifications.js";

import { db, auth } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let rating = 5;

const list = document.getElementById("commentsList");
const form = document.getElementById("commentForm");

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function drawStars(n) {
  return Array.from({ length: 5 }, (_, i) =>
    `<i class="fa-${i < n ? "solid" : "regular"} fa-star"></i>`
  ).join("");
}

window.setRating = n => {
  rating = Math.max(1, Math.min(5, Number(n) || 5));

  document.querySelectorAll("#starPicker i").forEach((s, i) => {
    s.className = `fa-${i < rating ? "solid" : "regular"} fa-star`;
  });
};

async function load() {
  if (!list) return;

  try {
    const snap = await getDocs(
      query(
        collection(db, "comments"),
        orderBy("createdAt", "desc")
      )
    );

    list.innerHTML = `
      <h3 style="text-align:left;margin:30px 0 15px 0;color:var(--accent-warm-gold)">
        Visitor Notes
      </h3>
    `;

    snap.forEach(d => {
      const c = d.data();
      const el = document.createElement("div");

      el.className = "comment-item";
      el.innerHTML = `
        <div class="comment-header-info">
          <span class="comment-author-name">${esc(c.name || "Visitor")}</span>
          <div class="comment-stars">${drawStars(c.rating || 5)}</div>
        </div>
        <p class="comment-body-text">${esc(c.text || "")}</p>
      `;

      list.appendChild(el);
    });

  } catch (err) {
    console.error("Comments loading error:", err);
    list.textContent = "Comments could not be loaded. Check your Firestore setup.";
  }
}

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();

    // Keep a reference to the form before awaiting anything.
    const currentForm = e.currentTarget;
    const btn = currentForm.querySelector('[type="submit"]');

    const name = document.getElementById("commenterName")?.value.trim();
    const text = document.getElementById("commentText")?.value.trim();

    if (!name || !text) { showToast("Please enter your name and write a comment first.", "warning"); return; }

    if (btn) btn.disabled = true;

    try {
      await addDoc(collection(db, "comments"), {
        name,
        text,
        rating,
        uid: auth.currentUser?.uid || null,
        createdAt: serverTimestamp()
      });

      currentForm.reset();
      window.setRating(5);

      await load();

      showToast("Your comment is now part of the DreamWings visitor notes.", "success", "Comment published");

    } catch (err) {
      console.error("Comment saving error:", err);
      showToast("Your comment could not be saved. Please try again in a moment.", "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

window.setRating(5);
load();

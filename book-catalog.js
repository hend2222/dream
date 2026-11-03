import { db, auth } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_UID = "LNghcfytsiU2x627gt4iAzPFaFH3";
const shelves = [...document.querySelectorAll(".shelf-grid")];
const shelf = shelves[0];

// Remove the old hard-coded sample covers: only books uploaded to Firebase remain.
document.querySelectorAll(".book-card-real:not(.dw-book-card)").forEach(card => card.remove());
document.querySelectorAll(".shelf-wrapper").forEach((wrapper, index) => {
  if (index > 0) wrapper.remove();
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}

function addAdminStyles() {
  if (document.getElementById("dw-admin-book-styles")) return;
  const style = document.createElement("style");
  style.id = "dw-admin-book-styles";
  style.textContent = `
    .dw-book-card { position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; }
    .dw-book-card .real-book-cover { overflow:hidden; }
    .dw-book-card .real-book-cover img { width:100%; height:100%; object-fit:cover; }
    .dw-admin-actions { display:flex; gap:9px; justify-content:center; margin:12px 0 4px; position:relative; z-index:5; }
    .dw-admin-actions button { border:1px solid rgba(255,210,150,.35); border-radius:22px; padding:9px 15px;
      font:600 13px Quicksand,sans-serif; color:#fff; cursor:pointer; transition:.2s; box-shadow:0 5px 14px #160d0b55; }
    .dw-admin-actions button:hover { transform:translateY(-3px); filter:brightness(1.12); }
    .dw-admin-edit { background:linear-gradient(135deg,#bd7830,#e9ad51); }
    .dw-admin-delete { background:linear-gradient(135deg,#923d35,#c85b4c); }
    .dw-empty-books { color:#f5d9b5; text-align:center; padding:24px; font-family:Quicksand,sans-serif; }
  `;
  document.head.appendChild(style);
}

async function renderBooks(user) {
  if (!shelf) return;
  const isAdmin = !!user && user.uid === ADMIN_UID;
  try {
    const snap = await getDocs(collection(db, "books"));
    const books = snap.docs.map(item => ({ id:item.id, ...item.data() }))
      .filter(book => (book.category || "fantasy") === "fantasy");

    // Clear only the dynamic area previously marked by this script.
    document.querySelectorAll(".dw-dynamic-book").forEach(node => node.remove());
    if (!books.length) {
      const empty = document.createElement("p");
      empty.className = "dw-empty-books dw-dynamic-book";
      empty.textContent = "New magical stories will appear here soon ✨";
      shelf.appendChild(empty);
      return;
    }

    addAdminStyles();
    books.forEach(book => {
      const card = document.createElement("article");
      card.className = "book-card-real dw-book-card dw-dynamic-book";
      card.dataset.bookId = book.id;
      card.innerHTML = `
        <div class="book-3d-wrapper">
          <div class="real-book-cover">
            <img src="${escapeHtml(book.coverUrl || "")}" alt="${escapeHtml(book.title || "Book cover")}">
            <div class="book-spine-effect"></div>
          </div>
        </div>
        <div class="book-shadow"></div>
        <div class="dw-book-caption">
          <strong>${escapeHtml(book.title || "Untitled story")}</strong>
          <span>${escapeHtml(book.author || "DreamWings")}</span>
        </div>`;
      card.addEventListener("click", () => {
        location.href = `reader.html?id=${encodeURIComponent(book.id)}`;
      });

      if (isAdmin) {
        const actions = document.createElement("div");
        actions.className = "dw-admin-actions";
        actions.innerHTML = `
          <button type="button" class="dw-admin-edit"><i class="fa-solid fa-pen"></i> Edit</button>
          <button type="button" class="dw-admin-delete"><i class="fa-solid fa-trash"></i> Delete</button>`;
        actions.querySelector(".dw-admin-edit").addEventListener("click", event => {
          event.stopPropagation();
          window.editBook?.(book.id, book.title || "", book.author || "", book.description || "");
        });
        actions.querySelector(".dw-admin-delete").addEventListener("click", event => {
          event.stopPropagation();
          window.deleteBook?.(book.id);
        });
        card.appendChild(actions);
      }
      shelf.appendChild(card);
    });
  } catch (error) {
    console.error("Could not load uploaded books:", error);
    const msg = document.createElement("p");
    msg.className = "dw-empty-books";
    msg.textContent = "We couldn't load the stories. Please refresh and try again.";
    shelf?.appendChild(msg);
  }
}

onAuthStateChanged(auth, renderBooks);

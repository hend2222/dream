import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const keyFor = uid => `dreamwings:favorites:${uid}`;
const read = uid => {
  try { const value = JSON.parse(localStorage.getItem(keyFor(uid)) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
};
const write = (uid, items) => localStorage.setItem(keyFor(uid), JSON.stringify(items));
let activeUser = null;

function toast(message) {
  let el = document.getElementById("dreamwings-fav-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "dreamwings-fav-toast";
    Object.assign(el.style, {
      position: "fixed", left: "50%", bottom: "28px", transform: "translateX(-50%)",
      zIndex: "100000", background: "#2b1b18", color: "#fff", border: "1px solid #d6a85f",
      borderRadius: "14px", padding: "12px 20px", boxShadow: "0 8px 28px #0007",
      font: "600 14px Quicksand, sans-serif", textAlign: "center", maxWidth: "min(90vw, 420px)"
    });
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = "none"; }, 2600);
}
function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function currentBook(button) {
  const card = button.closest("[data-book-id]");
  const title = button.dataset.title || card?.dataset.title || document.getElementById("modalBookTitle")?.textContent || "Story";
  return {
    id: button.dataset.bookId || card?.dataset.bookId || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title,
    image: button.dataset.image || card?.dataset.image || document.getElementById("modalBookCover")?.getAttribute("src") || "",
    description: button.dataset.description || card?.dataset.description || document.getElementById("modalBookDesc")?.textContent || "",
    author: button.dataset.author || card?.dataset.author || document.getElementById("modalBookAuthor")?.textContent || "DreamWings"
  };
}
function syncButton(button) {
  const book = currentBook(button);
  const saved = !!activeUser && read(activeUser.uid).some(item => item.id === book.id);
  button.classList.toggle("active", saved);
  button.title = saved ? "Remove from Favorites" : "Add to Favorites";
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", String(saved));
}
function renderFavorites() {
  const grid = document.getElementById("favoritesGrid") || document.getElementById("profileFavoritesGrid");
  if (!grid) return;
  if (!activeUser) {
    grid.innerHTML = '<p class="empty-favorites">Please sign in to view your saved stories.</p>';
    return;
  }
  const items = read(activeUser.uid);
  grid.innerHTML = items.length ? items.map(book => `
    <div class="book-card-item" data-book-id="${escapeHtml(book.id)}">
      <div class="book-card-real"><div class="book-3d-wrapper"><div class="real-book-cover">
        <img src="${escapeHtml(book.image)}" alt="${escapeHtml(book.title)}">
      </div></div></div>
      <div class="book-info-bottom"><span class="book-title-label">${escapeHtml(book.title)}</span>
        <button class="book-fav-btn active" data-remove-favorite="${escapeHtml(book.id)}" title="Remove Favorite" aria-label="Remove Favorite"><i class="fa-solid fa-star"></i></button>
      </div>
    </div>`).join("") : '<p class="empty-favorites">No favorites yet. Open a story and tap the star to save it.</p>';
}
function toggle(button) {
  if (!activeUser) {
    toast("Sign in to save this story to your personal Favorites.");
    setTimeout(() => { window.location.href = "login.html"; }, 1100);
    return;
  }
  const book = currentBook(button);
  let items = read(activeUser.uid);
  const exists = items.some(item => item.id === book.id);
  items = exists ? items.filter(item => item.id !== book.id) : [...items, book];
  write(activeUser.uid, items);
  syncButton(button);
  renderFavorites();
  toast(exists ? "Removed from your Favorites." : "Added to your Favorites ⭐");
}

onAuthStateChanged(auth, user => {
  activeUser = user;
  document.querySelectorAll("[data-favorite-toggle]").forEach(syncButton);
  renderFavorites();
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-favorite-toggle]");
  if (button) {
    event.preventDefault();
    event.stopPropagation();
    toggle(button);
    return;
  }
  const remove = event.target.closest("[data-remove-favorite]");
  if (remove && activeUser) {
    const id = remove.dataset.removeFavorite;
    write(activeUser.uid, read(activeUser.uid).filter(item => item.id !== id));
    renderFavorites();
    toast("Removed from your Favorites.");
  }
});

document.addEventListener("favorite-modal-open", event => {
  if (event.target.matches?.("[data-favorite-toggle]")) syncButton(event.target);
});

import { auth, db } from "./firebase-config.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Use the same direct owner-UID check as the original working book-catalog.js.
// Do not depend on a second module's Promise/state to decide whether to render controls.
const ADMIN_UID = "LNghcfytsiU2x627gt4iAzPFaFH3";
const DEFAULT_CATEGORIES = [
  {id:"space-stars",name:"Space & Stars",color:"#477aa5",icon:"fa-rocket"},
  {id:"secret-kingdoms",name:"Secret Kingdoms",color:"#7b4da3",icon:"fa-hat-wizard"},
  {id:"time-portals",name:"Time Portals",color:"#b86c45",icon:"fa-hourglass-start"},
  {id:"kind-hearts",name:"Kind Hearts",color:"#a64f78",icon:"fa-hands-holding-child"},
  {id:"little-scientist",name:"Little Scientist",color:"#4b987d",icon:"fa-flask"},
  {id:"sleepy-star-dreams",name:"Sleepy Star Dreams",color:"#53618f",icon:"fa-cloud-moon"}
];
const categoryId = new URLSearchParams(location.search).get("id") || "space-stars";
const root = document.getElementById("categoryBooks");
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

function addAdminStyles() {
  if (document.getElementById("dw-admin-book-styles")) return;
  const style = document.createElement("style");
  style.id = "dw-admin-book-styles";
  style.textContent = `
    #categoryBooks .dw-admin-actions { display:flex!important; gap:9px; justify-content:center; margin:12px auto 4px; position:relative; z-index:20; }
    #categoryBooks .dw-admin-actions button { display:inline-flex!important; align-items:center; gap:6px; border:1px solid rgba(255,210,150,.35); border-radius:22px; padding:9px 15px; font:600 13px Quicksand,sans-serif; color:#fff; cursor:pointer; box-shadow:0 5px 14px #160d0b55; }
    #categoryBooks .dw-admin-edit { background:linear-gradient(135deg,#bd7830,#e9ad51); }
    #categoryBooks .dw-admin-delete { background:linear-gradient(135deg,#923d35,#c85b4c); }
    #categoryBooks .dw-admin-actions button:hover { transform:translateY(-2px); filter:brightness(1.1); }
  `;
  document.head.appendChild(style);
}

async function isSiteAdmin(user) {
  if (!user) return false;
  if (user.uid === ADMIN_UID) return true;
  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const data = userSnap.exists() ? userSnap.data() : {};
    return data.role === "admin" || data.isAdmin === true;
  } catch (error) {
    console.error("Could not verify administrator role:", error);
    return false;
  }
}

async function getCategory() {
  const builtIn = DEFAULT_CATEGORIES.find(item => item.id === categoryId);
  if (builtIn) return builtIn;
  try {
    const snap = await getDoc(doc(db, "categories", categoryId));
    return snap.exists() ? {id:categoryId, ...snap.data()} : null;
  } catch (error) {
    console.error("Could not load category:", error);
    return null;
  }
}

async function render(user) {
  if (!root) return;
  const category = await getCategory();
  if (!category) {
    root.innerHTML = '<p class="dw-cat-empty">This category could not be found.</p>';
    return;
  }
  document.title = `DreamWings | ${category.name || "Stories"}`;
  const title = document.getElementById("categoryTitle");
  if (title) title.textContent = category.name || "Stories";
  const symbol = document.getElementById("categorySymbol");
  if (symbol) {
    symbol.style.background = category.color || "#75513b";
    symbol.innerHTML = `<i class="fa-solid ${esc(category.icon || "fa-book-open")}"></i>`;
  }

  try {
    const [booksSnap, admin] = await Promise.all([
      getDocs(collection(db, "books")),
      isSiteAdmin(user)
    ]);
    const books = booksSnap.docs
      .map(item => ({id:item.id, ...item.data()}))
      .filter(book => book.category === categoryId);
    root.replaceChildren();
    if (!books.length) {
      const empty = document.createElement("p");
      empty.className = "dw-cat-empty";
      empty.textContent = "No stories have been added to this shelf yet. Add one from Book Studio ✨";
      root.append(empty);
      return;
    }

    if (admin) addAdminStyles();
    books.forEach(book => {
      const card = document.createElement("article");
      card.className = "book-card-real dw-book-card";
      card.dataset.bookId = book.id;
      card.innerHTML = `
        <div class="book-3d-wrapper"><div class="real-book-cover" style="background:${esc(category.color || "#75513b")}">
          ${book.coverUrl ? `<img src="${esc(book.coverUrl)}" alt="${esc(book.title || "Book cover")}">` : `<i class="fa-solid ${esc(category.icon || "fa-book-open")}" style="display:grid;place-items:center;height:100%;font-size:58px;color:white"></i>`}
          <div class="book-spine-effect"></div>
        </div></div>
        <div class="book-shadow"></div>
        <div class="dw-book-caption"><strong>${esc(book.title || "Untitled story")}</strong><span>${esc(book.author || "DreamWings")}</span></div>`;
      card.addEventListener("click", () => {
        location.href = `reader.html?id=${encodeURIComponent(book.id)}`;
      });

      if (admin) {
        const actions = document.createElement("div");
        actions.className = "dw-admin-actions";
        actions.innerHTML = `
          <button type="button" class="dw-admin-edit"><i class="fa-solid fa-pen"></i> Edit</button>
          <button type="button" class="dw-admin-delete"><i class="fa-solid fa-trash"></i> Delete</button>`;
        // Module scripts are deferred and independent: category-page can finish
        // rendering before book-admin has completed. Import it on demand so the
        // handlers are guaranteed to exist before either action is invoked.
        async function ensureAdminTools() {
          if (typeof window.editBook === "function" && typeof window.deleteBook === "function") return;
          await import("./book-admin.js");
          if (typeof window.editBook !== "function" || typeof window.deleteBook !== "function") {
            throw new Error("ملف إدارة الكتب لم يعرّف وظائف التعديل والحذف. راجعي تحميل book-admin.js.");
          }
        }

        actions.querySelector(".dw-admin-edit").addEventListener("click", async event => {
          event.preventDefault(); event.stopPropagation();
          const button = event.currentTarget;
          button.disabled = true;
          try {
            await ensureAdminTools();
            await window.editBook(book.id, book.title || "", book.author || "", book.description || "");
          } catch (error) {
            console.error("Edit tool could not be loaded:", error);
            alert("تعذّر تحميل أداة التعديل: " + (error?.message || error));
          } finally { button.disabled = false; }
        });
        actions.querySelector(".dw-admin-delete").addEventListener("click", async event => {
          event.preventDefault(); event.stopPropagation();
          const button = event.currentTarget;
          button.disabled = true;
          try {
            await ensureAdminTools();
            await window.deleteBook(book.id);
          } catch (error) {
            console.error("Delete tool could not be loaded:", error);
            alert("تعذّر تحميل أداة الحذف: " + (error?.message || error));
          } finally { button.disabled = false; }
        });
        card.appendChild(actions);
      }
      root.appendChild(card);
    });
  } catch (error) {
    console.error("Category books could not be loaded:", error);
    root.innerHTML = '<p class="dw-cat-empty">Could not load books. Please check Firestore permissions and refresh.</p>';
  }
}

onAuthStateChanged(auth, user => { render(user); });

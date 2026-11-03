import { db, auth } from "./firebase-config.js";
import { collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_UID = "LNghcfytsiU2x627gt4iAzPFaFH3";
const shelf = document.querySelector(".shelf-grid");

// إضافة تنسيق جمالي مخصص للأزرار يتماشى مع ديزاين DreamWings
const adminStyle = document.createElement("style");
adminStyle.innerHTML = `
  .admin-actions-container {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 12px;
    z-index: 20;
    position: relative;
  }
  .btn-admin-action {
    border: none;
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Fredoka', sans-serif;
    transition: all 0.25s ease-in-out;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  .btn-edit-book {
    background: linear-gradient(135deg, #f5a623, #f7b733);
    color: #fff;
  }
  .btn-edit-book:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(245, 166, 35, 0.4);
  }
  .btn-delete-book {
    background: linear-gradient(135deg, #ff5f6d, #ff2a6d);
    color: #fff;
  }
  .btn-delete-book:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(255, 42, 109, 0.4);
  }
`;
document.head.appendChild(adminStyle);

if (shelf) {
  try {
    const snap = await getDocs(collection(db, "books"));
    
    onAuthStateChanged(auth, (user) => {
      const isAdmin = user && user.uid === ADMIN_UID;
      shelf.innerHTML = "";

      snap.forEach(item => {
        const b = item.data();
        if (b.category !== "fantasy") return;
        
        const card = document.createElement("div");
        card.className = "book-card-real";
        card.dataset.bookId = b.bookId; 
        card.dataset.title = b.title; 
        card.dataset.image = b.coverUrl;
        card.dataset.description = b.description; 
        card.dataset.author = b.author;

        card.innerHTML = `
          <div class="book-3d-wrapper">
            <div class="real-book-cover">
              <img src="${b.coverUrl}" alt="${b.title}">
              <div class="book-spine-effect"></div>
            </div>
          </div>
          <div class="book-shadow"></div>
        `;

        // إظهار أزرار التحكم للأدمين بتصميم احترافي
        if (isAdmin) {
          const adminActions = document.createElement("div");
          adminActions.className = "admin-actions-container";
          
          adminActions.innerHTML = `
            <button class="btn-admin-action btn-edit-book">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn-admin-action btn-delete-book">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          `;

          // تنفيذ التعديل مباشرة
          adminActions.querySelector(".btn-edit-book").addEventListener("click", async (e) => {
            e.stopPropagation();
            const newTitle = prompt("Edit Book Title:", b.title);
            if (newTitle === null) return;

            const newAuthor = prompt("Edit Author:", b.author);
            if (newAuthor === null) return;

            const newDescription = prompt("Edit Description:", b.description);
            if (newDescription === null) return;

            try {
              const bookRef = doc(db, "books", b.bookId);
              await updateDoc(bookRef, {
                title: newTitle.trim(),
                author: newAuthor.trim(),
                description: newDescription.trim(),
                updatedAt: serverTimestamp()
              });
              alert("✨ Book updated successfully!");
              location.reload();
            } catch (err) {
              console.error(err);
              alert("Error updating book: " + err.message);
            }
          });

          // تنفيذ الحذف مباشرة
          adminActions.querySelector(".btn-delete-book").addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${b.title}"?`)) {
              try {
                await deleteDoc(doc(db, "books", b.bookId));
                alert("🗑️ Book deleted successfully!");
                card.remove(); // إزالة الكارت من الصفحة فورًا
              } catch (err) {
                console.error(err);
                alert("Error deleting book: " + err.message);
              }
            }
          });

          card.appendChild(adminActions);
        }

        // فتح الكتاب عند النقر على الكارت
        card.addEventListener("click", () => {
          if (window.openStoryModal) {
            window.openStoryModal(b.title, b.description, b.coverUrl, b.author);
          }
        });

        shelf.appendChild(card);
      });
    });

  } catch (error) { 
    console.warn("Could not load uploaded books", error); 
  }
}
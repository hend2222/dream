import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_UID = "LNghcfytsiU2x627gt4iAzPFaFH3";

document.addEventListener("DOMContentLoaded", () => {
    const books = document.querySelectorAll(".book-card");

    // التحقق من صلاحيات المشرفة لإظهار أزرار التحكم
    onAuthStateChanged(auth, user => {
        const isAdmin = user && user.uid === ADMIN_UID;

        books.forEach(book => {
            const title = book.getAttribute("data-title") || "Book";
            const bookId = book.getAttribute("data-id"); // تأكدي أن بطاقة الكتاب تحتوي على data-id الخاص به من قاعدة البيانات
            const author = book.getAttribute("data-author") || "";
            const description = book.getAttribute("data-description") || "";

            // إذا كانت المشرفة مسجلة الدخول، أضف أزرار التعديل والحذف إذا لم تكن موجودة مسبقاً
            if (isAdmin && bookId && !book.querySelector(".admin-actions-container")) {
                const adminDiv = document.createElement("div");
                adminDiv.className = "admin-actions-container";
                adminDiv.style.cssText = "margin-top: 10px; display: flex; gap: 8px; justify-content: center;";
                
                adminDiv.innerHTML = `
                    <button onclick="event.stopPropagation(); editBook('${bookId}', '${author}', '${description}')" style="background-color: #f5a623; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                        <i class="fa-solid fa-pen"></i> تعديل
                    </button>
                    <button onclick="event.stopPropagation(); deleteBook('${bookId}')" style="background-color: #d9534f; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                        <i class="fa-solid fa-trash"></i> حذف
                    </button>
                `;
                book.appendChild(adminDiv);
            }

            // الحدث الأصلي للنقر على الكتاب (فتح القصة)
            book.addEventListener("click", () => {
                alert(`📖 Opening "${title}" story page...`);
                // window.location.href = `story.html?title=${title}`;
            });
        });
    });
});
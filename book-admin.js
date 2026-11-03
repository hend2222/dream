import { auth, db, supabase } from "./firebase-config.js";

import { showToast } from "./notifications.js";



import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";



import {

  doc,

  setDoc,

  updateDoc,

  deleteDoc,

  serverTimestamp,

  collection, getDocs, getDoc

} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";



const ADMIN_UID = "LNghcfytsiU2x627gt4iAzPFaFH3";



const form = document.getElementById("bookUploadForm");

const status = document.getElementById("uploadStatus");

const studio = document.querySelector(".book-studio");



let allowed = false;

let authChecked = false;



if (studio) studio.style.display = "none";



function showAccessMessage(message) {

  if (!studio) return;

  studio.style.display = "block";



  studio.innerHTML = `

    <div style="text-align:center;padding:45px 20px;">

      <i class="fa-solid fa-lock" style="font-size:48px;color:#f5a623;"></i>

      <h2 style="color:#f5a623;margin:20px 0;">Access Restricted</h2>

      <p style="color:inherit;">${message}</p>

      <a href="login.html" class="btn-read-now"

         style="display:inline-block;text-decoration:none;margin-top:20px;">

        Sign In

      </a>

      <a href="home.html"

         style="display:block;margin-top:15px;color:inherit;">

        Back to Home

      </a>

    </div>

  `;

}



// A callable permission check avoids a stale one-time Promise when Firebase first
// reports a signed-out state and later reports the signed-in administrator.
window.dwAdminReady = async function(user = auth.currentUser) {
  authChecked = true;
  allowed = false;
  try {
    if (!user) return false;
    if (user.uid === ADMIN_UID) {
      allowed = true;
    } else {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};
      allowed = userData.role === "admin" || userData.isAdmin === true;
    }
    return allowed;
  } catch (error) {
    console.error("Could not verify Book Studio permissions:", error);
    allowed = false;
    return false;
  }
};

onAuthStateChanged(auth, async user => {
  const isAllowed = await window.dwAdminReady(user);
  if (isAllowed) {
    if (studio) studio.style.display = "block";
    const denied = document.getElementById("unauthorizedMsg");
    if (denied) denied.style.display = "none";
  } else if (user) {
    showAccessMessage("This account is not marked as the site owner. Sign in with your owner account, or set role = admin on this account in Firestore users.");
  } else {
    // On pages without Book Studio, there is no access panel to replace.
    if (studio) showAccessMessage("Please sign in with the site-owner account.");
  }
});

const DEFAULT_CATEGORIES = [

  { id: "space-stars", name: "Space & Stars", color: "#477aa5", icon: "fa-rocket" },

  { id: "secret-kingdoms", name: "Secret Kingdoms", color: "#7b4da3", icon: "fa-hat-wizard" },

  { id: "time-portals", name: "Time Portals", color: "#b86c45", icon: "fa-hourglass-start" },

  { id: "kind-hearts", name: "Kind Hearts", color: "#a64f78", icon: "fa-hands-holding-child" },

  { id: "little-scientist", name: "Little Scientist", color: "#4b987d", icon: "fa-flask" },

  { id: "sleepy-star-dreams", name: "Sleepy Star Dreams", color: "#53618f", icon: "fa-cloud-moon" }

];

function categorySlug(value) {

  return String(value || "").toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "stories";

}

async function loadCategoryOptions() {

  const select = document.getElementById("bookCategory");

  if (!select) return;

  const all = [...DEFAULT_CATEGORIES];

  try {

    const snap = await getDocs(collection(db, "categories"));

    snap.forEach(item => {

      const data = item.data();

      if (data.name && !["fantasy", "values"].includes(item.id)) {

        const existingIndex = all.findIndex(c => c.id === item.id);

        const entry = { id: item.id, ...data };

        if (existingIndex >= 0) all[existingIndex] = { ...all[existingIndex], ...entry };

        else all.push(entry);

      }

    });

  } catch (error) {

    console.warn("Could not load custom categories from Firestore. Built-in six categories remain available.", error);

    showToast("The six built-in categories are available. Publish the Firestore categories read rule to load custom categories.", "warning", { duration: 4500 });

  }

  select.replaceChildren(...all.map(c => {

    const option = document.createElement("option");

    option.value = c.id; option.textContent = c.name;

    return option;

  }));

}



function safeFileName(name) {

  return name.replace(/[^a-zA-Z0-9._-]/g, "_");

}





async function upload(path, file) {

  const currentUser = auth.currentUser;



  if (!currentUser) {

    throw new Error("Please sign in first.");

  }



  const firebaseToken = await currentUser.getIdToken();



  const formData = new FormData();

  formData.append("file", file, file.name);

  formData.append("path", path);



  const { data, error } = await supabase.functions.invoke(

    "upload-book",

    {

      body: formData,

      headers: {

        Authorization: `Bearer ${firebaseToken}`

      }

    }

  );



  if (error) {

    throw new Error(error.message || "Supabase upload failed.");

  }



  if (!data?.success || !data?.url) {

    throw new Error(data?.error || "Upload failed.");

  }



  return data.url;

}





// Sequential image picker: each click opens a single-file chooser, then offers another.

function setupSequentialImagePicker(container, { buttonLabel = "＋ Add another image" } = {}) {

  const files = [];

  if (!container) return { getFiles: () => files, clear: () => { files.length = 0; render(); } };

  const list = document.createElement("div"); list.className = "dw-image-list";

  const add = document.createElement("button"); add.type = "button"; add.textContent = buttonLabel;

  container.replaceChildren(list, add);

  function render() {

    list.replaceChildren();

    files.forEach((file, index) => {

      const chip = document.createElement("div"); chip.className = "dw-image-chip";

      const preview = document.createElement("img"); preview.alt = ""; preview.src = URL.createObjectURL(file);

      const name = document.createElement("span"); name.textContent = `${index + 1}. ${file.name}`;

      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";

      remove.addEventListener("click", () => { files.splice(index, 1); render(); });

      chip.append(preview, name, remove); list.append(chip);

    });

    add.textContent = files.length ? `＋ Add another image (${files.length} selected)` : buttonLabel;

  }

  add.addEventListener("click", () => {

    const input = document.createElement("input"); input.type = "file";

    input.accept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"; input.hidden = true;

    input.addEventListener("change", () => {

      const file = input.files?.[0]; if (!file) return;

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {

        showToast("Choose a JPG, PNG, or WEBP image up to 8 MB.", "warning", { duration: 2300 }); return;

      }

      files.push(file); render();

    }, { once: true });

    container.append(input); input.click(); input.addEventListener("change", () => input.remove(), { once: true });

  });

  render();

  return { getFiles: () => [...files], clear: () => { files.length = 0; render(); } };

}



// ---------------------------------------------------------

// دالة حذف الكتاب (تستخدم فقط من قِبل المشرفة)

// ---------------------------------------------------------

window.deleteBook = async function(bookId) {

  const permissionGranted = await window.dwAdminReady(auth.currentUser);
  if (!permissionGranted) {

    alert("غير مسموح لك بإجراء عملية الحذف.");

    return;

  }



  if (confirm("هل أنت متأكدة من رغبتك في حذف هذا الكتاب نهائياً؟")) {

    try {

      await deleteDoc(doc(db, "books", bookId));

      alert("تم حذف الكتاب بنجاح!");

      location.reload();

    } catch (error) {

      console.error("Error deleting book:", error);

      alert("حدث خطأ أثناء محاولة الحذف: " + error.message);

    }

  }

};



// ---------------------------------------------------------

// دالة تعديل الكتاب (تحديث العنوان، المؤلف، أو الوصف)

// ---------------------------------------------------------

window.editBook = async function(bookId, currentTitle, currentAuthor, currentDescription) {

  const permissionGranted = await window.dwAdminReady(auth.currentUser);
  if (!permissionGranted) {

    alert("غير مسموح لك بالتعديل.");

    return;

  }

  document.getElementById("dw-edit-book-modal")?.remove();



  const overlay = document.createElement("div");

  overlay.id = "dw-edit-book-modal";

  overlay.innerHTML = `

    <section class="dw-edit-card" role="dialog" aria-modal="true" aria-labelledby="dw-edit-title">

      <button type="button" class="dw-edit-close" aria-label="Close">×</button>

      <div class="dw-edit-icon"><i class="fa-solid fa-book-open"></i></div>

      <p class="dw-edit-kicker">DREAMWINGS BOOK STUDIO</p>

      <h2 id="dw-edit-title">Edit your story</h2>

      <p class="dw-edit-subtitle">Give this little world a fresh touch ✨</p>

      <form class="dw-edit-form">

        <label>Book title<input name="title" maxlength="100" required></label>

        <label>Author<input name="author" maxlength="80" required></label>

        <label>Short description<textarea name="description" rows="3"></textarea></label>

        <label>Category<select name="category" class="dw-category-select"></select></label>

        <label>Story video (optional)<input name="storyVideo" type="file" accept="video/mp4,video/webm,video/ogg"></label>

        <label>Story text<textarea name="storyText" rows="7" placeholder="Write or update the complete story..."></textarea></label>

        <label>Story illustrations (optional; add one image at a time)

          <div class="dw-image-picker" data-edit-image-picker></div>

        </label>

        <small style="display:block;color:#d8c0ad;margin-top:-5px">Each selected image is added to the end of the sequence. If you add new images, they replace the previous illustration sequence when saved.</small>

        <p class="dw-edit-status" aria-live="polite"></p>

        <div class="dw-edit-buttons">

          <button type="button" class="dw-edit-cancel">Cancel</button>

          <button type="submit" class="dw-edit-save"><i class="fa-solid fa-wand-magic-sparkles"></i> Save changes</button>

        </div>

      </form>

    </section>`;

  const style = document.createElement("style");

  style.id = "dw-edit-book-style";

  style.textContent = `

    #dw-edit-book-modal { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:20px;

      background:rgba(16,10,8,.78); backdrop-filter:blur(9px); overflow:auto; }

    .dw-edit-card { width:min(100%,530px); box-sizing:border-box; padding:30px; position:relative;

      border:1px solid rgba(238,177,92,.55); border-radius:26px; color:#fff1df;

      background:linear-gradient(145deg,#38251f,#211614); box-shadow:0 25px 80px #0009;

      font-family:Quicksand,sans-serif; }

    .dw-edit-close { position:absolute; right:18px; top:14px; border:0; background:transparent; color:#f6d4ae; font-size:30px; cursor:pointer; }

    .dw-edit-icon { width:54px; height:54px; display:grid; place-items:center; border-radius:18px;

      background:#62402b; color:#ffc46e; font-size:23px; }

    .dw-edit-kicker { color:#e8a54c; letter-spacing:2px; font-size:10px; font-weight:700; margin:18px 0 5px; }

    .dw-edit-card h2 { color:#ffc46e; font:600 29px Fredoka,sans-serif; margin:0; }

    .dw-edit-subtitle { color:#d8c0ad; margin:7px 0 20px; font-size:13px; }

    .dw-edit-form label { display:block; color:#f5d6b8; font-weight:700; font-size:13px; margin:13px 0; }

    .dw-edit-form input,.dw-edit-form textarea,.dw-edit-form select { display:block; width:100%; box-sizing:border-box; margin-top:7px;

      border:1px solid #775441; border-radius:12px; padding:12px 14px; background:#1b1210; color:#fff4e8;

      font:500 14px Quicksand,sans-serif; outline:none; }

    .dw-edit-form input:focus,.dw-edit-form textarea:focus,.dw-edit-form select:focus { border-color:#e9aa53; box-shadow:0 0 0 3px #e9aa5322; }

    .dw-edit-form textarea { resize:vertical; line-height:1.6; }

    .dw-edit-form .dw-image-picker{display:grid;gap:9px;margin-top:8px}.dw-edit-form .dw-image-picker button{border:1px solid #bd8548;border-radius:18px;padding:10px 15px;background:#4a3024;color:#ffe0b1;font-weight:700;cursor:pointer}.dw-edit-form .dw-image-list{display:flex;flex-wrap:wrap;gap:8px}.dw-edit-form .dw-image-chip{display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid #876044;border-radius:12px;background:#2c1d18;color:#ffe8d0;font-size:12px}.dw-edit-form .dw-image-chip img{width:42px;height:42px;object-fit:cover;border-radius:7px}.dw-edit-form .dw-image-chip button{padding:4px 8px;background:#754137;border:0}

    .dw-edit-buttons { display:flex; justify-content:flex-end; gap:10px; margin-top:18px; }

    .dw-edit-buttons button { border:0; border-radius:22px; padding:12px 19px; cursor:pointer; font:700 13px Quicksand,sans-serif; }

    .dw-edit-cancel { color:#f1d9c6; background:#5a4036; }

    .dw-edit-save { color:#321b11; background:linear-gradient(135deg,#f5c477,#df8c36); }

    .dw-edit-status { min-height:18px; color:#ffc46e; font-size:12px; }

    @media(max-width:520px){ .dw-edit-card{padding:24px 18px;} .dw-edit-buttons{flex-direction:column-reverse;} }

  `;

  document.head.appendChild(style);

  document.body.appendChild(overlay);



  const form = overlay.querySelector("form");

  form.elements.title.value = currentTitle;

  form.elements.author.value = currentAuthor;

  form.elements.description.value = currentDescription;

  await loadCategoryOptions();

  const editCategorySelect = form.elements.category;

  const editCategories = [...DEFAULT_CATEGORIES];

  try {

    const categorySnap = await getDocs(collection(db, "categories"));

    categorySnap.forEach(item => { if (item.data().name && !editCategories.some(c => c.id === item.id)) editCategories.push({ id:item.id, ...item.data() }); });

  } catch (error) { console.warn("Could not load edit categories", error); }

  editCategorySelect.replaceChildren(...editCategories.map(category => {

    const option = document.createElement("option"); option.value = category.id; option.textContent = category.name; return option;

  }));

  let existingIllustrations = [];

  try {

    const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    const existing = await getDoc(doc(db, "books", bookId));

    if (existing.exists()) {

      form.elements.storyText.value = existing.data().storyText || "";

      editCategorySelect.value = existing.data().category || "fantasy";

      existingIllustrations = existing.data().illustrationUrls || existing.data().storyIllustrations || existing.data().illustrations || [];

    }

  } catch (error) { console.warn("Could not load story text for editing", error); }

  const editImagePicker = setupSequentialImagePicker(form.querySelector("[data-edit-image-picker]"));

  const illustrationNote = document.createElement("small");

  illustrationNote.style.cssText = "display:block;color:#d8c0ad;margin:6px 0";

  illustrationNote.textContent = `${existingIllustrations.length} illustration(s) currently saved. Leave the upload empty to keep them.`;

  form.querySelector("[data-edit-image-picker]").appendChild(illustrationNote);



  const close = () => { overlay.remove(); style.remove(); };

  overlay.querySelector(".dw-edit-close").onclick = close;

  overlay.querySelector(".dw-edit-cancel").onclick = close;

  overlay.addEventListener("click", event => { if (event.target === overlay) close(); });

  form.addEventListener("submit", async event => {

    event.preventDefault();

    if (!allowed) return;

    const save = form.querySelector(".dw-edit-save");

    const status = form.querySelector(".dw-edit-status");

    const title = form.elements.title.value.trim();

    const author = form.elements.author.value.trim();

    const description = form.elements.description.value.trim();

    const storyText = form.elements.storyText.value.trim();

    const illustrationFiles = editImagePicker.getFiles();

    const videoFile = form.elements.storyVideo.files[0];

    if (!title || !author) { status.textContent = "Please add a title and author."; return; }

    save.disabled = true;

    status.textContent = "Saving your changes…";

    try {

      let illustrationUrls = existingIllustrations;

      let videoUrl = "";

      if (videoFile) {

        if (!videoFile.type.startsWith("video/") || videoFile.size > 250 * 1024 * 1024) throw new Error("Choose a video up to 250 MB.");

        status.textContent = "Uploading story video…";

        videoUrl = await upload(`books/${bookId}/video-${safeFileName(videoFile.name)}`, videoFile);

      }

      if (illustrationFiles.length) {

        if (illustrationFiles.some(file => !["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024)) {

          throw new Error("Each illustration must be JPG, PNG, or WEBP and no larger than 8 MB.");

        }

        illustrationUrls = [];

        for (let index = 0; index < illustrationFiles.length; index++) {

          status.textContent = `Uploading illustration ${index + 1} of ${illustrationFiles.length}…`;

          const file = illustrationFiles[index];

          illustrationUrls.push(await upload(`books/${bookId}/illustration-${index + 1}-${safeFileName(file.name)}`, file));

        }

      }

      await updateDoc(doc(db, "books", bookId), {

        title, author, description, storyText, category: editCategorySelect.value || "fantasy", illustrationUrls, ...(videoUrl ? { videoUrl } : {}), updatedAt: serverTimestamp()

      });

      showToast("Your book has been updated successfully!", "success", { duration: 2200 });

      setTimeout(() => location.reload(), 500);

    } catch (error) {

      console.error("Error updating book:", error);

      status.textContent = "Couldn't save changes: " + error.message;

      save.disabled = false;

    }

  });

};



// رفع كتاب جديد

if (form) {

  await loadCategoryOptions();

  document.getElementById("addCategoryButton")?.addEventListener("click", async () => {

    const name = document.getElementById("newCategoryName").value.trim();

    if (!name) return showToast("Please enter a category name.", "warning", { duration: 2000 });

    const id = categorySlug(name);

    try {

      const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

      const existing = await getDoc(doc(db, "categories", id));

      if (existing.exists() || DEFAULT_CATEGORIES.some(c => c.id === id)) return showToast("This category already exists.", "warning", { duration: 2100 });

      const colors = ["#7b4da3", "#4b987d", "#b86c45", "#477aa5", "#a64f78", "#8b7a3c"];

      const icons = ["fa-wand-magic-sparkles", "fa-book-open", "fa-star", "fa-leaf", "fa-moon", "fa-compass"];

      const color = colors[Math.floor(Math.random() * colors.length)];

      const icon = icons[Math.floor(Math.random() * icons.length)];

      await setDoc(doc(db, "categories", id), { name, color, icon, createdAt: serverTimestamp() });

      await loadCategoryOptions(); document.getElementById("bookCategory").value = id;

      document.getElementById("newCategoryName").value = "";

      showToast("New category added! ✨", "success", { duration: 2100 });

    } catch (error) { showToast("Could not add category: " + error.message, "error"); }

  });

  const illustrationPicker = setupSequentialImagePicker(document.getElementById("bookIllustrationPicker"));

  form.addEventListener("submit", async event => {

    event.preventDefault();



    if (

      !authChecked ||

      !allowed ||

      !auth.currentUser

    ) {

      status.textContent = "You are not authorized to upload books.";

      return;

    }



    const title = document.getElementById("bookTitle").value.trim();

    const author = document.getElementById("bookAuthor").value.trim();

    const description = document.getElementById("bookDescription").value.trim();

    const storyText = document.getElementById("bookStoryText").value.trim();



    const cover = document.getElementById("bookCover").files[0];

    const audio = document.getElementById("bookAudio").files[0];

    const video = document.getElementById("bookVideo")?.files[0];

    const category = document.getElementById("bookCategory")?.value || "fantasy";

    const illustrationFiles = illustrationPicker.getFiles();



    if (!title || !author || !cover || !storyText) {

      status.textContent = "Please enter the title, author, story text, and cover image.";

      return;

    }



    if (

      cover.size > 8 * 1024 * 1024 ||

      (audio && audio.size > 50 * 1024 * 1024) || (video && video.size > 250 * 1024 * 1024) ||

      illustrationFiles.some(file => file.size > 8 * 1024 * 1024)

    ) {

      status.textContent = "Cover and illustrations must be max 8 MB each; optional audio must be max 50 MB; optional video must be max 250 MB.";

      return;

    }



    if (

      !["image/jpeg", "image/png", "image/webp"].includes(cover.type) ||

      illustrationFiles.some(file => !["image/jpeg","image/png","image/webp"].includes(file.type))

    ) {

      status.textContent = "The cover and illustrations must be JPG, PNG, or WEBP.";

      return;

    }



    try {

      status.textContent = "Uploading cover…";



      const slug = title

        .toLowerCase()

        .replace(/[^\p{L}\p{N}]+/gu, "-")

        .replace(/^-|-$/g, "") || "book";



      const id = `${Date.now()}-${slug}`;



      const coverUrl = await upload(

        `books/${id}/cover-${safeFileName(cover.name)}`,

        cover

      );



      const illustrationUrls = [];

      for (let index = 0; index < illustrationFiles.length; index++) {

        status.textContent = `Uploading illustration ${index + 1} of ${illustrationFiles.length}…`;

        const file = illustrationFiles[index];

        illustrationUrls.push(await upload(

          `books/${id}/illustration-${index + 1}-${safeFileName(file.name)}`,

          file

        ));

      }



      let audioUrl = "";

      let videoUrl = "";



      if (audio) {

        status.textContent = "Uploading audio…";



        audioUrl = await upload(

          `books/${id}/audio-${safeFileName(audio.name)}`,

          audio

        );

      }



      if (video) {

        if (!video.type.startsWith("video/")) throw new Error("Please choose a valid video file.");

        status.textContent = "Uploading story video…";

        videoUrl = await upload(`books/${id}/video-${safeFileName(video.name)}`, video);

      }



      if (!allowed) {

        throw new Error("Admin authorization expired.");

      }



      status.textContent = "Saving book details…";



      await setDoc(doc(db, "books", id), {

        bookId: id,

        title,

        author,

        description,

        storyText,

        coverUrl,

        audioUrl,

        videoUrl,

        illustrationUrls,

        category,

        createdAt: serverTimestamp(),

        createdBy: auth.currentUser.uid

      });



      form.reset();

      illustrationPicker.clear();

      showToast("Your book was added successfully! ✨", "success", { duration: 2300 });

      status.textContent = "";



    } catch (error) {

      console.error("Book upload error:", error);

      status.textContent = `Upload failed: ${error.message}`;

    }

  });

}
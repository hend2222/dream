import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const bookId = new URLSearchParams(location.search).get("id");
let book = null, pages = [], currentPage = -1;
const audio = $("bookNarration");

function getStory(data) {
  // Support older documents that may have used a different story field name.
  const candidates = [data.storyText, data.story, data.content, data.fullStory, data.storyContent];
  return candidates.find(value => typeof value === "string" && value.trim())?.trim() || "";
}

function makePages(text) {
  const paragraphs = String(text || "").replace(/\r/g, "").split(/\n+/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let page = "", limit = 520;
  for (const paragraph of paragraphs) {
    let remaining = paragraph;
    while (remaining.length) {
      const separator = page ? "\n\n" : "";
      const room = limit - page.length - separator.length;
      if (remaining.length <= room) {
        page += separator + remaining;
        remaining = "";
      } else {
        let cut = remaining.lastIndexOf(" ", Math.max(1, room));
        if (cut < room * .55) cut = room;
        const piece = remaining.slice(0, cut).trim();
        page += separator + piece;
        if (page.trim()) chunks.push(page.trim());
        page = "";
        remaining = remaining.slice(cut).trim();
      }
    }
    if (page.length > limit * .75) { chunks.push(page.trim()); page = ""; }
  }
  if (page.trim()) chunks.push(page.trim());
  return chunks;
}
function fillPage(element, text) {
  element.replaceChildren();
  (text || "").split(/\n\n+/).filter(Boolean).forEach(paragraph => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    p.dir = "auto";
    element.appendChild(p);
  });
}
function updateControls() {
  $("prevPage").disabled = currentPage <= 0;
  $("nextPage").disabled = currentPage >= pages.length - 1;
  $("pageProgress").textContent = `Story page ${currentPage + 1} of ${pages.length}`;
  $("progressFill").style.width = `${((currentPage + 1) / Math.max(pages.length,1)) * 100}%`;
}
function showPage(animate = false) {
  if (currentPage < 0 || !pages.length) return;
  const pageIndex = currentPage;
  fillPage($("leftText"), pages[pageIndex] || "");
  $("leftNumber").textContent = String(pageIndex + 1);
  $("rightNumber").textContent = "";
  const illustrationList = Array.isArray(book.illustrationUrls) ? book.illustrationUrls : (Array.isArray(book.storyIllustrations) ? book.storyIllustrations : (Array.isArray(book.illustrations) ? book.illustrations : []));
  const illustration = illustrationList[pageIndex];
  const image = $("pageIllustration");
  const placeholder = $("illustrationPlaceholder");
  if (illustration) {
    const candidate = new Image();
    candidate.onload = async () => {
      try { if (candidate.decode) await candidate.decode(); } catch (_) {}
      if (currentPage !== pageIndex) return;
      image.src = illustration;
      image.alt = `Illustration for page ${pageIndex + 1}`;
      image.hidden = false;
      placeholder.hidden = true;
    };
    candidate.onerror = () => {
      if (currentPage !== pageIndex) return;
      image.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = "This illustration link is no longer available. Re-upload it from Edit.";
    };
    candidate.src = illustration;
  } else {
    image.onerror = null;
    image.onload = null;
    image.removeAttribute("src");
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>Your story illustration will appear here';
  }
  $("cover").hidden = true;
  $("openBook").hidden = false;
  $("prevPage").hidden = false;
  $("nextPage").hidden = false;
  if (animate) {
    const turn = $("pageTurn");
    turn.classList.remove("turning");
    void turn.offsetWidth;
    turn.classList.add("turning");
  }
  updateControls();
}
function setStatus(message) { $("readerStatus").textContent = message; }

async function loadBook() {
  if (!bookId) { $("loading").textContent = "No story was selected."; return; }
  try {
    const snapshot = await getDoc(doc(db, "books", bookId));
    if (!snapshot.exists()) { $("loading").textContent = "This book could not be found."; return; }
    book = snapshot.data();
    $("loading").hidden = true;
    $("reader").hidden = false;
    $("bookTitle").textContent = book.title || "Untitled Story";
    $("bookAuthor").textContent = book.author ? `A story by ${book.author}` : "A DreamWings story";
    $("coverTitle").textContent = book.title || "Untitled Story";
    $("coverAuthor").textContent = book.author || "DreamWings";
    if (book.coverUrl) { $("bookCover").src = book.coverUrl; $("bookCover").hidden = false; }
    else $("bookCover").hidden = true;
    $("cover").hidden = false;
    $("openBook").hidden = true;
    $("prevPage").hidden = true;
    $("nextPage").hidden = true;

    const story = getStory(book);
    if (story) {
      pages = makePages(story);
      $("startReading").hidden = false;
      $("startReading").disabled = false;
      $("startReading").addEventListener("click", () => {
        currentPage = 0;
        showPage(true);
        $("startReading").hidden = true;
        setStatus("Your story has begun. Enjoy reading! ✨");
      });
      $("nextPage").addEventListener("click", () => {
        if (currentPage < pages.length - 1) { currentPage++; showPage(true); }
      });
      $("prevPage").addEventListener("click", () => {
        if (currentPage > 0) { currentPage--; showPage(true); }
      });
    } else {
      $("startReading").hidden = true;
      $("openBook").hidden = true;
      setStatus("This book has no text story yet. The owner can add it from Edit in the Fantasy collection or Book Studio.");
    }

    const videoSection = $("storyVideoSection");
    const storyVideo = $("storyVideo");
    if (book.videoUrl) {
      storyVideo.src = book.videoUrl;
      videoSection.hidden = false;
      storyVideo.load();
    } else {
      storyVideo.pause(); storyVideo.removeAttribute("src"); storyVideo.load();
      videoSection.hidden = true;
    }

    // Play ONLY the audio file uploaded by the site owner. No browser speech or auto-play.
    if (book.audioUrl) {
      audio.src = book.audioUrl;
      $("playNarration").hidden = false;
      $("pauseNarration").hidden = false;
      $("playNarration").addEventListener("click", async () => {
        try { await audio.play(); setStatus("Playing the narration uploaded for this book."); }
        catch (error) { setStatus("Couldn't play the uploaded audio. Check the audio file URL."); }
      });
      $("pauseNarration").addEventListener("click", () => {
        audio.pause();
        setStatus("Narration paused.");
      });
      audio.addEventListener("ended", () => setStatus("Narration finished."));
      audio.addEventListener("error", () => setStatus("The uploaded audio file could not be loaded."));
    } else {
      $("playNarration").hidden = true;
      $("pauseNarration").hidden = true;
    }
    document.title = `${book.title || "Story"} - DreamWings`;
  } catch (error) {
    console.error("Error loading book:", error);
    $("loading").textContent = "Could not load this story. Please try again.";
  }
}
window.addEventListener("pagehide", () => { audio?.pause(); });
loadBook();

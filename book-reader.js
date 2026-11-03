import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const demoStory = `Benny Bear looked up at the sleepy star. “You seem lonely,” he whispered.
The little star twinkled softly. Benny climbed the hill and shared his warm blanket.
Together they watched the moon rise, learning that friendship makes every night brighter.
And from that night on, the sleepy star always had a friend to shine for.`;

const $ = id => document.getElementById(id);

let currentStory = demoStory;
let listenStartedAt = 0;
let activeAudio = $("storyAudioPlayer");

// Open the story in a separate page
$("listenReadBtn")?.addEventListener("click", () => {
  const id =
    document.querySelector("[data-favorite-toggle]")?.dataset.bookId || "";

  if (!id) {
    alert("Could not find this book. Please try again.");
    return;
  }

  window.location.href = `reader.html?id=${encodeURIComponent(id)}`;
});

// Browser text-to-speech has intentionally been removed. Only uploaded narration audio may play.\n\nfunction saveListeningMinutes() {
  if (!listenStartedAt) return;

  const mins = Math.max(
    1,
    Math.round((Date.now() - listenStartedAt) / 60000)
  );

  const uid = localStorage.getItem("dreamwings:activeUid");

  if (uid) {
    const key = `dreamwings:listening:${uid}`;
    const total = Number(localStorage.getItem(key) || 0) + mins;
    localStorage.setItem(key, String(total));
  }

  listenStartedAt = 0;
}

activeAudio?.addEventListener("play", () => {
  listenStartedAt = Date.now();
});

activeAudio?.addEventListener("ended", saveListeningMinutes);

$("speechStopBtn")?.addEventListener("click", () => {
  saveListeningMinutes();
  activeAudio?.pause();

  if ($("readerStatus")) {
    $("readerStatus").textContent = "Playback stopped.";
  }
});
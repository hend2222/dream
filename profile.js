import { showToast } from "./notifications.js";
import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const avatarDefaults = ["🦊", "🐻", "🦉", "🐱", "🦋", "🦄", "🐼", "🐰"];

let currentUser = null;
let selectedEmoji = "🦊";
let selectedPhoto = "";

function showAvatar(photo, emoji) {
  for (const id of ["profileHeroAvatar", "profileEditAvatar"]) {
    const el = $(id);
    if (!el) continue;

    el.style.backgroundImage = photo ? `url("${photo}")` : "none";
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.textContent = photo ? "" : (emoji || "🦊");
    el.style.display = "grid";
    el.style.placeItems = "center";
    el.style.fontSize = photo ? "0" : "58px";
  }
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  selectedPhoto = "";

  showAvatar("", emoji);

  document.querySelectorAll(".avatar-choice").forEach(button => {
    button.classList.toggle("selected", button.dataset.avatar === emoji);
  });

  if ($("avatarUpload")) $("avatarUpload").value = "";
  saveProfile();
}

function setStatus(message, error = false) {
  const status = $("profileSaveStatus");
  if (!status) return;

  status.textContent = message;
  status.style.color = error ? "#ffb4a8" : "#dfcfc5";
}

async function saveProfile() {
  if (!currentUser) return;

  try {
    setStatus("Saving your profile...");

    await setDoc(doc(db, "users", currentUser.uid), {
      displayName: currentUser.displayName || "",
      avatarEmoji: selectedEmoji,
      avatarPhoto: selectedPhoto,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setStatus("Your profile has been saved successfully ✨");
  } catch (error) {
    console.error("Profile save error:", error);
    setStatus("Couldn't save your profile. Please try again.", true);
  }
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5 MB.");
  }

  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  const maxSize = 256;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  image.close();

  return canvas.toDataURL("image/jpeg", 0.65);
}

async function uploadAvatar(file) {
  try {
    setStatus("Preparing your picture...");

    selectedPhoto = await compressImage(file);
    showAvatar(selectedPhoto, selectedEmoji);

    document.querySelectorAll(".avatar-choice").forEach(button => {
      button.classList.remove("selected");
    });

    await saveProfile();
  } catch (error) {
    console.error("Avatar upload error:", error);
    setStatus(error.message || "Couldn't use this picture.", true);
  }
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const snapshot = await getDoc(doc(db, "users", user.uid));
    const data = snapshot.exists() ? snapshot.data() : {};

    selectedEmoji = data.avatarEmoji || "🦊";
    selectedPhoto = data.avatarPhoto || "";

    const name = data.displayName || user.displayName || user.email?.split("@")[0] || "Reader";

    if ($("profileUserName")) {
      $("profileUserName").textContent = `Welcome, ${name}! 🧡`;
    }

    showAvatar(selectedPhoto, selectedEmoji);

    document.querySelectorAll(".avatar-choice").forEach(button => {
      button.classList.toggle("selected", button.dataset.avatar === selectedEmoji);
    });
  } catch (error) {
    console.error("Profile loading error:", error);
    setStatus("Couldn't load your saved profile.", true);
  }
});

document.querySelectorAll(".avatar-choice").forEach(button => {
  button.addEventListener("click", () => {
    selectEmoji(button.dataset.avatar);
  });
});

$("avatarUpload")?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) uploadAvatar(file);
});

window.handleLogout = async function () {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    showToast("We could not sign you out. Please try again.", "error");
  }
};
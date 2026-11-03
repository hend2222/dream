import { auth, db } from "./firebase-config.js";
import { showToast, queueToast } from "./notifications.js";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, reload, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
function notify(message, type = "error") { showToast(message, type); }
const form = document.querySelector("#login-form");
if (form) form.addEventListener("submit", async event => {
  event.preventDefault();
  const email = document.querySelector("#email").value.trim().toLowerCase();
  const password = document.querySelector("#password").value;
  if (!email || !password) return notify("Please enter your email and password.");
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await reload(user);
    if (!user.emailVerified) { await sendEmailVerification(user); await signOut(auth); return notify("Please verify your email first. We sent you a new verification link.", "warning"); }
    queueToast("Welcome back! Your reading adventure is ready.", "success", "Welcome to DreamWings");
    window.location.replace("home.html");
  } catch (error) {
    console.error(error);
    notify(error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password" ? "Incorrect email or password." : error.code === "auth/too-many-requests" ? "Too many attempts. Please try again later." : "Login failed. Please try again.");
  }
});
const googleButton = document.querySelector("#google-btn");
if (googleButton) googleButton.addEventListener("click", async () => {
  try {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    const ref = doc(db, "users", user.uid); const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { username: user.displayName || "DreamWings Reader", email: user.email, profilePic: user.photoURL || "", createdAt: new Date() });
    queueToast("You are signed in with Google. Enjoy exploring!", "success", "You’re in!");
    window.location.replace("home.html");
  } catch (error) { console.error(error); notify(error.code === "auth/popup-closed-by-user" ? "The sign-in window was closed before finishing." : "Google sign-in failed. Please try again.", "error"); }
});

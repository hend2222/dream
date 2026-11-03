import { showToast } from "./notifications.js";

import { db, auth } from "./firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";

// EmailJS settings
const EMAILJS_SERVICE_ID = "service_w6fgbub";
const EMAILJS_TEMPLATE_ID = "template_un06ljz";
const EMAILJS_PUBLIC_KEY = "g9k-qL-hziIzzvWIp";

const form = document.getElementById("contactForm");

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const f = e.currentTarget;
    const btn = f.querySelector('[type="submit"]');

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const subject = document.getElementById("contactSubject").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    if (!name || !email || !subject || !message) {
      showToast("Please complete all fields before sending your message.", "warning");
      return;
    }

    if (btn) btn.disabled = true;

    let saved = false;

    try {
      // Save message in Firestore
      await addDoc(collection(db, "contactMessages"), {
        name,
        email,
        subject,
        message,
        uid: auth.currentUser?.uid || null,
        createdAt: serverTimestamp(),
        status: "new"
      });

      saved = true;

      // Send message through EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: name,
          from_email: email,
          subject: subject,
          message: message
        },
        {
          publicKey: EMAILJS_PUBLIC_KEY
        }
      );

      f.reset();
      showToast("Your message has been saved and sent to the DreamWings team.", "success", "Message sent");

    } catch (err) {
      console.error("Contact form error:", err);

      if (saved) {
        showToast("Your message was saved, but the email could not be delivered. Please contact us again later.", "warning");
      } else {
        showToast("We could not save your message. Please try again.", "error");
      }

    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

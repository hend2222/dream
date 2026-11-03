
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const firebaseConfig = {
  apiKey: "AIzaSyAxQFWz1D_e2_vugrSFvOzxXfa3gJOzTg8",
  authDomain: "dreamwings-2777e.firebaseapp.com",
  projectId: "dreamwings-2777e",
  storageBucket: "dreamwings-2777e.firebasestorage.app",
  messagingSenderId: "1075351784527",
  appId: "1:1075351784527:web:f3b23e7c8982635b822e3a",
  measurementId: "G-WSEWCFB890"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const supabase = createClient(
  "https://kydbqjbsgwcklsqsoyrf.supabase.co",
  "sb_publishable_4bYgmsNSF8Hv72iYFFekhQ_ujV2YOvo",
  {
    accessToken: async () => {
      return (await auth.currentUser?.getIdToken()) ?? null;
    }
  }
);

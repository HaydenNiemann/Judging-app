import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAyKB2ssAwZwoEajlTOy5WzIWqqUoZgJQ",
  authDomain: "judging-site.firebaseapp.com",
  projectId: "judging-site",
  storageBucket: "judging-site.appspot.com",
  messagingSenderId: "174651417081",
  appId: "1:174651417081:web:f7ec8a824593ab363f5d28",
  measurementId: "G-SBZX4H0V40"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('judgingForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const judgeName = document.getElementById('judgeName').value.trim();
  if (!/^\S+\s+\S+/.test(judgeName)) {
    showMessage("⚠️ Please enter both first and last name.");
    return;
  }

  const fullName = document.getElementById('presenterSelect').value;
  if (!fullName) {
    showMessage("⚠️ Please select a presenter.");
    return;
  }

  const category = window.getPresenterCategory(fullName);
  if (!category) {
    showMessage("⚠️ Could not determine presenter category.");
    return;
  }

  const [firstName, lastName] = fullName.split(" ");

  const scoreData = {
    firstName,
    lastName,
    category,
    judge: judgeName,
    scores: {
      cat1: parseInt(document.getElementById('cat1').value),
      cat2: parseInt(document.getElementById('cat2').value),
      cat3: parseInt(document.getElementById('cat3').value)
    },
    timestamp: new Date()
  };

  try {
    await addDoc(collection(db, "scores"), scoreData);
    showMessage("✅ Score submitted!");
    form.reset();
    $('#presenterSelect').val('').trigger('change');
  } catch (error) {
    console.error("Error submitting score:", error);
    showMessage("❌ Something went wrong. Please try again.");
  }
});

function showMessage(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  toast.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 4000);
}

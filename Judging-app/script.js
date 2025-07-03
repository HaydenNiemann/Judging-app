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

  const fullName = document.getElementById('presenterSelect').value;
  const [firstName, lastName] = fullName.split(" ");
  const judgeName = document.getElementById('judgeName').value;

  const scoreData = {
    firstName,
    lastName,
    judge: judgeName,
    scores: {
      cat1: parseInt(document.getElementById('cat1').value),
      cat2: parseInt(document.getElementById('cat2').value),
      cat3: parseInt(document.getElementById('cat3').value),
      cat4: parseInt(document.getElementById('cat4').value)
    },
    timestamp: new Date()
  };

  try {
    await addDoc(collection(db, "scores"), scoreData);
    alert('Score submitted!');
    form.reset();
  } catch (error) {
    console.error("Error submitting score:", error);
    alert('Something went wrong. Please try again.');
  }
});

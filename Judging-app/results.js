/* ---------- Firebase SDK imports ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ---------- Firebase config ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyDAyKB2ssAwZwoEajlTOy5WzIWqqUoZgJQ",
  authDomain: "judging-site.firebaseapp.com",
  projectId:  "judging-site",
  storageBucket: "judging-site.appspot.com",
  messagingSenderId: "174651417081",
  appId: "1:174651417081:web:f7ec8a824593ab363f5d28"
};
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

/* ---------- Allowed users (hard-coded) ---------- */
const allowedEmails = [
  "albinosrule93@gmail.com",
  "batoon.lena@mayo.edu"
];

/* ---------- DOM references ---------- */
const emailInput       = document.getElementById("email");
const passwordInput    = document.getElementById("password");
const loginBtn         = document.getElementById("loginBtn");
const loginSection     = document.getElementById("loginSection");
const resultsContainer = document.getElementById("resultsContainer");

/* ---------- Login button ---------- */
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

/* ---------- Auth state listener ---------- */
onAuthStateChanged(auth, (user) => {
  if (user && allowedEmails.includes(user.email)) {
    loginSection.style.display  = "none";
    resultsContainer.style.display = "block";
    loadResults();
  } else {
    if (user) {             // logged in but not authorised
      alert("Access denied.");
      signOut(auth);
    }
    loginSection.style.display  = "block";
    resultsContainer.style.display = "none";
  }
});

/* ---------- Load + render results ---------- */
function loadResults() {
  onSnapshot(collection(db, "scores"), (snapshot) => {
    const grouped = {};
    snapshot.forEach((d) => {
      const data = d.data();
      const key  = `${data.firstName} ${data.lastName}`;
      (grouped[key] ||= []).push(data);
    });

    /* Clear previous render */
    resultsContainer.innerHTML = "";

    /* Track totals to find winner(s) */
    const presenterTotals = {};

    /* Render each presenter */
    Object.keys(grouped).sort().forEach((presenter) => {
      const scores = grouped[presenter];
      let totalScore = 0;

      const section = document.createElement("section");
      section.innerHTML = `<h3>${presenter}</h3>`;

      /* Build table rows */
      const rows = scores.map((e) => {
        const c1 = e.scores?.cat1 ?? 0;
        const c2 = e.scores?.cat2 ?? 0;
        const c3 = e.scores?.cat3 ?? 0;
        const c4 = e.scores?.cat4 ?? 0;
        const entryTotal = c1 + c2 + c3 + c4;
        totalScore += entryTotal;

        return `
          <tr>
            <td>${c1}</td><td>${c2}</td><td>${c3}</td><td>${c4}</td>
            <td>${new Date(e.timestamp.seconds * 1000).toLocaleString()}</td>
            <td>${e.judge ?? "Unknown"}</td>
          </tr>`;
      }).join("");

      /* Table markup */
      section.insertAdjacentHTML(
        "beforeend",
        `<div class="table-wrapper">
           <table>
             <thead>
               <tr>
                 <th>Cat&nbsp;1</th><th>Cat&nbsp;2</th><th>Cat&nbsp;3</th><th>Cat&nbsp;4</th>
                 <th>Submitted</th><th>Judge</th>
               </tr>
             </thead>
             <tbody>${rows}</tbody>
           </table>
         </div>`
      );

      /* Total display under the table */
      section.insertAdjacentHTML(
        "beforeend",
        `<p style="font-weight:bold;text-align:center;margin-top:0.4rem">
           Total Score: ${totalScore} (${scores.length} Judge${scores.length!==1?'s':''})
         </p>`
      );

      resultsContainer.appendChild(section);
      presenterTotals[presenter] = totalScore;
    });

    /* ---------- Winner banner ---------- */
    if (Object.keys(presenterTotals).length) {
      const max = Math.max(...Object.values(presenterTotals));
      const winners = Object.keys(presenterTotals).filter(p => presenterTotals[p] === max);
      const bannerText = winners.length === 1
        ? `🏆 Highest Score: ${winners[0]} (${max})`
        : `🏆 Highest Score (Tie): ${winners.join(", ")} (${max})`;

      const banner = document.createElement("div");
      banner.style.cssText = "margin:3rem auto 1rem;text-align:center;font-size:1.25rem;font-weight:bold;";
      banner.textContent = bannerText;
      resultsContainer.appendChild(banner);
    }
  });
}

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

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDAyKB2ssAwZwoEajlTOy5WzIWqqUoZgJQ",
  authDomain: "judging-site.firebaseapp.com",
  projectId: "judging-site",
  storageBucket: "judging-site.appspot.com",
  messagingSenderId: "174651417081",
  appId: "1:174651417081:web:f7ec8a824593ab363f5d28"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Allowed admins
const allowedEmails = [
  "albinosrule93@gmail.com",
  "batoon.lena@mayo.edu"
];

// ✅ DOM elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginSection = document.getElementById("loginSection");
const resultsContainer = document.getElementById("resultsContainer");

// ✅ Login event
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// ✅ Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user && allowedEmails.includes(user.email)) {
    loginSection.style.display = "none";
    resultsContainer.style.display = "block";
    loadResults();
  } else {
    if (user) {
      alert("Access denied.");
      signOut(auth);
    }
    loginSection.style.display = "block";
    resultsContainer.style.display = "none";
  }
});

// ✅ Normalize category (handles variations like RTP_AH → postdoc)
function normalizeCategory(raw) {
  raw = (raw || "").toLowerCase();
  if (raw.includes("student")) return "student";
  if (raw.includes("postdoc") || raw.includes("rtp")) return "postdoc";
  return "unknown";
}

// ✅ Load results and calculate winners
function loadResults() {
  onSnapshot(collection(db, "scores"), (snapshot) => {
    const grouped = {};
    const categoryTotals = { student: {}, postdoc: {} };

    snapshot.forEach((d) => {
      const data = d.data();
      const key = `${data.firstName} ${data.lastName}`;
      (grouped[key] ||= []).push(data);
    });

    resultsContainer.innerHTML = "";
    Object.keys(grouped).sort().forEach((presenter) => {
      const scores = grouped[presenter];
      let totalScore = 0;
      const rawCategory = scores[0].category || "Unknown";
      const normalizedCategory = normalizeCategory(rawCategory);

      const section = document.createElement("section");
      section.innerHTML = `<h3>${presenter} (${rawCategory})</h3>`;

      const rows = scores.map((e) => {
        const c1 = e.scores?.cat1 ?? 0;
        const c2 = e.scores?.cat2 ?? 0;
        const c3 = e.scores?.cat3 ?? 0;
        const entryTotal = c1 + c2 + c3;
        totalScore += entryTotal;

        // ✅ Handle Firestore timestamp OR plain Date
        let timeString = "Unknown";
        if (e.timestamp?.seconds) {
          timeString = new Date(e.timestamp.seconds * 1000).toLocaleString();
        } else if (e.timestamp) {
          timeString = new Date(e.timestamp).toLocaleString();
        }

        return `
          <tr>
            <td>${c1}</td><td>${c2}</td><td>${c3}</td>
            <td>${timeString}</td>
            <td>${e.judge ?? "Unknown"}</td>
          </tr>`;
      }).join("");

      section.insertAdjacentHTML(
        "beforeend",
        `<div class="table-wrapper">
           <table>
             <thead>
               <tr>
                 <th>Poster</th><th>Scientific</th><th>Presentation</th>
                 <th>Submitted</th><th>Judge</th>
               </tr>
             </thead>
             <tbody>${rows}</tbody>
           </table>
         </div>`
      );

      section.insertAdjacentHTML(
        "beforeend",
        `<p style="font-weight:bold;text-align:center;margin-top:0.4rem">
           Total Score: ${totalScore} (${scores.length} Judge${scores.length !== 1 ? 's' : ''})
         </p>`
      );

      resultsContainer.appendChild(section);

      // ✅ Add to totals for category
      if (normalizedCategory === "student") {
        categoryTotals.student[presenter] = totalScore;
      } else if (normalizedCategory === "postdoc") {
        categoryTotals.postdoc[presenter] = totalScore;
      }
    });

    // ✅ Calculate winners (lowest score wins)
    const banner = document.createElement("div");
    banner.style.cssText = "margin:3rem auto 1rem;text-align:center;font-size:1.25rem;font-weight:bold;";

    function winnerText(catTotals) {
      if (!catTotals || Object.keys(catTotals).length === 0) return `No scores`;

      const min = Math.min(...Object.values(catTotals));
      const winners = Object.keys(catTotals).filter(p => catTotals[p] === min);

      return winners.length === 1
        ? `Winner → ${winners[0]} (Score: ${min})`
        : `Winners → ${winners.join(", ")} (Score: ${min})`;
    }

    banner.innerHTML = `
      🏆 Student ${winnerText(categoryTotals.student)}<br>
      🏆 RTP_AH ${winnerText(categoryTotals.postdoc)}
    `;

    resultsContainer.appendChild(banner);
  });
}

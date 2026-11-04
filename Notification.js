// ============================================
// Notification.js
// Affiche l'historique des notifications reçues
// ============================================

const liste = document.getElementById("liste-notifications");
const vide = document.getElementById("vide");
let cle = "";

function afficher() {
  const notifications = JSON.parse(localStorage.getItem(cle)) || [];

  liste.innerHTML = "";
  vide.hidden = notifications.length > 0;

  for (const n of notifications) {
    const li = document.createElement("li");

    const texte = document.createElement("span");
    texte.textContent = n.texte;

    const date = document.createElement("span");
    date.className = "date-notif";
    date.textContent = new Date(n.date).toLocaleString("fr-CA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });

    li.appendChild(texte);
    li.appendChild(date);
    liste.appendChild(li);
  }
}

document.getElementById("bouton-effacer").addEventListener("click", function () {
  if (!confirm("Effacer toutes les notifications ?")) return;
  localStorage.removeItem(cle);
  afficher();
});

async function demarrer() {
  const { data } = await client.auth.getSession();

  if (data.session === null) {
    window.location.href = "index.html";
    return;
  }

  cle = "notifications-" + data.session.user.id;
  afficher();
}

demarrer();
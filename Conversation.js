// ============================================
// Conversation.js
// Page principale : salons et messages
// ============================================


// ---------- 1. Variables ----------

let utilisateur = null;
let nom = "";
let salon = null;          // le salon ouvert
let canalSalon = null;     // l'écoute en direct du salon
let canalEnLigne = null;   // l'écoute des personnes en ligne
let derniereFois = 0;      // pour ne pas envoyer "j'écris" trop souvent
let listeDesSalons = [];   // tous les salons (pour retrouver un nom grâce à l'id)

// ---------- 2. Éléments du HTML ----------

const app = document.getElementById("page_web");
const listeSalons = document.getElementById("liste-conversations");
const formSalon = document.getElementById("formulaire-conversation");
const champSalon = document.getElementById("nom-conversation");
const erreurSalon = document.getElementById("erreur-conversation");
const titre = document.getElementById("titre");
const listeMessages = document.getElementById("messages");
const texteEcriture = document.getElementById("indicateur-ecriture");
const listeEnLigne = document.getElementById("liste-en-ligne");
const formMessage = document.getElementById("formulaire");
const champMessage = document.getElementById("champ");
const popupParametres = document.getElementById("popup-parametres");


// ---------- 3. Les salons ----------

async function chargerSalons() {
  const { data, error } = await client
    .from("salons")
    .select("id, nom")
    .order("nom", { ascending: true });

  if (error) {
    console.log("Erreur salons :", error);
    return;
  }
    listeDesSalons = data;   // on garde la liste pour les notifications

  listeSalons.innerHTML = "";
  for (const s of data) {
    const li = document.createElement("li");
    li.textContent = "# " + s.nom;

    // Le salon ouvert est mis en couleur (classe "active")
    if (salon !== null && salon.id === s.id) {
      li.className = "active";
    }

    li.addEventListener("click", function () {
      ouvrirSalon(s);
    });
    listeSalons.appendChild(li);
  }
}

async function ouvrirSalon(s) {
  salon = s;
  titre.textContent = "# " + s.nom;
  formMessage.hidden = false;
  texteEcriture.hidden = true;
  app.classList.add("salon-ouvert"); // mobile : on voit le chat

  ecouterSalon();
  chargerSalons();
  await chargerMessages();
  champMessage.focus();
}

// Bouton retour (visible sur mobile)
document.getElementById("bouton-retour").addEventListener("click", function () {
  if (canalSalon !== null) {
    client.removeChannel(canalSalon);
    canalSalon = null;
  }
  salon = null;
  titre.textContent = "Choisis ou crée un salon";
  listeMessages.innerHTML = "";
  formMessage.hidden = true;
  texteEcriture.hidden = true;
  app.classList.remove("salon-ouvert");
  chargerSalons();
});


// ---------- 4. Les messages ----------

async function chargerMessages() {
  const { data, error } = await client
    .from("messages")
    .select("id, user_id, auteur, contenu, created_at")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.log("Erreur messages :", error);
    return;
  }

  listeMessages.innerHTML = "";
  data.reverse(); // du plus ancien au plus récent
  for (const m of data) {
    afficherMessage(m);
  }
}

function afficherMessage(m) {
  const li = document.createElement("li");

  if (m.user_id === utilisateur.id) {
    li.className = "moi"; // mes messages : à droite
  } else {
    // L'auteur, seulement sur les messages des autres
    const spanAuteur = document.createElement("span");
    spanAuteur.className = "auteur";
    spanAuteur.textContent = m.auteur || "Inconnu";
    li.appendChild(spanAuteur);
  }

  const spanTexte = document.createElement("span");
  spanTexte.textContent = m.contenu;
  li.appendChild(spanTexte);

  // L'heure
  const spanHeure = document.createElement("span");
  spanHeure.className = "heure";
  spanHeure.textContent = new Date(m.created_at).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit"
  });
  li.appendChild(spanHeure);

  listeMessages.appendChild(li);
  listeMessages.scrollTop = listeMessages.scrollHeight; // on descend en bas
}


// ---------- 5. Écoute en direct ----------

function ecouterSalon() {
  // On arrête l'écoute de l'ancien salon
  if (canalSalon !== null) {
    client.removeChannel(canalSalon);
  }

  canalSalon = client.channel("salon-" + salon.id);

  // Un nouveau message arrive : on l'affiche tout de suite
  canalSalon.on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: "salon_id=eq." + salon.id },
    function (payload) {
      afficherMessage(payload.new);
      texteEcriture.hidden = true;
    }
  );

  // Quelqu'un est en train d'écrire
  canalSalon.on("broadcast", { event: "ecrit" }, function (message) {
    texteEcriture.textContent = message.payload.nom + " est en train d'écrire...";
    texteEcriture.hidden = false;
    setTimeout(function () {
      texteEcriture.hidden = true;
    }, 3000);
  });

  canalSalon.subscribe();
}

// Quand je tape, je préviens les autres (maximum une fois par seconde et demie)
champMessage.addEventListener("input", function () {
  if (canalSalon === null) return;
  if (Date.now() - derniereFois < 1500) return;
  derniereFois = Date.now();

  canalSalon.send({
    type: "broadcast",
    event: "ecrit",
    payload: { nom: nom }
  });
});


// ---------- 6. Qui est en ligne ----------
function suivreEnLigne() {
  canalEnLigne = client.channel("en-ligne", {
    config: { presence: { key: utilisateur.id } }
  });

  // Quelqu'un arrive ou part : on refait la liste
  canalEnLigne.on("presence", { event: "sync" }, function () {
    const etat = canalEnLigne.presenceState();
    listeEnLigne.innerHTML = "";

    for (const cle in etat) {
      if (cle === utilisateur.id) continue; // on ne s'affiche pas soi-même
      const li = document.createElement("li");
      li.textContent = etat[cle][0].nom;
      listeEnLigne.appendChild(li);
    }
  });

  canalEnLigne.subscribe(function (statut) {
    if (statut === "SUBSCRIBED") {
      canalEnLigne.track({ nom: nom });
    }
  });
}


// ---------- 7. Les formulaires ----------

// Créer un salon
formSalon.addEventListener("submit", async function (event) {
  event.preventDefault();
  const n = champSalon.value.trim();
  if (n === "") return;

  const { data, error } = await client
    .from("salons")
    .insert({ nom: n })
    .select()
    .single();

  if (error) {
    erreurSalon.textContent = "Ce nom existe déjà.";
    return;
  }

  erreurSalon.textContent = "";
  champSalon.value = "";
  ouvrirSalon(data);
});

// Envoyer un message (bouton ou touche Entrée)
formMessage.addEventListener("submit", async function (event) {
  event.preventDefault();
  const texte = champMessage.value.trim();
  if (texte === "") return;

  const { error } = await client
    .from("messages")
    .insert({ salon_id: salon.id, auteur: nom, contenu: texte });

  if (error) {
    console.log("Erreur envoi :", error.message);
    return;
  }

  champMessage.value = ""; // le message s'affichera grâce au temps réel
});

const bandeau = document.getElementById("notification");

function afficherNotification(texte) {
  bandeau.textContent = texte;
  bandeau.hidden = false;
  setTimeout(function () {
    bandeau.hidden = true;
  }, 4000);
}

// ---------- 8. Paramètres (pop-up) ----------

document.getElementById("bouton-parametres").addEventListener("click", function () {
  document.getElementById("parametres-nom").textContent = nom;
  popupParametres.showModal();
});

document.getElementById("bouton-fermer").addEventListener("click", function () {
  popupParametres.close();
});

document.getElementById("bouton-deconnexion").addEventListener("click", async function () {
  await client.auth.signOut();
  window.location.href = "index.html";
});


// ---------- 9. Démarrage ----------

async function demarrer() {
  const { data } = await client.auth.getSession();

  // Personne n'est connecté : retour à la page de connexion
  if (data.session === null) {
    window.location.href = "index.html";
    return;
  }

  utilisateur = data.session.user;
  nom = utilisateur.user_metadata.username || utilisateur.email;

  // Profil
  document.getElementById("nom-utilisateur").textContent = nom;

  chargerSalons();
  suivreEnLigne();

    client
    .channel("notifications")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, function (payload) {
      const m = payload.new;
      if (m.user_id === utilisateur.id) return;               // mon propre message
      if (salon !== null && salon.id === m.salon_id) return;  // je suis déjà dans ce salon

      // On cherche le nom du salon grâce à son id
      const leSalon = listeDesSalons.find(function (s) {
        return s.id === m.salon_id;
      });
      const nomSalon = leSalon ? leSalon.nom : "un salon";

      afficherNotification((m.auteur || "Quelqu'un") + " a écrit dans # " + nomSalon + " : " + m.contenu);
    })
    .subscribe();
  // Quand quelqu'un crée un salon, on recharge la liste
  client
    .channel("salons")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "salons" }, chargerSalons)
    .subscribe();
}

demarrer();
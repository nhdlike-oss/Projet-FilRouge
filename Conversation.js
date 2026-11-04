// ============================================
// Conversation.js
// Salons, messages, temps réel, "en train d'écrire",
// personnes en ligne, notifications, paramètres
// ============================================


// ---------- 1. Variables ----------

let utilisateur = null;
let nom = "";
let salon = null;            // le salon ouvert
let listeDesSalons = [];     // tous les salons (pour retrouver un nom grâce à l'id)
let canalSalon = null;       // écoute en direct du salon ouvert
let canalEnLigne = null;     // écoute des personnes en ligne
let canalNotif = null;       // écoute des notifications (tous les salons)
let derniereFois = 0;        // pour ne pas envoyer "j'écris" trop souvent


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
const bandeau = document.getElementById("notification");


// ---------- 3. Avatar (rond avec l'initiale) ----------

function creerAvatar(nomPersonne, petit) {
  const rond = document.createElement("div");
  rond.className = "avatar" + (petit ? " petit" : "");
  rond.textContent = (nomPersonne || "?").charAt(0).toUpperCase();

  // Une couleur par nom (toujours la même pour la même personne)
  let total = 0;
  for (const lettre of (nomPersonne || "")) total += lettre.charCodeAt(0);
  rond.style.backgroundColor = "hsl(" + ((total * 47) % 360) + ", 40%, 55%)";
  return rond;
}


// ---------- 4. Les salons ----------

async function chargerSalons() {
  const { data, error } = await client
    .from("salons")
    .select("id, nom")
    .order("nom", { ascending: true });

  if (error) {
    console.log("Erreur salons :", error.message);
    return;
  }

  listeDesSalons = data; // gardé pour les notifications

  listeSalons.innerHTML = "";
  for (const s of data) {
    const li = document.createElement("li");
    li.textContent = "# " + s.nom;

    // Le salon ouvert est mis en couleur
    if (salon !== null && salon.id === s.id) li.className = "active";

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
  app.classList.add("salon-ouvert"); // téléphone : on voit le chat

  ecouterSalon();
  chargerSalons();
  await chargerMessages();
  champMessage.focus();
}

// Bouton retour (téléphone)
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


// ---------- 5. Les messages ----------

async function chargerMessages() {
  const { data, error } = await client
    .from("messages")
    .select("id, user_id, auteur, contenu, created_at")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.log("Erreur messages :", error.message);
    return;
  }

  listeMessages.innerHTML = "";
  data.reverse(); // du plus ancien au plus récent
  for (const m of data) afficherMessage(m);
}

function afficherMessage(m) {
  const estMoi = m.user_id === utilisateur.id;
  const nomAffiche = estMoi ? nom : (m.auteur || "Inconnu");

  const li = document.createElement("li");
  if (estMoi) li.className = "moi";

  li.appendChild(creerAvatar(nomAffiche, false));

  const contenu = document.createElement("div");
  contenu.className = "contenu";

  // Ligne du haut : nom + heure
  const entete = document.createElement("div");
  entete.className = "entete";

  const spanAuteur = document.createElement("span");
  spanAuteur.className = "auteur";
  spanAuteur.textContent = nomAffiche;

  const spanHeure = document.createElement("span");
  spanHeure.className = "heure";
  spanHeure.textContent = new Date(m.created_at).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit"
  });

  entete.appendChild(spanAuteur);
  entete.appendChild(spanHeure);

  // La bulle
  const bulle = document.createElement("div");
  bulle.className = "bulle";
  bulle.textContent = m.contenu;

  contenu.appendChild(entete);
  contenu.appendChild(bulle);
  li.appendChild(contenu);

  listeMessages.appendChild(li);
  listeMessages.scrollTop = listeMessages.scrollHeight;
}


// ---------- 6. Temps réel : messages et "en train d'écrire" ----------

function ecouterSalon() {
  if (canalSalon !== null) client.removeChannel(canalSalon);

  canalSalon = client.channel("salon-" + salon.id);

  // Un nouveau message arrive
  canalSalon.on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: "salon_id=eq." + salon.id },
    function (payload) {
      afficherMessage(payload.new);
      texteEcriture.hidden = true;
    }
  );

  // Quelqu'un est en train d'écrire dans CE salon
  canalSalon.on("broadcast", { event: "ecrit" }, function (message) {
    texteEcriture.textContent = message.payload.nom + " est en train d'écrire...";
    texteEcriture.hidden = false;
    setTimeout(function () {
      texteEcriture.hidden = true;
    }, 3000);
  });

  canalSalon.subscribe();
}

// Quand je tape, je préviens les autres (au plus une fois toutes les 1,5 seconde)
champMessage.addEventListener("input", function () {
  if (canalSalon === null || salon === null) return;
  if (Date.now() - derniereFois < 1500) return;
  derniereFois = Date.now();

  // Pour ceux qui sont dans ce salon
  canalSalon.send({ type: "broadcast", event: "ecrit", payload: { nom: nom } });

  // Pour ceux qui sont dans un autre salon
  if (canalNotif !== null) {
    canalNotif.send({
      type: "broadcast",
      event: "ecrit-ailleurs",
      payload: { nom: nom, salonId: salon.id, salonNom: salon.nom }
    });
  }
});


// ---------- 7. Personnes en ligne ----------

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

      const nomPersonne = etat[cle][0].nom;
      const li = document.createElement("li");
      li.appendChild(creerAvatar(nomPersonne, true));
      li.appendChild(document.createTextNode(nomPersonne));
      listeEnLigne.appendChild(li);
    }
  });

  canalEnLigne.subscribe(function (statut) {
    if (statut === "SUBSCRIBED") {
      canalEnLigne.track({ nom: nom }); // "je suis en ligne"
    }
  });
}


// ---------- 8. Notifications ----------

function afficherNotification(texte) {
  bandeau.textContent = texte;
  bandeau.hidden = false;
  clearTimeout(afficherNotification.minuteur);
  afficherNotification.minuteur = setTimeout(function () {
    bandeau.hidden = true;
  }, 4000);
}

// Écoute les messages et les "en train d'écrire" de TOUS les salons
function suivreNotifications() {
  canalNotif = client.channel("notifications");

  // Un message arrive dans un salon
 canalNotif.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, function (payload) {
    const m = payload.new;
    if (m.user_id === utilisateur.id) return;
    if (salon !== null && salon.id === m.salon_id) return;

    const leSalon = listeDesSalons.find(function (s) { return s.id === m.salon_id; });
    const nomSalon = leSalon ? leSalon.nom : "un salon";

    const texte = (m.auteur || "Quelqu'un") + " a écrit dans # " + nomSalon + " : " + m.contenu;
    afficherNotification(texte);
    enregistrerNotification(texte);
});

  // Quelqu'un écrit dans un salon où je ne suis pas
  canalNotif.on("broadcast", { event: "ecrit-ailleurs" }, function (message) {
    const infos = message.payload;
    if (salon !== null && salon.id === infos.salonId) return; // déjà visible dans le chat
    afficherNotification(infos.nom + " est en train d'écrire dans # " + infos.salonNom);
  });

  canalNotif.subscribe();
}
// Garde la notification dans l'historique (dans ce navigateur, 20 maximum)
function enregistrerNotification(texte) {
  const cle = "notifications-" + utilisateur.id;
  const liste = JSON.parse(localStorage.getItem(cle)) || [];
  liste.unshift({ texte: texte, date: new Date().toISOString() });
  localStorage.setItem(cle, JSON.stringify(liste.slice(0, 20)));
}


// ---------- 9. Les formulaires ----------

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


// ---------- 10. Paramètres (pop-up) ----------

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


// ---------- 11. Démarrage ----------

async function demarrer() {
  const { data } = await client.auth.getSession();

  // Personne n'est connecté : retour à la page de connexion
  if (data.session === null) {
    window.location.href = "index.html";
    return;
  }

  utilisateur = data.session.user;
  nom = utilisateur.user_metadata.username || utilisateur.email;

  // Profil : seulement le nom
  document.getElementById("nom-utilisateur").textContent = nom;

  await chargerSalons();
  suivreEnLigne();
  suivreNotifications();

  // Quand quelqu'un crée un salon, on recharge la liste
  client
    .channel("salons")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "salons" }, chargerSalons)
    .subscribe();
}

demarrer();
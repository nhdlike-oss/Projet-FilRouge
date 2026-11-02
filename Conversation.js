// ============================================
// Conversation.js
// Page principale : salons et messages
// ============================================


// ---------- 1. Variables ----------

let utilisateur = null;   // la personne connectée
let nomUtilisateur = "";  // son nom
let salonActif = null;    // le salon ouvert (null = aucun)


// ---------- 2. Éléments de la page ----------

const app = document.getElementById("page_web");
const listeSalons = document.getElementById("liste-conversations");
const formSalon = document.getElementById("formulaire-conversation");
const champSalon = document.getElementById("nom-conversation");
const erreurSalon = document.getElementById("erreur-conversation");
const titre = document.getElementById("titre");
const listeMessages = document.getElementById("messages");
const formMessage = document.getElementById("formulaire");
const champMessage = document.getElementById("champ");
const boutonRetour = document.getElementById("bouton-retour");
const boutonDeconnexion = document.getElementById("deconnexion");


// ---------- 3. Les salons ----------

// Va chercher les salons dans Supabase et les affiche
async function chargerSalons() {
  const { data, error } = await client
    .from("salons")
    .select("id, nom");

  if (error) {
    console.log("Erreur salons :", error);
    return;
  }

  listeSalons.innerHTML = "";

  for (const salon of data) {
    const li = document.createElement("li");
    li.textContent = "# " + salon.nom;

    // Si on clique sur le salon, on l'ouvre
    li.addEventListener("click", function () {
      ouvrirSalon(salon);
    });

    listeSalons.appendChild(li);
  }
}

// Ouvre un salon : change le titre et affiche ses messages
function ouvrirSalon(salon) {
  salonActif = salon;
  titre.textContent = "# " + salon.nom;
  formMessage.hidden = false;
  app.classList.add("salon-ouvert");
  chargerMessages();
}

// Retour à la liste (bouton visible sur mobile)
function fermerSalon() {
  salonActif = null;
  titre.textContent = "Choisis ou crée une conversation";
  listeMessages.innerHTML = "";
  formMessage.hidden = true;
  app.classList.remove("salon-ouvert");
}


// ---------- 4. Les messages ----------

// Va chercher les 50 derniers messages du salon ouvert
async function chargerMessages() {
  if (salonActif === null) return; // aucun salon ouvert

  const { data, error } = await client
    .from("messages")
    .select("contenu, created_at, user_id")
    .eq("salon_id", salonActif.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.log("Erreur messages :", error);
    return;
  }

  // On inverse pour avoir les plus anciens en haut
  data.reverse();

  listeMessages.innerHTML = "";
  for (const message of data) {
    afficherMessage(message);
  }

  listeMessages.scrollTop = listeMessages.scrollHeight;
}

// Crée un <li> pour un message et l'ajoute à la liste
function afficherMessage(message) {
  const li = document.createElement("li");

  // Mes messages sont à droite et en vert (classe "moi" dans le CSS)
  if (message.user_id === utilisateur.id) {
    li.className = "moi";
  }

  const spanTexte = document.createElement("span");
  spanTexte.textContent = message.contenu;

  const spanHeure = document.createElement("span");
  spanHeure.className = "heure";
  spanHeure.textContent = new Date(message.created_at).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit"
  });

  li.appendChild(spanTexte);
  li.appendChild(spanHeure);
  listeMessages.appendChild(li);
}


// ---------- 5. Les événements ----------

// Créer un salon
formSalon.addEventListener("submit", async function (event) {
  event.preventDefault();

  const nom = champSalon.value.trim();
  if (nom === "") return;

  const { data, error } = await client
    .from("salons")
    .insert({ nom: nom })
    .select()
    .single();

  if (error) {
    erreurSalon.textContent = "Ce nom existe déjà ou est invalide.";
    console.log("Erreur création salon :", error);
    return;
  }

  erreurSalon.textContent = "";
  champSalon.value = "";
  await chargerSalons();
  ouvrirSalon(data);
});

// Envoyer un message
formMessage.addEventListener("submit", async function (event) {
  event.preventDefault();

  const texte = champMessage.value.trim();
  if (texte === "") return;

  const { error } = await client
    .from("messages")
    .insert({
      salon_id: salonActif.id,
      contenu: texte
    });

  if (error) {
    console.log("Erreur envoi :", error);
    return;
  }

  champMessage.value = "";
  chargerMessages();
});

boutonRetour.addEventListener("click", fermerSalon);

boutonDeconnexion.addEventListener("click", async function () {
  await client.auth.signOut();
  window.location.href = "connexion.html";
});


// ---------- 6. Démarrage ----------

async function demarrer() {
  // 1. Est-ce que quelqu'un est connecté ?
  const { data } = await client.auth.getSession();

  // 2. Non : retour à la connexion
  if (data.session === null) {
    window.location.href = "connexion.html";
    return;
  }

  // 3. Oui : on garde la personne dans la variable "utilisateur"
  utilisateur = data.session.user;
  nomUtilisateur = utilisateur.user_metadata.username || utilisateur.email;
  document.getElementById("nom-utilisateur").textContent = nomUtilisateur;

  // 4. On affiche les salons
  chargerSalons();
// 5. On affiche le nom (si l'élément existe dans le HTML)
  const spanNom = document.getElementById("nom-utilisateur");
  if (spanNom !== null) {
    spanNom.textContent = nomUtilisateur;
  }
}
demarrer();
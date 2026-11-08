// ============================================
// Conversation.js
// Page de conversation : salons, messages en temps réel,
// "en train d'écrire", personnes en ligne, notifications,
// paramètres (déconnexion et suppression du compte)
// Auteure : nene hassy 

// ============================================


//  Variables 

let utilisateur = null;
let nom = "";
let salon = null;            // le salon ouvert
let listeDesSalons = [];     // tous les salons (pour retrouver un nom grâce à l'id)
let canalSalon = null;       // écoute en direct du salon ouvert
let canalEnLigne = null;     // écoute des personnes en ligne
let canalNotif = null;       // écoute des notifications (tous les salons)
let derniereFois = 0;        // pour ne pas envoyer "j'écris" trop souvent
let profils = {};            // pseudo et photo de chaque personne (id -> profil)
let maPhoto = null;          // ma photo de profil

//  2. Éléments du HTML 

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

const vide = document.getElementById("vide");


// ---------- Avatar ----------

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


// ----- profils (pseudo + photo) ----------
 
const AVATAR = "image/avatar.png"; // photo par défaut
 
// Va chercher dans la table "profils" les personnes qu'on ne connaît pas encore
async function chargerProfils(ids) {
  const manquants = ids.filter(function (id) {
    return id && !(id in profils);
  });
  if (manquants.length === 0) return;
 
  const { data } = await client
    .from("profils")
    .select("id, pseudo, avatar_url")
    .in("id", manquants);
 
  for (const p of (data || [])) profils[p.id] = p;
 
  // Ceux qui n'ont pas encore rempli leur profil
  for (const id of manquants) {
    if (!(id in profils)) profils[id] = null;
  }
}
 
// Le nom à afficher pour un message : le pseudo, sinon l'ancien texte "auteur"
function nomDe(m) {
  const p = profils[m.user_id];
  if (p && p.pseudo) return p.pseudo;
  return m.auteur || "Inconnu";
}
 
// La photo à afficher pour une personne : sa photo, sinon l'avatar par défaut
function photoDe(userId) {
  const p = profils[userId];
  return (p && p.avatar_url) ? p.avatar_url : AVATAR;
}
 
// Crée la petite image ronde
function creerPhoto(url, petit) {
  const img = document.createElement("img");
  img.className = "photoMessage" + (petit ? " petit" : "");
  img.src = url || AVATAR;
  img.alt = "";
  img.onerror = function () { img.onerror = null; img.src = "image/avatar.png"; };
  return img;
}
 

//  Les salons

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
    prive = null;   // on quitte la discussion privée
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
  prive = null;
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
   // On charge les profils des auteurs avant d'afficher
  await chargerProfils(data.map(function (m) { return m.user_id; }));

  listeMessages.innerHTML = "";
  data.reverse(); // du plus ancien au plus récent
  for (const m of data) afficherMessage(m);
}

function afficherMessage(m) {
  const estMoi = m.user_id === utilisateur.id;
  const nomAffiche = estMoi ? nom : nomDe(m);
  const li = document.createElement("li");

  if (estMoi) li.className = "moi";

    li.appendChild(creerPhoto(photoDe(m.user_id), false));

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
    async function (payload) {
      await chargerProfils([payload.new.user_id]);   // profil de l'auteur
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
      li.appendChild(creerPhoto(etat[cle][0].photo, true));
      li.appendChild(document.createTextNode(nomPersonne));
      listeEnLigne.appendChild(li);
    }
  });

  canalEnLigne.subscribe(function (statut) {
    if (statut === "SUBSCRIBED") {
      canalEnLigne.track({ nom: nom, photo: maPhoto }) // "je suis en ligne et photo de profil"
    }
  });
}



//  Notifications

const popupNotifications = document.getElementById("popup-notifications");
const cadreNotifications = document.getElementById("cadre-notifications");

// Bandeau en haut à droite
function afficherNotification(texte) {
  bandeau.textContent = texte;
  bandeau.hidden = false;
  clearTimeout(afficherNotification.minuteur);
  afficherNotification.minuteur = setTimeout(function () {
    bandeau.hidden = true;
  }, 4000);
}

// Garde la notification dans l'historique (100 maximum)
function enregistrerNotification(texte) {
  const cle = "notifications-" + utilisateur.id;
  const liste = JSON.parse(localStorage.getItem(cle)) || [];
  liste.unshift({ texte: texte, date: new Date().toISOString() });
  localStorage.setItem(cle, JSON.stringify(liste.slice(0, 100)));
}

// Ouvre Notification.html dans un pop-up
function ouvrirNotifications() {
  cadreNotifications.src = "Notification.html";
  popupNotifications.showModal();
}

document.getElementById("bouton-notifications").addEventListener("click", ouvrirNotifications);

bandeau.addEventListener("click", function () {
  bandeau.hidden = true;
  ouvrirNotifications();
});

document.getElementById("bouton-fermer-notif").addEventListener("click", function () {
  popupNotifications.close();
  cadreNotifications.src = "about:blank";
});

// Écoute les messages et les "en train d'écrire" de TOUS les salons
function suivreNotifications() {
  canalNotif = client.channel("notifications");

  // Un message arrive dans un salon
  canalNotif.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, function (payload) {
    const m = payload.new;
    if (m.user_id === utilisateur.id) return;               // mon propre message
    if (salon !== null && salon.id === m.salon_id) return;  // je suis déjà dans ce salon

    const leSalon = listeDesSalons.find(function (s) { return s.id === m.salon_id; });
    const nomSalon = leSalon ? leSalon.nom : "un salon";

    const texte = (m.auteur || "Quelqu'un") + " a écrit dans # " + nomSalon + " : " + m.contenu;
    afficherNotification(texte);
    enregistrerNotification(texte);
  });

  // Quelqu'un écrit dans un salon où je ne suis pas
  canalNotif.on("broadcast", { event: "ecrit-ailleurs" }, function (message) {
    const infos = message.payload;
    if (salon !== null && salon.id === infos.salonId) return;
    afficherNotification(infos.nom + " est en train d'écrire dans # " + infos.salonNom);
  });

  canalNotif.subscribe();
}

//  formulaires ----------

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

  
  // Discussion privée ouverte : on envoie en privé
  if (prive !== null) {
    await envoyerPrive(texte);
    return;
  }

  const { error } = await client
    .from("messages")
    .insert({ salon_id: salon.id, auteur: nom, contenu: texte });

  if (error) {
    console.log("Erreur envoi :", error.message);
    return;
  }

  champMessage.value = ""; // le message s'affichera grâce au temps réel
});


//  Paramètres (pop-up) 

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

document.getElementById("bouton-supprimer").addEventListener("click", async function () {
  console.log("clic sur supprimer");

  const sur = confirm("Supprimer ton compte pour toujours ? Tes messages seront aussi supprimés.");
  if (!sur) return;

  const { error } = await client.rpc("supprimer_mon_compte");

  if (error) {
    console.log("Erreur suppression compte :", error.message);
    alert("Impossible de supprimer le compte : " + error.message);
    return;
  }

  localStorage.removeItem("notifications-" + utilisateur.id);
  await client.auth.signOut();
  window.location.href = "index.html";
});


//  Démarrage ----------

async function demarrer() {
  const { data } = await client.auth.getSession();

  // Personne n'est connecté : retour à la page de connexion
  if (data.session === null) {
    window.location.href = "index.html";
    return;
  }

  utilisateur = data.session.user;
  
   // mon pseudo et ma photo viennent de la table "profils"
  await chargerProfils([utilisateur.id]);
  const monProfil = profils[utilisateur.id];
  nom = (monProfil && monProfil.pseudo) || utilisateur.user_metadata.username || utilisateur.email;
  maPhoto = monProfil ? monProfil.avatar_url : null;
  
  // Profil : seulement le nom
  document.getElementById("nom-utilisateur").textContent = nom;

  await chargerSalons();
  suivreEnLigne();
  suivreNotifications();

  // Venu de la page Contacts avec ?avec=ID : on ouvre la discussion privée
  const avec = new URLSearchParams(window.location.search).get("avec");
  if (avec) {
    boutonBasculer.click();
    ouvrirPrive(avec);
  }
  // Quand quelqu'un crée un salon, on recharge la liste
  client
    .channel("salons")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "salons" }, chargerSalons)
    .subscribe();
}

demarrer();
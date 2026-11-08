// ============================================
// prive.js : discussion privée entre deux personnes
// ============================================

const AVATAR = "image/avatar.png";
const listeMessages = document.getElementById("messages");
const formulaire = document.getElementById("formulaire");
const champ = document.getElementById("champ");


// Barre de gauche
const titreListe = document.getElementById("titreListe");
const listePrive = document.getElementById("liste-prives");
const listeSalons = document.getElementById("liste-salons");
const boutonBasculer = document.getElementById("basculer");


// L'id du contact est dans l'adresse : Prive.html?avec=ID
const amiId = new URLSearchParams(window.location.search).get("avec");

let utilisateur = null;   
let moi = null;           
let ami = null;      

// Afficher un message 
function afficherMessage(m) {
    const estMoi = m.expediteur === utilisateur.id;
    const profil = estMoi ? moi : ami;

    const li = document.createElement("li");
    if (estMoi) li.className = "moi";

    const img = document.createElement("img");
    img.className = "photoMessage";
    img.src = (profil && profil.avatar_url) || AVATAR;
    img.alt = "";
    img.onerror = function () { img.onerror = null; img.src = AVATAR; };

    const contenu = document.createElement("div");
    contenu.className = "contenu";

    const entete = document.createElement("div");
    entete.className = "entete";

    const auteur = document.createElement("span");
    auteur.className = "auteur";
    auteur.textContent = (profil && profil.pseudo) || "Inconnu";

    const heure = document.createElement("span");
    heure.className = "heure";
    heure.textContent = new Date(m.created_at).toLocaleTimeString("fr-CA", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const bulle = document.createElement("div");
    bulle.className = "bulle";
    bulle.textContent = m.contenu;

    entete.appendChild(auteur);
    entete.appendChild(heure);
    contenu.appendChild(entete);
    contenu.appendChild(bulle);
    li.appendChild(img);
    li.appendChild(contenu);

    listeMessages.appendChild(li);
    listeMessages.scrollTop = listeMessages.scrollHeight;
}

// Charger les anciens messages entre nous deux
async function chargerMessages() {
    const nous = [utilisateur.id, amiId];

    const { data } = await client
        .from("messages_prives")
        .select("*")
        .in("expediteur", nous)
        .in("destinataire", nous)
        .order("created_at", { ascending: true })
        .limit(100);

    listeMessages.innerHTML = "";
    for (const m of (data || [])) afficherMessage(m);
}

// Recevoir les nouveaux messages en direct
function ecouter() {
    client
        .channel("prive-" + utilisateur.id)
        .on("postgres_changes",
            { event: "INSERT", schema: "public", table: "messages_prives" },
            function (payload) {
                const m = payload.new;
                const pourNous =
                    (m.expediteur === amiId && m.destinataire === utilisateur.id) ||
                    (m.expediteur === utilisateur.id && m.destinataire === amiId);
                if (pourNous) afficherMessage(m);
            })
        .subscribe();
}

// Envoyer un message
formulaire.addEventListener("submit", async function (e) {
    e.preventDefault();
    const texte = champ.value.trim();
    if (texte === "") return;

    const { error } = await client
        .from("messages_prives")
        .insert({ expediteur: utilisateur.id, destinataire: amiId, contenu: texte });

    if (error) {
        alert("Le message n'a pas pu être envoyé.");
        return;
    }
    champ.value = "";   // le message s'affichera grâce au temps réel
});


// ---------- Barre de gauche : les personnes ----------
// Mes contacts + ceux qui m'ont ajoutée
async function chargerListe() {
    const { data: liens } = await client
        .from("contacts")
        .select("user_id, contact_id")
        .or("user_id.eq." + utilisateur.id + ",contact_id.eq." + utilisateur.id);

    // On garde "l'autre personne" de chaque lien, sans doublon
    const ids = [];
    for (const l of (liens || [])) {
        const autre = (l.user_id === utilisateur.id) ? l.contact_id : l.user_id;
        if (!ids.includes(autre)) ids.push(autre);
    }

    listePrive.innerHTML = "";
    if (ids.length === 0) return;

    const { data: profils } = await client
        .from("profils")
        .select("id, pseudo, avatar_url")
        .in("id", ids);

    for (const p of (profils || [])) {
        const li = document.createElement("li");
        if (p.id === amiId) li.className = "active";   // la personne ouverte

        const img = document.createElement("img");
        img.className = "photoMessage petit";
        img.src = p.avatar_url || AVATAR;
        img.alt = "";
        img.onerror = function () { img.onerror = null; img.src = AVATAR; };

        li.appendChild(img);
        li.appendChild(document.createTextNode(p.pseudo || "Sans nom"));
        li.addEventListener("click", function () {
            window.location.href = "prive.html?avec=" + p.id;
        });
        listePrive.appendChild(li);
    }
}

// ---------- Barre de gauche : les salons ----------
async function chargerSalons() {
    const { data } = await client
        .from("salons")
        .select("id, nom")
        .order("nom", { ascending: true });

    listeSalons.innerHTML = "";
    for (const s of (data || [])) {
        const li = document.createElement("li");
        li.textContent = "# " + s.nom;
        li.addEventListener("click", function () {
            window.location.href = "Conversation.html?salon=" + s.id;
        });
        listeSalons.appendChild(li);
    }
}

// ---------- Bascule : Messages privés <-> Salons ----------
boutonBasculer.addEventListener("click", function () {
    if (listeSalons.hidden) {
        // On montre les salons
        listeSalons.hidden = false;
        listePrive.hidden = true;
        titreListe.textContent = "Salons";
        boutonBasculer.textContent = "Messages privés";
    } else {
        // On montre les personnes
        listeSalons.hidden = true;
        listePrive.hidden = false;
        titreListe.textContent = "Messages privés";
        boutonBasculer.textContent = "Salons";
    }
});


// Démarrage
async function demarrer() {
    const { data } = await client.auth.getSession();
    utilisateur = data.session ? data.session.user : null;

    if (!utilisateur) {
        window.location.href = "index.html";
        return;
    }
    if (!amiId) {
        window.location.href = "Contact.html";
        return;
    }

    // Les deux profils : le mien et celui du contact
    const { data: profils } = await client
        .from("profils")
        .select("id, pseudo, avatar_url")
        .in("id", [utilisateur.id, amiId]);

    for (const p of (profils || [])) {
        if (p.id === utilisateur.id) moi = p;
        if (p.id === amiId) ami = p;
    }

    document.getElementById("titre").textContent = (ami && ami.pseudo) || "Contact";
    document.getElementById("photoAmi").src = (ami && ami.avatar_url) || AVATAR;

    await chargerMessages();
    ecouter();
    champ.focus();
}

demarrer();
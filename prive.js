// ============================================
// prive.js : discussion privée entre deux personnes
// ============================================

const AVATAR = "image/avatar.png";
const listeMessages = document.getElementById("messages");
const formulaire = document.getElementById("formulaire");
const champ = document.getElementById("champ");

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
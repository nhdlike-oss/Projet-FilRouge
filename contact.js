// ============================================
// contact: rechercher, ajouter et inviter des contacts
// ============================================

const champRecherche = document.getElementById("recherche");
const listeResultats = document.getElementById("resultats");
const listeContacts = document.getElementById("mesContacts");
const formInvitation = document.getElementById("formInvitation");
const AVATAR = "image/avatar.png";

let utilisateur = null;   // la personne connectée
let mesIds = [];          // les id de mes contacts

function creerLigne(profil, texteBouton, action) {
    const li = document.createElement("li");
    li.className = "personne";

    const img = document.createElement("img");
    img.className = "photoContact";
    img.src = profil.avatar_url || AVATAR;
    img.alt = "";
    img.onerror = function () { img.onerror = null; img.src = AVATAR; };


    const nom = document.createElement("span");
    nom.className = "nomContact";
    nom.textContent = profil.pseudo || "Sans nom";

   
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "boutonPetit";
    bouton.textContent = texteBouton;
    bouton.addEventListener("click", action);

    li.appendChild(img);
    li.appendChild(nom);
    li.appendChild(bouton);
    return li;
} 

// 1. Afficher mes contacts
async function afficherContacts() {
    const { data: liens } = await client
        .from("contacts")
        .select("contact_id")
        .eq("user_id", utilisateur.id);

    mesIds = (liens || []).map(function (l) { return l.contact_id; });
    listeContacts.innerHTML = "";

    if (mesIds.length === 0) {
        listeContacts.innerHTML = "<li class='vide'>Tu n'as pas encore de contacts.</li>";
        return;
    }

    const { data: profils } = await client
        .from("profils")
        .select("id, pseudo, avatar_url")
        .in("id", mesIds);

    for (const p of (profils || [])) {
        listeContacts.appendChild(creerLigne(p, "Retirer", function () {
            retirerContact(p.id);
        }));
    }
}
// 2. Rechercher un membre par nom d'utilisateur
champRecherche.addEventListener("input", async function () {
    if (!utilisateur) return;  

    const texte = champRecherche.value.trim();
    listeResultats.innerHTML = "";
    if (texte.length < 2) return;   // au moins 2 lettres

    const { data } = await client
        .from("profils")
        .select("id, pseudo, avatar_url")
        .ilike("pseudo", "%" + texte + "%")
        .neq("id", utilisateur.id)  // pas moi-même
        .limit(10);

    if (!data || data.length === 0) {
        listeResultats.innerHTML = "<li class='vide'>Aucun membre trouvé.</li>";
        return;
    }

    for (const p of data) {
        if (mesIds.includes(p.id)) {
            const li = creerLigne(p, "Ajouté", function () {});
            li.querySelector("button").disabled = true;
            listeResultats.appendChild(li);
        } else {
            listeResultats.appendChild(creerLigne(p, "+ Ajouter", function () {
                ajouterContact(p.id);
            }));
        }
    }
});

// 3. Ajouter un contact
async function ajouterContact(id) {
    await client.from("contacts").insert({ user_id: utilisateur.id, contact_id: id });
    champRecherche.value = "";
    listeResultats.innerHTML = "";
    afficherContacts();
}

// 4. Retirer un contact
async function retirerContact(id) {
    if (!confirm("Retirer ce contact ?")) return;
    await client
        .from("contacts")
        .delete()
        .eq("user_id", utilisateur.id)
        .eq("contact_id", id);
    afficherContacts();
}

// 5. Inviter un ami
formInvitation.addEventListener("submit", async function (e) {
    e.preventDefault();
    const courriel = document.getElementById("courrielAmi").value.trim();
    const lien = new URL("index.html", window.location.href).href;

    const sujet = "Rejoins-moi sur JaWse !";
        const texte = "Salut ! Je suis sur JaWse, une messagerie pour jaser, partager et échanger.\n\nInscris-toi ici : " + lien;
    // Sur téléphone : menu de partage (WhatsApp, SMS, Gmail…)
    if (navigator.share) {
        try {
            await navigator.share({ title: sujet, text: texte });
            return;
        } catch (erreur) {
            // la personne a fermé le menu : on ne fait rien
            return;
        }
    }

    // Sur ordinateur : on ouvre le courriel
    window.location.href = "mailto:" + courriel
        + "?subject=" + encodeURIComponent(sujet)
        + "&body=" + encodeURIComponent(texte);
});

// Démarrage : il faut être connecté
async function demarrer() {
    const { data } = await client.auth.getSession();
    utilisateur = data.session ? data.session.user : null;

    if (!utilisateur) {
        window.location.href = "index.html";
        return;
    }
    afficherContacts();
}

demarrer();
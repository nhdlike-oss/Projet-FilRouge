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
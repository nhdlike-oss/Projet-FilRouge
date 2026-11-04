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


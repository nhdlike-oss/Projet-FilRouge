// Aperçu de la photo de profil choisie
const champPhoto = document.getElementById("photo");
const apercu = document.getElementById("apercu");
const formulaire = document.getElementById("formProfil");
const message = document.getElementById("messageProfil");
const boutonSupprimer = document.getElementById("supprimerPhoto");
const AVATAR = "image/avatar.png";

// Garde en mémoire la personne connectée et la photo choisie mais pas encore envoyée
let utilisateur = null;
// la photo choisie, pas encore envoyée
let nouvellePhoto = null;


function afficherMessage(texte, classe) {
    message.textContent = texte;
    message.className = classe;
    message.hidden = false;
}

// Supprime toutes les anciennes photos de l'utilisateur dans le bucket "avatars"
async function supprimerAnciennesPhotos() {
    const { data: fichiers } = await client.storage
        .from("avatars")
        .list(utilisateur.id);

    if (fichiers && fichiers.length > 0) {
        const chemins = fichiers.map(function (fichier) {
            return utilisateur.id + "/" + fichier.name;
        });
        await client.storage.from("avatars").remove(chemins);
    }
}

// 1. Charger le profil
async function chargerProfil() {
    const { data } = await client.auth.getUser();
    utilisateur = data.user;

    // Pas connectée : retour à l'accueil
    if (!utilisateur) {
        window.location.href = "index.html";
        return;
    }

    // On cherche son profil dans la table "profils"
    const { data: profil } = await client
        .from("profils")
        .select("pseudo, bio, avatar_url")
        .eq("id", utilisateur.id)
        .maybeSingle();

    // Remplit le pseudo, la bio et la photo si le profil existe
    if (profil) {
        document.getElementById("pseudo").value = profil.pseudo || "";
        document.getElementById("bio").value = profil.bio || "";
        if (profil.avatar_url) {
            apercu.src = profil.avatar_url;
            boutonSupprimer.hidden = false;   
        }
    }
}

// Lance le chargement du profil à l'ouverture de la page

chargerProfil();

// 2. Vérifier la photo choisie et afficher son aperçu
champPhoto.addEventListener("change", function () {
    const fichier = champPhoto.files[0];
    if (!fichier) return;

    // Accepte seulement les images PNG, JPEG ou WEBP
    const typesOk = ["image/png", "image/jpeg", "image/webp"];
    if (!typesOk.includes(fichier.type)) {
        alert("Choisis une image PNG, JPEG ou WEBP.");
        champPhoto.value = "";
        return;
    }

    // Vérifier la taille (2 Mo maximum)
    // Refuse les images de plus de 2 Mo
    if (fichier.size > 2 * 1024 * 1024) {
        alert("L'image doit faire moins de 2 Mo.");
        champPhoto.value = "";
        return;
    }

    // Garde la photo en attente et l'affiche en aperçu
    nouvellePhoto = fichier;
    apercu.src = URL.createObjectURL(fichier);
    message.hidden = true;
});

// 3. Enregistrer : la photo (si elle a changé), puis le profil
formulaire.addEventListener("submit", async function (e) {
    e.preventDefault();

    const donnees = {
        id: utilisateur.id,
        pseudo: document.getElementById("pseudo").value.trim(),
        bio: document.getElementById("bio").value.trim(),
        updated_at: new Date().toISOString()
    };

    // Si une nouvelle photo est choisie : supprime l'ancienne,
    // envoie la nouvelle et garde son lien
    if (nouvellePhoto) {
        await supprimerAnciennesPhotos();

        const extension = nouvellePhoto.type.split("/")[1];
        const chemin = utilisateur.id + "/avatar-" + Date.now() + "." + extension;
        
        const { error: erreurPhoto } = await client.storage
            .from("avatars")
            .upload(chemin, nouvellePhoto);

        if (erreurPhoto) {
            afficherMessage("La photo n'a pas pu être envoyée.", "messageErreur");
            return;
        }

        // Le lien de la photo, à garder dans le profil
        const { data } = client.storage.from("avatars").getPublicUrl(chemin);
        donnees.avatar_url = data.publicUrl;
    }

    // Enregistrer le profil dans la table "profils"
    const { error } = await client.from("profils").upsert(donnees);

    if (error) {
        afficherMessage("Le profil n'a pas pu être enregistré.", "messageErreur");
        return;
    }

    if (nouvellePhoto) {
        boutonSupprimer.hidden = false;
    }
    nouvellePhoto = null;
    champPhoto.value = "";
    afficherMessage("Profil enregistré !", "messageSucces");
});

    // 4. Supprimer la photo : retour à l'avatar par défaut
boutonSupprimer.addEventListener("click", async function () {
    if (!confirm("Supprimer ta photo de profil ?")) return;

    //On efface les fichiers dans le bucket
    await supprimerAnciennesPhotos();

    // vide le lien dans le profil
    const { error } = await client
        .from("profils")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", utilisateur.id);

    if (error) {
        afficherMessage("La photo n'a pas pu être supprimée.", "messageErreur");
        return;
    }

    // Remettre l'avatar par défaut
    apercu.src = AVATAR;
    nouvellePhoto = null;
    champPhoto.value = "";
    boutonSupprimer.hidden = true;
    afficherMessage("Photo supprimée.", "messageSucces");
});
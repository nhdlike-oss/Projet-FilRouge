// Aperçu de la photo de profil choisie
const champPhoto = document.getElementById("photo");
const apercu = document.getElementById("apercu");
const formulaire = document.getElementById("formProfil");
const message = document.getElementById("messageProfil");
const boutonSupprimer = document.getElementById("supprimerPhoto");
const AVATAR = "image/avatar.png";

// la personne connectée
let utilisateur = null;
// la photo choisie, pas encore envoyée
let nouvellePhoto = null;


function afficherMessage(texte, classe) {
    message.textContent = texte;
    message.className = classe;
    message.hidden = false;
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
// Supprimer toutes les photos de l'utilisateur dans le storage
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
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
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

    // S'il existe, on remplit la page
    if (profil) {
        document.getElementById("pseudo").value = profil.pseudo || "";
        document.getElementById("bio").value = profil.bio || "";
        if (profil.avatar_url) {
            apercu.src = profil.avatar_url;
<<<<<<< Updated upstream
            boutonSupprimer.hidden = false;   
        
=======
            boutonSupprimer.hidden = false;
>>>>>>> Stashed changes
        }
    }
}

chargerProfil();

champPhoto.addEventListener("change", function () {
    const fichier = champPhoto.files[0];
    if (!fichier) return;

    const typesOk = ["image/png", "image/jpeg", "image/webp"];
    if (!typesOk.includes(fichier.type)) {
        alert("Choisis une image PNG, JPEG ou WEBP.");
        champPhoto.value = "";
        return;
    }

    // Vérifier la taille (2 Mo maximum)
    if (fichier.size > 2 * 1024 * 1024) {
        alert("L'image doit faire moins de 2 Mo.");
        champPhoto.value = "";
        return;
    }

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

    // Envoyer la photo dans le bucket "avatars"
    if (nouvellePhoto) {
        await supprimerAnciennesPhotos();
<<<<<<< Updated upstream
=======

        const extension = nouvellePhoto.type.split("/")[1];
        const chemin = utilisateur.id + "/avatar-" + Date.now() + "." + extension;
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    // 4. Supprimer la photo : retour à l'avatar par défaut
boutonSupprimer.addEventListener("click", async function () {
    if (!confirm("Supprimer ta photo de profil ?")) return;

    //On efface les fichiers dans le bucket
    await supprimerAnciennesPhotos();

    // vide le lien dans le profil
=======

// 4. Supprimer la photo : retour à l'avatar par défaut
boutonSupprimer.addEventListener("click", async function () {
    if (!confirm("Supprimer ta photo de profil ?")) return;

    // On efface les fichiers dans le bucket
    await supprimerAnciennesPhotos();

    // On vide le lien dans le profil
>>>>>>> Stashed changes
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
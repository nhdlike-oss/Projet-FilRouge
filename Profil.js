// Aperçu de la photo de profil choisie
const champPhoto = document.getElementById("photo");
const apercu = document.getElementById("apercu");
const formulaire = document.getElementById("formProfil");
const message = document.getElementById("messageProfil");

// la personne connectée
let utilisateur = null;     
// la photo choisie, pas encore envoyée
let nouvellePhoto = null;  


function afficherMessage(texte, classe) {
    message.textContent = texte;
    message.className = classe;
    message.hidden = false;
}
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

    // Afficher l'aperçu à la place de l'avatar
    apercu.src = URL.createObjectURL(fichier);
});
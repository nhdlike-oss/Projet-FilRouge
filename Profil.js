// Aperçu de la photo de profil choisie
const champPhoto = document.getElementById("photo");
const apercu = document.getElementById("apercu");

champPhoto.addEventListener("change", function () {
    const fichier = champPhoto.files[0];
    if (!fichier) return;

    const typesOk = ["image/png", "image/jpeg", "image/webp"];
    if (!typesOk.includes(fichier.type)) {
        alert("Choisis une image PNG, JPEG ou WEBP.");
        champPhoto.value = "";
        return;
    }
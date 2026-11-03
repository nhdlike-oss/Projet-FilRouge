const formulaire = document.getElementById("formConnexion");
const erreur = document.getElementById("erreurConnexion");

// Pour  « Se connecter »
formulaire.addEventListener("submit", async function (e) {
    e.preventDefault(); // empêche la page de se recharger

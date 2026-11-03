const formulaire = document.getElementById("formInscription");
const message = document.getElementById("messageInscription");

formulaire.addEventListener("submit", async function (e) {
    e.preventDefault(); 


    const courriel = document.getElementById("Courriel").value;
    const motDePasse = document.getElementById("Mot_de_pass").value;
    const confirmation = document.getElementById("Confirmer_Mot_de_pass").value;

    if (motDePasse !== confirmation) {
            message.textContent = "Les deux mots de passe ne sont pas identiques.";
            message.className = "messageErreur";
            message.hidden = false;
            return;
        }

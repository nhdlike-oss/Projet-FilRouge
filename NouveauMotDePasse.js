const formulaire = document.getElementById("formNouveau");
const message = document.getElementById("messageNouveau");

formulaire.addEventListener("submit", async function (e) {
    e.preventDefault();

    const motDePasse = document.getElementById("pwd").value;
    const confirmation = document.getElementById("pwdConfirm").value;

    //Les deux mots de passe doivent être identiques
    if (motDePasse !== confirmation) {
        message.textContent = "Les deux mots de passe ne sont pas identiques.";
        message.className = "messageErreur";
        message.hidden = false;
        return;
    }

    // Pour enregistrer le nouveau mot de passe dans Supabase
    const { error } = await client.auth.updateUser({ password: motDePasse });

    if (error) {
        message.textContent = "Le lien a expiré ou n'est plus valide. Refais une demande de mot de passe oublié.";
        message.className = "messageErreur";
        message.hidden = false;
        return;
    }

    // Retour à la connexion
    message.textContent = "Mot de passe changé ! Tu vas être redirigée vers la connexion…";
    message.className = "messageSucces";
    message.hidden = false;

    setTimeout(function () {
        window.location.href = "index.html";
    }, 2000); 
});
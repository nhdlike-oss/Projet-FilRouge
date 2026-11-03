const formulaire = document.getElementById("formConnexion");
const erreur = document.getElementById("erreurConnexion");

// Pour  « Se connecter »
formulaire.addEventListener("submit", async function (e) {
    e.preventDefault(); // empêche la page de se recharger

    const courriel = document.getElementById("contact").value;
    const motDePasse = document.getElementById("pwd").value;

    // vérification par Supabase
    const { error } = await client.auth.signInWithPassword({
        email: courriel,
        password: motDePasse
 });

    if (error) {
        erreur.textContent = "Courriel ou mot de passe incorrect.";
        erreur.hidden = false;
    }
    
    else {
        window.location.href = "Conversation.html";
    }
});
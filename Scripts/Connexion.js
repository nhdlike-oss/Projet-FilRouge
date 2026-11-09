const formulaire = document.getElementById("formConnexion");
const erreur = document.getElementById("erreurConnexion");

// Pour  « Se connecter »
formulaire.addEventListener("submit", async function (e) {
    e.preventDefault(); // empêche la page de se recharger

    const courriel = document.getElementById("contact").value.trim();
    const motDePasse = document.getElementById("pwd").value;

    // Demande à Supabase de vérifier le courriel et le mot de passe
    const { error } = await client.auth.signInWithPassword({
        email: courriel,
        password: motDePasse
 });

     // Affiche une erreur si la connexion échoue, sinon redirige vers la messagerie
    if (error) {
        erreur.textContent = "Courriel ou mot de passe incorrect.";
        erreur.hidden = false;
    }
    
    else {
        window.location.href = "Conversation.html";
    }
});
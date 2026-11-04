// Pour envoyer le lien afin changer le mot de passe

const formulaire = document.getElementById("formOubli");
const message = document.getElementById("messageOubli");

formulaire.addEventListener("submit", async function (e) {
    e.preventDefault();

    const courriel = document.getElementById("contact").value;

    //Demande à Supabase d'envoyer le lien
    await client.auth.resetPasswordForEmail(courriel, {
        redirectTo: new URL("NouveauMotDePasse.html", window.location.href).href
});

    // Même message dans tous les cas (sécurité)
    message.textContent = "Nous vous avons envoyé un courriel à votre adresse.  Si vous ne le trouvez pas, regardez vos pourriels";
    message.className = "messageSucces";
    message.hidden = false;
    formulaire.reset();
});

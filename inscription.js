const formulaire = document.getElementById("formInscription");
const message = document.getElementById("messageInscription");

formulaire.addEventListener("submit", async function (e) {
    e.preventDefault(); 


    const courriel = document.getElementById("Courriel").value.trim();
    const motDePasse = document.getElementById("Mot_de_pass").value;
    const confirmation = document.getElementById("Confirmer_Mot_de_pass").value;

    if (motDePasse !== confirmation) {
            message.textContent = "Les deux mots de passe ne sont pas identiques.";
            message.className = "messageErreur";
            message.hidden = false;
            message.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

    // Demande à Supabase de créer le compte
    const { data, error } = await client.auth.signUp({
        email: courriel,
        password: motDePasse,
        options: {
            data: {
                numero: document.getElementById("Numero_Cell").value,
                age: document.getElementById("Age").value,
                pays: document.getElementById("pays").value
            }
        }
    });

       
       if (error) {
        const texte = error.message.toLowerCase();

        if (texte.includes("rate limit")) {
            message.textContent = "Trop d'essais. Attends quelques minutes, puis réessaie.";
        } else if (texte.includes("already registered")) {
            message.textContent = "Impossible de créer le compte avec ce courriel.";
        } else if (texte.includes("password")) {
            message.textContent = "Mot de passe trop faible : au moins 8 caractères, avec un chiffre, une majuscule et un caractère spécial.";
        } else {
            message.textContent = "Une erreur est survenue. Réessaie plus tard.";
        }
        message.className = "messageErreur";
        message.hidden = false;
        message.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }
    if (data.session) {

            // Pour connecter la personne directement à la page messagerie
            window.location.href = "Conversation.html";
        } else {
            // Supabase demande de confirmer le courriel d'abord
            message.textContent = "Compte créé ! Ouvre le courriel reçu pour confirmer ton inscription, puis connecte-toi.";
            message.className = "messageSucces";
            message.hidden = false;
            
             // On cache le formulaire et on montre bien le message
        formulaire.hidden = true;
        message.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });

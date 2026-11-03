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

const spanNom = document.getElementById("parametres-nom");
const boutonDeconnexion = document.getElementById("bouton-deconnexion");
const boutonSupprimer = document.getElementById("bouton-supprimer");




async function afficherUtilisateur() {
  const { data } = await client.auth.getSession();

  if (data.session === null) {
    spanNom.textContent = "personne";
    return;
  }
   const user = data.session.user;
  spanNom.textContent = user.user_metadata.username || user.email;
}

boutonDeconnexion.addEventListener("click", async function () {
  await client.auth.signOut();
  window.location.href = "index.html";
});
boutonSupprimer.addEventListener("click", async function () {

     const sur = confirm("Supprimer définitivement ton compte et tes messages ?");
  if (!sur) return;
   const { error } = await client.rpc("supprimer_mon_compte"); await client.auth.signOut();
  window.location.href = "index.html";
});

afficherUtilisateur();
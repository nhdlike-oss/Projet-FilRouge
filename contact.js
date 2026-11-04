// ============================================
// contact: rechercher, ajouter et inviter des contacts
// ============================================

const champRecherche = document.getElementById("recherche");
const listeResultats = document.getElementById("resultats");
const listeContacts = document.getElementById("mesContacts");
const formInvitation = document.getElementById("formInvitation");
const AVATAR = "image/avatar.png";

let utilisateur = null;   // la personne connectée
let mesIds = [];          // les id de mes contacts
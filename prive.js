// ============================================
// prive.js : discussion privée entre deux personnes
// ============================================

const AVATAR = "image/avatar.png";
const listeMessages = document.getElementById("messages");
const formulaire = document.getElementById("formulaire");
const champ = document.getElementById("champ");

// L'id du contact est dans l'adresse : Prive.html?avec=ID
const amiId = new URLSearchParams(window.location.search).get("avec");

let utilisateur = null;   
let moi = null;           
let ami = null;           
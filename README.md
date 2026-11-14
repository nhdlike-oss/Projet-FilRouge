  # Projet-FilRouge

**Nom du projet :** JaWse (messagerie instantanée Web)

**Site Web :**    https://nhdlike-oss.github.io/Projet-FilRouge/html/index.html

## Description

JaWse est une messagerie instantanée Web. Elle permet d'échanger en temps réel des messages avec ses contacts et dans des salons de conversation. Chaque personne peut aussi choisir un pseudo et une photo de profil pour se faire reconnaître.

## Objectif

Offrir un espace simple, rapide et accessible pour discuter directement depuis un navigateur, sur ordinateur comme sur téléphone sans rien installer.

## Fonctionnalités principales

- Inscription et connexion
- Liste de contacts
- Liste des salons de conversation (les salons sont publics : toute personne connectée peut les voir, y écrire et en créer)
- Envoi et réception de messages texte en temps réel
- Affichage horodaté des messages

## Fonctionnalités secondaires

- Notifications visuelles, avec historique
- Partage d'images dans les messages
- Indicateur « en ligne »
- Indicateur « en train d'écrire… »
- Affichage adapté au téléphone

## Fonctionnalité supplémentaire

**Profil utilisateur avec photo** : chaque personne peut choisir un pseudo et téléverser sa photo de profil. La photo s'affiche à côté de ses messages dans les salons et dans la liste des personnes en ligne.

## Confirmation de l'adresse courriel

La confirmation par courriel est **désactivée** dans Supabase : une personne qui s'inscrit est connectée tout de suite sans courriel de confirmation .

Pourquoi : quand elle est activée, Supabase envoie un courriel à chaque inscription et son service gratuit limite fortement le nombre de courriels par heure. Après quelques essais, l'inscription affiche « Trop d'essais. Attends quelques minutes ». Pendant un test entre camarades, cela pourrait empêcher quelqu'un de créer un compte.

Le code d'inscription (`Inscription.js`) gère les deux cas : avec la confirmation désactivée la personne arrive directement sur la messagerie. Si elle était réactivée la page afficherait « Ouvre le courriel reçu pour confirmer ton inscription ».

## Technologies utilisées

- HTML, CSS, JavaScript
- Supabase (comptes, base de données, temps réel, stockage des photos et des images)
- GitHub Pages (publication du site)

## Équipe et répartition du travail

- Nene Hassy Diallo  : conversation, salons, messages texte en temps réel, notifications, partage d'images, paramètres(déconnexion, suppression du compte),Affichage horodaté des messages , affichage téléphone, Readme
- Suzie Valentin : index ,inscription, connexion, mot de passe oublié, contacts,  nouveau mot de pass,  photos de profil, affichage des photos de profil dans la conversation, affichage téléphone

## Structure du projet
```
Projet-FilRouge/
├──html/
   ├── index.html
   ├── Connexion.html
   ├── CreerCompte.html
   ├── Mot_de_Pass_Oublie.html
   ├── Conversation.html
   ├── Contact.html
   ├── Profil.html
   ├── Notification.html
   ├── Parametres.html/
   ├──Condition_utulisation.html
   ├── Politique_confidentialite.html
   ├── NouveauMoDePasses.html/
├──Style.css/
├── Script.js/
   ├── Supabase.js
   ├── Connexion.js
   ├── Inscription.js
   ├── MotDePasse.js
   ├── NouveauMotDePasse.js
   ├── Conversation.js
   ├── Contact.js
   └── Profil.js
   ├── Parametre.js
   ├── Script.js
   ├── Notification.js/
├── image/
└── README.md
```

## A savoir 
Les salons sont publics et restent après la suppression du compte de la personne qui les a créés car d'autres personnes y ont écrit. Il n'y a pas de messages privés( qui serais une fonctionalite supp)


## Améliorations possibles

- Supprimer ou modifier un message ou image  déjà envoyé
- Messages privés entre deux personnes
- Indicateur « message lu »
-  Afficher les messages reçus pendant une absence (déconnexion ou hors ligne)

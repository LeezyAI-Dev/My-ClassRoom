// Base de connaissances locale de Mia (repli quand l'IA est indisponible, et pastilles de suggestion).
// À tenir à jour quand l'appli change (voir README §7).

export const SCREEN_LABEL = {
  schedule: "Ouvrir l'emploi du temps",
  subjects: "Ouvrir les matières",
  grades: "Ouvrir le registre de notes",
  average: "Ouvrir le calculateur",
  eyes: "Ouvrir EYES",
  checklist: "Ouvrir la checklist",
};

// Phrase d'accueil selon l'écran où se trouve la personne.
export const SCREEN_START = {
  dashboard: "Tu es sur l'accueil : tu y vois l'emploi du temps de la semaine et les cartes vers chaque section.",
  schedule: "Tu es dans l'emploi du temps. Tu peux passer de la vue Semaine à la vue Jour.",
  subjects: "Tu es dans les matières : les Générales et les Techniques, avec leurs ressources.",
  grades: "Tu es dans le registre de notes. Il est privé : toi seul vois tes notes.",
  average: "Tu es dans le calculateur de moyenne, sur 20, avec les coefficients.",
  checklist: "Tu es dans la checklist : la liste des élèves inscrits.",
};

// Suggestions affichées selon l'écran.
export const SCREEN_HINT = {
  dashboard: ["schedule", "subjects", "grades", "eyes"],
  schedule: ["schedule", "subjects", "average"],
  subjects: ["subjects", "grades", "average"],
  grades: ["grades", "average", "privacy"],
  average: ["average", "grades", "subjects"],
  checklist: ["checklist", "login", "schedule"],
};

export const DEFAULT_HINT = ["schedule", "subjects", "grades", "average"];

export const CHIP_LABEL = {
  schedule: "Emploi du temps",
  subjects: "Matières",
  grades: "Registre de notes",
  average: "Calculer ma moyenne",
  eyes: "C'est quoi EYES ?",
  login: "Connexion et PIN",
  privacy: "Mes notes sont-elles privées ?",
  checklist: "Checklist",
  banner: "Bannière d'accueil",
};

// role: "all" = texte commun ; "student" / "developer" = textes spécifiques.
// `dev: true` = sujet réservé au développeur.
export const TOPICS = {
  schedule: {
    keywords: ["emploi du temps", "horaire", "cours", "planning", "semaine", "salle", "prof", "professeur", "edt"],
    text: {
      student:
        "L'emploi du temps a deux vues : Semaine et Jour. Pour chaque cours tu vois la salle et le professeur.",
      developer:
        "L'emploi du temps a deux vues : Semaine et Jour, avec salle et professeur. En tant que développeur, tu ajoutes (« + cours »), modifies et supprimes les créneaux.",
    },
    screen: "schedule",
    next: ["subjects", "average"],
  },
  subjects: {
    keywords: ["matiere", "ressource", "pdf", "lien", "cours technique", "generale", "technique", "fichier", "support"],
    text: {
      student:
        "Dans Matières, tu as deux onglets : Générales et Techniques. Chaque matière contient des ressources : des PDF et des liens.",
      developer:
        "Dans Matières, il y a les onglets Générales et Techniques. Chaque matière a ses ressources : tu peux envoyer des PDF (20 Mo max) et ajouter des liens.",
    },
    screen: "subjects",
    next: ["grades", "average"],
  },
  grades: {
    keywords: ["note", "registre", "copie", "controle", "devoir", "resultat", "bulletin"],
    text: {
      all: "Le registre de notes est privé : chacun ne voit que ses notes. Tu ajoutes une note par matière (sur 10, 20…), avec la photo de la copie si tu veux.",
    },
    screen: "grades",
    next: ["average", "privacy"],
  },
  average: {
    keywords: ["moyenne", "calcul", "coefficient", "coef", "sur 20", "calculateur"],
    text: {
      all: "Le calculateur de moyenne marche sur 20 avec les coefficients : tu entres tes notes et leurs coefficients, et il te donne ta moyenne.",
    },
    screen: "average",
    next: ["grades", "subjects"],
  },
  eyes: {
    keywords: ["eyes", "fil", "photo", "video", "publier", "publication", "commentaire", "like", "aime", "story"],
    text: {
      all: "EYES est le fil de la classe, en plein écran : photos et vidéos, j'aime, commentaires et publication.",
    },
    screen: "eyes",
    next: ["schedule", "subjects"],
  },
  login: {
    keywords: ["connexion", "connecter", "mot de passe", "pin", "code", "oublie", "compte", "deconnexion", "login"],
    text: {
      all: "Tu te connectes avec ton mot de passe, puis tu choisis un code PIN propre à ton téléphone. Si tu as oublié ton code, « code oublié » te redemande ton mot de passe. Je ne te demanderai jamais ton mot de passe ni ton PIN.",
    },
    screen: null,
    next: ["privacy", "schedule"],
  },
  privacy: {
    keywords: ["prive", "confidentiel", "voit", "voir mes notes", "donnees", "securite", "personnel"],
    text: {
      all: "Oui, tes notes sont privées : personne d'autre ne les voit dans le registre. Moi non plus, je n'ai accès ni aux notes ni aux comptes.",
    },
    screen: "grades",
    next: ["grades", "login"],
  },
  checklist: {
    dev: true,
    keywords: ["checklist", "liste des eleves", "eleve", "inscrit", "suspendre", "suspension", "supprimer"],
    text: {
      developer: "La checklist liste les élèves inscrits. Tu peux y supprimer ou suspendre un compte.",
    },
    screen: "checklist",
    next: ["banner", "schedule"],
  },
  banner: {
    dev: true,
    keywords: ["banniere", "carrousel", "defilante", "image accueil"],
    text: {
      developer: "La bannière d'accueil est le carrousel d'images en haut de l'accueil. Le bouton « Gérer » te permet d'en changer les images.",
    },
    screen: null,
    next: ["checklist", "schedule"],
  },
};

export const GREETING = {
  student: "Salut, moi c'est Mia, ton guide My ClassRoom. Pose-moi une question ou choisis un sujet.",
  developer: "Salut, moi c'est Mia. Je peux t'expliquer chaque écran de My ClassRoom, y compris les outils développeur.",
};

export const UNKNOWN_TEXT =
  "Je n'ai pas bien compris. Essaie avec un mot comme « emploi du temps », « notes » ou « moyenne », ou choisis un sujet ci-dessous.";

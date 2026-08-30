# My ClassRoom — V1

Étapes réalisées :
1. Fondation : écran "Vous êtes ?" → Compte développeur → Inscription/Connexion
2. Menu principal → "Matières" et "Emploi du temps"

## Lancer le backend

```
cd backend
npm install
cp .env.example .env   # puis change JWT_SECRET par une valeur aléatoire
npm start
```
API disponible sur http://localhost:4000

## Lancer le frontend

```
cd frontend
npm install
npm run dev
```
App disponible sur http://localhost:5173 (le proxy Vite redirige /api vers le backend).

## Ce qui a été testé et validé

1. Affichage de l'écran "Vous êtes ?"
2. Accès au compte développeur (bouton)
3. Inscription (identifiant + mot de passe + confirmation, validations, hash bcrypt)
4. Connexion (JWT retourné, rejet si mauvais identifiants)
5. Arrivée sur la page blanche après connexion réussie

## Sécurité

- Les mots de passe sont hashés avec bcrypt (12 rounds), jamais stockés en clair.
- La connexion retourne un token JWT (expire après 12h), gardé en mémoire côté client (pas de localStorage).

## Étape 2 — Matières et Emploi du temps

**Matières** : menu accessible depuis le tableau de bord, affichant deux groupes :
- Générales : Mathématiques, Français, CMC, Législation, EDHC, Physique Chimie, EPS, Anglais
- Techniques : Photogravure, Impression, P.A.O, Façonnage, Fabrication, Maquette

**Emploi du temps** : tableau par jour (Lundi à Samedi), créneaux entre 08:00 et 17:00.
- Consultation libre pour tous
- Ajout / modification / suppression de créneaux réservés au compte développeur connecté (protégé par JWT)
- Chaque créneau : jour, heure de début, heure de fin, matière, salle (optionnel), professeur (optionnel)
- Validation serveur : horaires entre 08:00–17:00, jour entre lundi et samedi

Testé : création, modification, suppression de créneaux, et blocage des écritures sans authentification.

## Étape 3 — Ressources par matière (PDF + liens)

Chaque matière peut avoir des ressources associées :
- **PDF** : upload d'un fichier (20 Mo max), stocké dans `backend/uploads/` sous un nom aléatoire, servi en lecture via `/uploads/...`.
- **Liens de redirection** : simple titre + URL (http/https), ouverts dans un nouvel onglet.

Règles :
- Consultation libre pour tous (comme l'emploi du temps).
- Ajout (PDF ou lien) et suppression réservés au compte développeur connecté (JWT).
- Suppression d'un PDF = suppression de l'entrée en base **et** du fichier sur disque.
- Types de fichiers vérifiés côté serveur (extension + MIME) : seuls les `.pdf` sont acceptés.

Testé : upload PDF, refus d'un fichier non-PDF, ajout/suppression de lien, blocage des écritures sans authentification, suppression effective du fichier sur disque.

⚠️ Le dossier `backend/uploads/` contient les fichiers PDF uploadés par les développeurs — non versionné (voir `.gitignore`), à sauvegarder séparément en production.

## Étape 4 — Espace élève (consultation seule)

Un élève peut créer un compte et se connecter, séparément du compte développeur :
- **Inscription / connexion** : mêmes règles que le compte développeur (identifiant 3+ caractères, mot de passe 8+ caractères, hash bcrypt), table `students` dédiée, JWT avec `role: "student"`.
- **Aucun droit de modification** : le middleware `requireAuth` (utilisé par toutes les routes d'écriture) vérifie désormais explicitement `role === "developer"` et rejette (403) tout token élève, même valide. Un middleware `requireStudentAuth` existe en réserve si une route réservée aux élèves devient nécessaire plus tard.
- **Consultation identique à l'accès public** : matières, emploi du temps (vue jour ET vue semaine) et ressources (PDF, liens) — ces routes étaient déjà en lecture libre, l'élève y accède donc naturellement une fois connecté.
- **Mise à jour automatique** : le frontend rafraîchit en arrière-plan (toutes les 5 secondes, sans rechargement ni clignotement) l'emploi du temps et les ressources par matière, pour que les ajouts/modifications/suppressions faits par le développeur apparaissent côté élève au fur et à mesure.
- Côté interface, les formulaires et boutons d'édition/suppression sont conditionnés au rôle `developer` (et non plus simplement à la présence d'un token), pour qu'un élève connecté ne les voie jamais.

Testé : inscription élève, connexion élève, refus (403) d'un token élève sur les routes de création/modification/suppression, consultation en temps quasi-réel des changements faits par le compte développeur.

## Étape 5 — Bannière défilante sur le tableau de bord

Un bandeau d'images façon site vitrine s'affiche en haut du tableau de bord, sous l'en-tête et au-dessus du menu :
- **Défilement automatique** : fondu enchaîné entre les images toutes les 4 secondes, avec des indicateurs cliquables en bas du bandeau.
- **Consultation publique** : visible par tous (élève et développeur) sans authentification.
- **Gestion réservée au développeur** : un panneau dédié sur le tableau de bord (visible uniquement en compte développeur) permet d'ajouter une image (JPG/PNG/WEBP, 8 Mo max, vérifié côté serveur par extension + MIME) et d'en supprimer, avec suppression du fichier sur disque en plus de l'entrée en base.
- **Mise à jour automatique** : comme pour l'emploi du temps et les ressources, la bannière se rafraîchit en arrière-plan (toutes les 8 secondes) pour que les images ajoutées/supprimées par le développeur apparaissent chez l'élève sans recharger la page.
- Fichiers stockés dans `backend/uploads/banners/` (non versionné, comme les PDF), servis via `/uploads/banners/...`.

Testé : upload d'image en tant que développeur, rejet d'un fichier non-image (400), consultation publique sans token, accès statique au fichier, suppression (entrée + fichier).

## Ce qui n'est PAS encore développé (volontairement)

Contenu structuré des cours au-delà des ressources (PDF/liens), comptes délégués, notes, devoirs, notifications, SOS, paiements, IA, fil vidéo.

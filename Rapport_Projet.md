# RAPPORT DÉTAILLÉ DE PROJET : PORTAL (Absence Management Platform)

---

## 1. Introduction Générale
Le projet **PORTAL** est né d'un constat simple : la gestion traditionnelle des présences en milieu universitaire est souvent fastidieuse, sujette aux erreurs humaines et difficilement exploitable pour des analyses statistiques. 

L'objectif de cette plateforme est de fournir un **écosystème numérique complet** qui ne se contente pas de numériser les feuilles de présence, mais offre une véritable intelligence de gestion. Grâce à une architecture moderne et une interface centrée sur l'utilisateur, PORTAL devient l'outil central de la vie académique pour l'administration, le corps enseignant et les étudiants.

---

## 2. Analyse Approfondie des Besoins

### 2.1 Analyse Fonctionnelle par Acteur
Le système a été conçu pour répondre précisément aux workflows de chaque utilisateur :

*   **L'Administrateur (Le Pivot)** :
    *   **Contrôle Total (CRUD)** : Capacité de créer, modifier et révoquer des accès pour les étudiants et les enseignants.
    *   **Maître Académique** : Gestion du catalogue de modules (matières) et organisation structurelle des départements.
    *   **Planification Stratégique** : Création de séances de cours dynamiques (Time Slots) liant un professeur, une matière, une salle et un groupe d'élèves.
    *   **Communication Globale** : Système de "Broadcast" pour diffuser des informations critiques instantanément sur tous les tableaux de bord.

*   **L'Enseignant (L'Utilisateur de Terrain)** :
    *   **Mobilité & Réactivité** : Interface optimisée pour une saisie rapide des présences en début de cours.
    *   **Suivi Pédagogique** : Consultation de son emploi du temps personnel et accès à la liste des étudiants par session.
    *   **Évaluation Intégrée** : Système de saisie des notes (Grading) pour centraliser tous les indicateurs de performance.

*   **L'Étudiant (Le Bénéficiaire)** :
    *   **Transparence** : Consultation en temps réel de son propre taux d'absentéisme.
    *   **Organisation** : Accès à son emploi du temps hebdomadaire mis à jour par l'administration.
    *   **Résultats** : Consultation sécurisée des notes et des bulletins de performance.

---

## 3. Conception & Architecture Technique

### 3.1 Architecture Découplée (Decoupled Architecture)
Nous avons fait le choix d'une architecture moderne séparant strictement les données de la présentation :
*   **Backend (Moteur)** : Développé en **Python 3.10+** avec le framework **Django**. Nous utilisons **Django REST Framework (DRF)** pour exposer une API robuste et sécurisée.
*   **Frontend (Interface)** : Développé en **React 18** avec l'outil de build **Vite**. Cette approche "Single Page Application" (SPA) garantit une navigation instantanée sans rechargement de page.
*   **Base de Données** : **SQLite** est utilisé pour sa légèreté et sa facilité de déploiement en environnement universitaire, tout en respectant scrupuleusement les relations SQL complexes.

### 3.2 Modélisation des Données (Schema)
Le cœur du système repose sur un schéma relationnel optimisé :
*   **User Model** : Étendu pour gérer les rôles (Admin, Teacher, Student) et les informations de profil (Matricule, Photo, Service).
*   **Course/Module** : Entité regroupant les matières enseignées.
*   **Session/Schedule** : Lien temporel entre un module, une classe et un enseignant.
*   **Attendance** : Table de jonction enregistrant l'état (Présent/Absent) pour chaque étudiant par session.

---

## 4. Design & Expérience Utilisateur (UX)

### 4.1 Identité Visuelle : "Glassmorphism"
Pour sortir des interfaces austères habituelles, nous avons implémenté le style **Glassmorphism** :
*   **Translucidité** : Utilisation de `backdrop-filter: blur()` pour un effet de verre dépoli.
*   **Profondeur** : Ombres portées douces et bordures subtiles pour une hiérarchie visuelle claire.
*   **Typographie** : Utilisation de polices modernes sans empattement pour une lisibilité maximale.

### 4.2 Mode Sombre & Clair (Dynamic Themes)
Le système intègre un moteur de thèmes complet :
*   **Thème Sombre** : Fond Navy-Slate (`#0B1120`) pour réduire la fatigue visuelle.
*   **Thème Clair** : Fond Soft-Grey (`#F8FAFC`) pour une clarté maximale en environnement lumineux.

---

## 5. Méthodologie & Réalisation des Travaux

### 5.1 Étapes du Développement
1.  **Phase d'Analyse** : Rédaction du cahier des charges et définition des use-cases.
2.  **Phase de Conception** : Création du schéma de base de données et des wireframes de l'interface.
3.  **Phase de Développement Backend** : Implémentation des modèles Django et des endpoints d'API.
4.  **Phase de Développement Frontend** : Création des composants React et intégration du design system.
5.  **Phase d'Intégration & Tests** : Connexion des deux parties et validation des workflows (CRUD, login, attendance).

### 5.2 Organisation & Répartition des Tâches
Le groupe a fonctionné comme une véritable agence de développement logicielle :

*   **Owais BAKKALI (Lead Architect)** : Conception du design system, architecture React et gestion du moteur de thèmes.
*   **Amjad AHRRAR (Backend Manager)** : Développement des API Django, gestion de la sécurité JWT et migrations de base de données.
*   **Amine HABZ (Data Strategist)** : Modélisation des relations complexes et intégration des scripts de population de données.
*   **Bachar DOUKHANA (QA Engineer)** : Tests d'intégration, optimisation des performances front-end et gestion de la réactivité.
*   **Bilal MESBAHI (Product Owner)** : Documentation technique, rédaction du rapport final et coordination des fonctionnalités avec le cahier des charges.

---

## 6. Conclusion & Perspectives
Le projet **PORTAL** démontre qu'une gestion administrative peut être à la fois rigoureuse sur le plan technique et agréable sur le plan visuel. En utilisant Python et Django, nous avons construit un socle solide capable d'évoluer. 

**Perspectives futures** :
*   Intégration d'un système de notifications par Email/SMS.
*   Module de génération de rapports statistiques PDF automatisés.
*   Application mobile dédiée pour la prise de présence par QR Code.
